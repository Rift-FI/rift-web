/**
 * Add-method flow orchestrator for v3 wallets.
 *
 * Choreography that pairs with the backend endpoints:
 *
 *   1. POST /wallet/methods/challenge
 *        → { challengeHex, ttlMs, expiresAtMs, ownerAddress }
 *   2. Enrol the NEW method (WebAuthn create() for a new passkey, or an
 *      OIDC sign-in for a new Google/Apple link) → newMethod
 *   3. Compute the bound reseal challenge (lib/boundReseal.ts):
 *        SHA-256("rift-reseal-v1" || 0x00 || ownerAddress || challenge
 *                || canonical(newMethod))
 *      and sign it with an EXISTING method (passkey assertion with the
 *      32 bytes as the WebAuthn challenge, or a Google id_token with the
 *      lowercase hex as nonce) → authProof. The new method has to be
 *      enrolled first because the consent proof commits to it.
 *      If the backend doesn't return `ownerAddress` (older backend), we
 *      fall back to the legacy proof over challengeHex itself, which
 *      the enclave accepts until per-project `require_bound_reseal`.
 *   4. POST /wallet/methods { authProof, newMethod }
 *        → { ok, ownerAddress, addedKind }
 *
 * The backend consumes the challenge on submit (single-use), calls the
 * enclave through /reseal-v3, and swaps the sealed envelope. Wallet
 * address never changes; only the enrolled_methods CBOR grows by one.
 */

import { getApiBase } from "./apiBase";
import {
  enrolPasskey,
  signWithPasskey,
  signWithOidc,
  type AuthProof,
  type EnrolledMethod,
} from "./webauthn";
import {
  nonCustodialConfig,
  decodeOidcMethodFromIdToken,
  invalidateEnrolledMethodsCache,
} from "./nonCustodial";
import { GOOGLE_CLIENT_ID } from "@/constants";
import { computeBoundResealChallengeHex } from "./boundReseal";
import { apiErrorFromResponse } from "./apiError";

/** Which method should authorize the add (chosen by the caller UI). */
export type ExistingMethodChoice = "passkey" | "google";

/** Which method to add. */
export type NewMethodKind = "passkey" | "google";

interface ChallengeResponse {
  challengeHex: string;
  ttlMs: number;
  expiresAtMs: number;
  /** Wallet's EOA owner (0x-hex). Added with the bound-reseal contract. */
  ownerAddress?: string | null;
}

interface AddSuccess {
  ok: true;
  ownerAddress: string;
  addedKind: string;
}

function backendHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(apiKey ? { "x-api-key": apiKey } : {}),
  };
}

/**
 * Ask the backend for a fresh 32-byte challenge. Throws with a readable
 * error string on any failure (401, NOT_V3, network) so the UI can
 * surface it in a toast.
 */
async function requestChallenge(): Promise<ChallengeResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/wallet/methods/challenge`, {
    method: "POST",
    headers: backendHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw await apiErrorFromResponse(res, "Could not issue add-method challenge");
  }
  const json = await res.json().catch(() => ({}));
  if (!json?.challengeHex) {
    throw new Error("Backend returned no challenge");
  }
  return json as ChallengeResponse;
}

/**
 * Fetch the passkey cred_ids sealed in the user's v3 envelope, so we
 * can constrain WebAuthn's allowCredentials to the credential(s) the
 * enclave will actually accept. Without this the browser prompts with
 * every passkey it has for the RP ID — orphans from failed attempts
 * included — and the user can pick one that doesn't match. Empty
 * result on 4xx / 5xx / network errors OR for legacy v3 envelopes
 * migrated before backend migration 20260803 landed — caller then
 * falls back to unconstrained selection, same as before this landed.
 */
async function fetchSealedPasskeyCredIds(): Promise<string[]> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/wallet/methods`, {
      headers: backendHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { passkeyCredIds?: string[] };
    return Array.isArray(body.passkeyCredIds) ? body.passkeyCredIds : [];
  } catch {
    return [];
  }
}

