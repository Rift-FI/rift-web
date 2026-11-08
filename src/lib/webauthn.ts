/**
 * WebAuthn helpers for passkey-owned wallets.
 *
 * Every Rift wallet is a Safe owned only by the user's passkeys (P-256).
 * The passkey signs the 32-byte hash the backend returns from a preview
 * (SafeOp EIP-712 hash / SafeMessage hash); the Safe verifies it on-chain.
 *
 * Two surfaces:
 *   - enrolPasskey()    → registration; returns the raw attestation the
 *                         backend verifies (POST /v1/wallet/passkeys)
 *   - signWithPasskey() → assertion over hashToSign; returns the AuthProof
 *                         every submit / approve endpoint takes
 *
 * Google / Apple are login only — there is no OIDC signing path.
 */

import {
  b64ToBytes,
  bytesToB64,
  hashToChallenge,
} from "./passkeyUtils";

/** Spec §2a — standard base64 of the raw bytes; signature is the DER. */
export interface AuthProof {
  kind: "passkey";
  cred_id_b64: string;
  client_data_json_b64: string;
  authenticator_data_b64: string;
  signature_b64: string;
}

/** Spec §2c — body.attestation of POST /v1/wallet/passkeys. */
export interface PasskeyAttestation {
  cred_id_b64: string;
  client_data_json_b64: string;
  attestation_object_b64: string;
}

export function isPasskeyEnrolmentSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.create === "function"
  );
}

/**
 * WebAuthn requires the document to have OS-level focus at the moment
 * `.get()` / `.create()` runs. Chromium throws a synchronous
 * "The document is not focused" NotAllowedError when
 * document.hasFocus() is false — most commonly caused by DevTools
 * being open + focused, an OAuth popup that never closed, or the
 * user Alt-Tab'ing during our async awaits (preview round-trip).
 *
 * Best-effort recovery: try window.focus(), wait one tick, re-check. If
 * still not focused, throw an actionable error instead of the browser's
 * generic NotAllowed.
 */
async function ensureDocumentFocused(): Promise<void> {
  if (typeof document === "undefined") return;
  if (typeof document.hasFocus !== "function") return; // ancient browser — skip
  if (document.hasFocus()) return;
  try {
    window.focus();
  } catch {
    // ignore — some contexts (sandboxed iframes) throw
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  if (document.hasFocus()) return;
  throw new Error(
    "Face ID / Touch ID needs this browser tab in the foreground. Close DevTools or any popups, click back on this page, and try again."
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isPasskeyEnrolmentSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** user.id from the server: b64url bytes when decodable, else UTF-8. */
function userIdBytes(id: string | undefined): Uint8Array {
  if (!id) return new TextEncoder().encode(crypto.randomUUID());
  if (/^[A-Za-z0-9_\-+/]+=*$/.test(id)) {
    try {
      const bytes = b64ToBytes(id);
      if (bytes.length > 0 && bytes.length <= 64) return bytes;
    } catch {
      /* fall through */
    }
  }
  return new TextEncoder().encode(id);
}

/**
 * Run a WebAuthn registration ceremony with the server-issued options
 * (POST /v1/wallet/passkeys/options). ES256 (-7) only — the Safe passkey
 * signer verifies P-256 and nothing else. Discoverable credential + UV
 * required so the passkey syncs and always asks for biometrics / PIN.
 */
export async function enrolPasskey(opts: {
  rpId: string;
  rpName: string;
  userName: string;
  userDisplayName?: string;
  /** server user.id (b64url) */
  userId?: string;
  /** server challenge (b64url, 32 bytes) */
  challenge: string;
  /** credential ids already on the wallet (b64 / b64url) */
  excludeCredIds?: string[];
}): Promise<{ attestation: PasskeyAttestation; credIdB64: string }> {
  if (!isPasskeyEnrolmentSupported()) {
    throw new Error("passkey not supported in this browser");
  }
  await ensureDocumentFocused();
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: b64ToBytes(opts.challenge) as BufferSource,
      rp: { id: opts.rpId, name: opts.rpName },
      user: {
        id: userIdBytes(opts.userId) as BufferSource,
        name: opts.userName,
        displayName: opts.userDisplayName || opts.userName,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "required",
        requireResidentKey: true,
      },
      excludeCredentials: (opts.excludeCredIds ?? []).map((id) => ({
        type: "public-key" as const,
        id: b64ToBytes(id) as BufferSource,
      })),
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("WebAuthn returned no credential");

  const response = credential.response as AuthenticatorAttestationResponse;
  const credIdB64 = bytesToB64(new Uint8Array(credential.rawId));
  return {
    credIdB64,
    attestation: {
      cred_id_b64: credIdB64,
      client_data_json_b64: bytesToB64(new Uint8Array(response.clientDataJSON)),
      attestation_object_b64: bytesToB64(new Uint8Array(response.attestationObject)),
    },
  };
}

/**
 * Run a WebAuthn assertion ceremony over `hashHex`. The 32 raw hash
 * bytes ARE the challenge, so clientDataJSON.challenge ==
 * base64url(hashToSign) — the on-chain verifier and the backend both
 * check exactly that.
 *
 * `credIds`: the preview's allowCredentials (or the wallet's active
 * passkeys). Empty lets the browser offer any discoverable credential.
 */
export async function signWithPasskey(opts: {
  rpId: string;
  /** 0x-prefixed 32-byte hash from the preview step */
  userOpHashHex: string;
  credIds?: string[];
}): Promise<AuthProof> {
  if (!isPasskeyEnrolmentSupported()) {
    throw new Error("passkey not supported in this browser");
  }
  const challenge = hashToChallenge(opts.userOpHashHex);
  await ensureDocumentFocused();

  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: challenge as BufferSource,
      rpId: opts.rpId,
      timeout: 60000,
      userVerification: "required",
      allowCredentials: (opts.credIds ?? []).map((id) => ({
        type: "public-key" as const,
        id: b64ToBytes(id) as BufferSource,
      })),
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("WebAuthn returned no assertion");

  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    kind: "passkey",
    cred_id_b64: bytesToB64(new Uint8Array(credential.rawId)),
    client_data_json_b64: bytesToB64(new Uint8Array(response.clientDataJSON)),
    authenticator_data_b64: bytesToB64(new Uint8Array(response.authenticatorData)),
    signature_b64: bytesToB64(new Uint8Array(response.signature)),
  };
}
