/**
 * Minimal WebAuthn helpers for /app's v3 non-custodial path.
 *
 * Mirrors `PasskeyHelper` from `@rift-finance/wallet@3.x`, hand-rolled
 * here so we don't have to dual-install the v3 SDK alongside the
 * existing 1.4.x. Same wire shapes — the enclave can't tell which
 * client path produced the assertion.
 *
 * Two surfaces:
 *   - enrolPasskey() → returns EnrolledMethod for /auth/signup
 *   - signWithPasskey(userOpHashHex) → returns AuthProof for
 *     /v1/wallet/user-operations/submit-prepared
 */

export type EnrolledMethod =
  | { kind: "oidc"; iss: string; sub: string }
  | { kind: "passkey"; cred_id_b64: string; cose_pubkey_b64: string };

export type AuthProof =
  | { kind: "oidc"; id_token: string }
  | {
      kind: "passkey";
      cred_id_b64: string;
      client_data_json_b64: string;
      authenticator_data_b64: string;
      signature_b64: string;
    };

export function isPasskeyEnrolmentSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.create === "function"
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

/**
 * Run a WebAuthn enrolment ceremony. Prompts for biometric / device PIN.
 * Returns the EnrolledMethod ready to send in the /auth/signup body.
 *
 * `rpId` must match the enclave's pinned WebAuthnPolicy.accepted_rp_ids.
 * For app.riftfi.xyz that's "riftfi.xyz". For a sandbox app deployment
 * at sandbox.app.riftfi.com it's still "riftfi.com" (eTLD+1).
 */
export async function enrolPasskey(opts: {
  rpId: string;
  rpName: string;
  userName: string;
}): Promise<{ method: EnrolledMethod }> {
  if (!isPasskeyEnrolmentSupported()) {
    throw new Error("passkey not supported in this browser");
  }
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(crypto.randomUUID());
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { id: opts.rpId, name: opts.rpName },
      user: { id: userId, name: opts.userName, displayName: opts.userName },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("WebAuthn returned no credential");

  const response = credential.response as AuthenticatorAttestationResponse;
  const spki = new Uint8Array(response.getPublicKey() ?? new ArrayBuffer(0));
  const cose = spkiToCoseP256(spki);
  return {
    method: {
      kind: "passkey",
      cred_id_b64: b64(new Uint8Array(credential.rawId)),
      cose_pubkey_b64: b64(cose),
    },
  };
}

/**
 * Run a WebAuthn assertion ceremony. The user op hash IS the challenge —
 * the enclave verifies that clientDataJSON.challenge equals
 * `userOpHashHex` before unsealing the v3 envelope.
 *
 * `credIds`: pass the credential IDs the user enrolled (from prior
 * enrolPasskey calls / from the backend's `methods` field on the user).
 * Pass [] to let the browser show all eligible credentials.
 */
export async function signWithPasskey(opts: {
  rpId: string;
  userOpHashHex: string;
  credIds?: string[];
}): Promise<AuthProof> {
  if (!isPasskeyEnrolmentSupported()) {
    throw new Error("passkey not supported in this browser");
  }
  // The hash IS the challenge. Browser will set clientDataJSON.challenge
  // to base64url(challenge) and the enclave will compare against
  // user_op_hash bytes — same convention as the SDK's PasskeyHelper.sign.
  const challenge = hexToBytes(opts.userOpHashHex);

  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: opts.rpId,
      timeout: 60000,
      userVerification: "required",
      allowCredentials: (opts.credIds ?? []).map((id) => ({
        type: "public-key",
        id: b64ToBytes(id),
      })),
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("WebAuthn returned no assertion");

  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    kind: "passkey",
    cred_id_b64: b64(new Uint8Array(credential.rawId)),
    client_data_json_b64: b64(new Uint8Array(response.clientDataJSON)),
    authenticator_data_b64: b64(new Uint8Array(response.authenticatorData)),
    signature_b64: b64(new Uint8Array(response.signature)),
  };
}

// ─── helpers ─────────────────────────────────────────────────────────

function spkiToCoseP256(spki: Uint8Array): Uint8Array {
  if (spki.length < 65) throw new Error("SPKI too short to be P-256");
  const tail = spki.slice(-65);
  if (tail[0] !== 0x04) {
    throw new Error("not an uncompressed P-256 point — only ES256 supported");
  }
  const x = tail.slice(1, 33);
  const y = tail.slice(33, 65);
  // CBOR map(5): kty(1)=2, alg(3)=-7, crv(-1)=1, x(-2)=bytes(32), y(-3)=bytes(32)
  const out = new Uint8Array(77);
  let i = 0;
  out[i++] = 0xa5;
  out[i++] = 0x01; out[i++] = 0x02;
  out[i++] = 0x03; out[i++] = 0x26;
  out[i++] = 0x20; out[i++] = 0x01;
  out[i++] = 0x21; out[i++] = 0x58; out[i++] = 0x20; out.set(x, i); i += 32;
  out[i++] = 0x22; out[i++] = 0x58; out[i++] = 0x20; out.set(y, i); i += 32;
  return out;
}

function b64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBytes(s: string): Uint8Array {
  // Accept both b64 and b64url
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm + "=".repeat((4 - (norm.length % 4)) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error("odd-length hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