const EOA_RE = /^0x[0-9a-fA-F]{40}$/;

/**
 * The value the consent proof must be over: the bound challenge when the
 * backend gave us the wallet's EOA owner, otherwise the legacy raw server
 * nonce (with a warning, since the enclave stops accepting that once
 * `require_bound_reseal` is enabled for the project). Lowercase hex.
 */
export async function resolveConsentChallengeHex(
  challenge: Pick<ChallengeResponse, "challengeHex" | "ownerAddress">,
  newMethod: EnrolledMethod
): Promise<{ challengeHex: string; bound: boolean }> {
  const owner = challenge.ownerAddress;
  if (typeof owner === "string" && EOA_RE.test(owner)) {
    const hex = await computeBoundResealChallengeHex(
      owner,
      challenge.challengeHex,
      newMethod
    );
    return { challengeHex: hex, bound: true };
  }
  console.warn(
    "[rift] /wallet/methods/challenge returned no valid ownerAddress; " +
      "falling back to the legacy (unbound) reseal proof"
  );
  return { challengeHex: challenge.challengeHex.toLowerCase(), bound: false };
}

/**
 * Produce an authProof for the given challenge using the user's chosen
 * existing method. `challengeHex` becomes the raw WebAuthn challenge
 * bytes for passkeys, and the OIDC nonce (verbatim lowercase hex) for
 * Google.
 */
async function signChallengeWithExistingMethod(
  challengeHex: string,
  existing: ExistingMethodChoice,
  rpId: string,
  credIds: string[],
  googleClientId: string
): Promise<AuthProof> {
  if (existing === "google") {
    if (!googleClientId) {
      throw new Error("Google Client ID not configured");
    }
    return await signWithOidc({
      clientId: googleClientId,
      userOpHashHex: challengeHex,
    });
  }
  return await signWithPasskey({
    rpId,
    userOpHashHex: challengeHex,
    credIds,
  });
}

/**
 * Produce a new EnrolledMethod, matching what the caller wants to add.
 *
 * For passkey we enrol a fresh WebAuthn credential on the current
 * device — the browser stashes it (Chrome / iCloud) and the cred_id +
 * cose_pubkey travel to the enclave.
 *
 * For OIDC we run an id_token round-trip (any nonce; the enclave only
 * cares about the challenge on the auth-proof side, not on the new
 * method being enrolled) and decode iss+sub locally. The enclave will
 * never accept an OIDC identity it can't verify at sign time, so a
 * spoofed iss+sub silently becomes an unusable method — refuse
 * gracefully by demanding a real id_token here.
 */
async function enrolNewMethod(
  kind: NewMethodKind,
  rpId: string,
  rpName: string,
  userLabel: string,
  googleClientId: string
): Promise<EnrolledMethod> {
  if (kind === "passkey") {
    const { method } = await enrolPasskey({
      rpId,
      rpName,
      userName: userLabel,
    });
    return method;
  }
  if (!googleClientId) {
    throw new Error("Google Client ID not configured");
  }
  // The enrolment path also uses signWithOidc — same underlying Google
  // GSI flow, we just discard the id_token after extracting iss+sub.
  // Nonce here is opaque server-side (no challenge match required for
  // enrolment), so a random one is fine.
  const enrolmentNonce = crypto.randomUUID().replace(/-/g, "");
  const proof = await signWithOidc({
    clientId: googleClientId,
    userOpHashHex: enrolmentNonce,
  });
  if (proof.kind !== "oidc" || !proof.id_token) {
    throw new Error("Google returned no id_token");
  }
  const method = decodeOidcMethodFromIdToken(
    proof.id_token,
    "https://accounts.google.com"
  );
  if (!method) {
    throw new Error("Failed to parse Google id_token");
  }
  return method;
}

/**
 * POST the { authProof, newMethod } pair to /wallet/methods. Throws on
 * failure with the backend's error message.
 */
async function postAddMethod(
  authProof: AuthProof,
  newMethod: EnrolledMethod
): Promise<AddSuccess> {
  const base = getApiBase();
  const res = await fetch(`${base}/wallet/methods`, {
    method: "POST",
    headers: backendHeaders(),
    body: JSON.stringify({ authProof, newMethod }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw await apiErrorFromResponse(res, "Add-method failed");
  }
  const json = await res.json().catch(() => ({}));
  if (!json?.ok) {
    throw new Error(json?.error || `Add-method failed (${res.status})`);
  }
  return json as AddSuccess;
}

/**
 * Core flow, independent of build flags (exported for tests).
 *
 * Prompt order: the NEW method is enrolled first, then the EXISTING
 * method signs consent, because the bound challenge commits to the new
 * method. Both prompts go through webauthn.ts, so the document-focus
 * guard still runs before every navigator.credentials call.
 */
export async function runAddMethodFlow(args: {
  existing: ExistingMethodChoice;
  newKind: NewMethodKind;
  userLabel: string;
  rpId: string;
  rpName: string;
  googleClientId?: string;
  /** Already-enrolled passkey credential ids (from GET /wallet/methods). */
  existingPasskeyCredIds?: string[];
}): Promise<AddSuccess & { boundChallenge: boolean }> {
  const googleClientId = args.googleClientId ?? GOOGLE_CLIENT_ID ?? "";

  // Step 1: fetch the challenge first so NOT_V3 / auth errors fail fast,
  // before the user is asked to create anything. If the caller didn't
  // pass the sealed passkey cred_ids, fetch them in parallel so the
  // consent prompt is constrained to credentials the enclave accepts.
  const [challenge, sealedCredIds] = await Promise.all([
    requestChallenge(),
    args.existing === "passkey" && args.existingPasskeyCredIds === undefined
      ? fetchSealedPasskeyCredIds()
      : Promise.resolve(args.existingPasskeyCredIds ?? []),
  ]);

  // Step 2: enrol the new method.
  const newMethod = await enrolNewMethod(
    args.newKind,
    args.rpId,
    args.rpName,
    args.userLabel,
    googleClientId
  );

  // Step 3: consent with an existing method over the bound challenge.
  const consent = await resolveConsentChallengeHex(challenge, newMethod);
  // Never let the browser offer the passkey we just created for the
  // consent step: it isn't in the sealed envelope yet.
  const newCredId =
    newMethod.kind === "passkey" ? newMethod.cred_id_b64 : undefined;
  const credIds = sealedCredIds.filter(
    (id) => !!id && id !== newCredId
  );
  const authProof = await signChallengeWithExistingMethod(
    consent.challengeHex,
    args.existing,
    args.rpId,
    credIds,
    googleClientId
  );

  // Step 4: post to backend, enclave appends + reseals.
  const result = await postAddMethod(authProof, newMethod);
  return { ...result, boundChallenge: consent.bound };
}

/**
 * Public entry point. Runs the full add-method flow end-to-end.
 *
 * Caller responsibilities:
 *   - Choose which existing method should authorise (passkey vs Google)
 *   - Choose which new method to add
 *   - Handle the fact that both the new enrol AND the existing sign may
 *     pop a browser prompt back-to-back (Touch ID → Google, or vice
 *     versa). Provide a UI that guides the user through both.
 *
 * Invalidates the enrolled-methods cache on success so the next
 * transaction sees the new method in signWithPreferredMethod.
 */
export async function addWalletMethod(args: {
  existing: ExistingMethodChoice;
  newKind: NewMethodKind;
  userLabel: string;
  existingPasskeyCredIds?: string[];
}): Promise<AddSuccess> {
  const nc = nonCustodialConfig();
  if (!nc.enabled) {
    throw new Error(
      "Adding wallet methods is only available on non-custodial builds"
    );
  }

  const result = await runAddMethodFlow({
    ...args,
    rpId: nc.passkeyRpId,
    rpName: nc.passkeyRpName,
  });

  // Bust the cache so signWithPreferredMethod re-fetches the projection
  // on the next transaction.
  invalidateEnrolledMethodsCache();

  return result;
}
