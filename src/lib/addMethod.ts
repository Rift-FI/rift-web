/**
 * Add-method flow orchestrator for v3 wallets.
 *
 * Three-step choreography that pairs with the backend endpoints:
 *
 *   1. POST /wallet/methods/challenge
 *        → { challengeHex, ttlMs, expiresAtMs }
 *   2. Sign the challengeHex with an EXISTING method (passkey assertion
 *      or Google OIDC id_token) → authProof
 *   3. Enrol the NEW method (WebAuthn create() for a new passkey, or an
 *      OIDC sign-in for a new Google/Apple link) → newMethod
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

/** Which method should authorize the add (chosen by the caller UI). */
export type ExistingMethodChoice = "passkey" | "google";

/** Which method to add. */
export type NewMethodKind = "passkey" | "google";

interface ChallengeResponse {
  challengeHex: string;
  ttlMs: number;
  expiresAtMs: number;
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
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.error || `Could not issue add-method challenge (${res.status})`
    );
  }
  if (!json?.challengeHex) {
    throw new Error("Backend returned no challenge");
  }
  return json as ChallengeResponse;
}

/**
 * Produce an authProof for the given challenge using the user's
 * chosen existing method.
 */
async function signChallengeWithExistingMethod(
  challengeHex: string,
  existing: ExistingMethodChoice,
  rpId: string
): Promise<AuthProof> {
  if (existing === "google") {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error("Google Client ID not configured");
    }
    return await signWithOidc({
      clientId: GOOGLE_CLIENT_ID,
      userOpHashHex: challengeHex,
    });
  }
  return await signWithPasskey({
    rpId,
    userOpHashHex: challengeHex,
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
  userLabel: string
): Promise<EnrolledMethod> {
  if (kind === "passkey") {
    const { method } = await enrolPasskey({
      rpId,
      rpName,
      userName: userLabel,
    });
    return method;
  }
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Client ID not configured");
  }
  // The enrolment path also uses signWithOidc — same underlying Google
  // GSI flow, we just discard the id_token after extracting iss+sub.
  // Nonce here is opaque server-side (no challenge match required for
  // enrolment), so a random one is fine.
  const enrolmentNonce = crypto.randomUUID().replace(/-/g, "");
  const proof = await signWithOidc({
    clientId: GOOGLE_CLIENT_ID,
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
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(
      json?.error || `Add-method failed (${res.status})`
    );
  }
  return json as AddSuccess;
}

/**
 * Public entry point. Runs the full add-method flow end-to-end.
 *
 * Caller responsibilities:
 *   - Choose which existing method should authorise (passkey vs Google)
 *   - Choose which new method to add
 *   - Handle the fact that both existing sign AND new enrol may pop a
 *     browser prompt back-to-back (Touch ID → Google, or vice versa).
 *     Provide a UI that guides the user through both without confusing
 *     them.
 *
 * Invalidates the enrolled-methods cache on success so the next
 * transaction sees the new method in signWithPreferredMethod.
 */
export async function addWalletMethod(args: {
  existing: ExistingMethodChoice;
  newKind: NewMethodKind;
  userLabel: string;
}): Promise<AddSuccess> {
  const nc = nonCustodialConfig();
  if (!nc.enabled) {
    throw new Error(
      "Adding wallet methods is only available on non-custodial builds"
    );
  }

  // Step 1: fetch challenge.
  const challenge = await requestChallenge();

  // Step 2: sign with existing method.
  const authProof = await signChallengeWithExistingMethod(
    challenge.challengeHex,
    args.existing,
    nc.passkeyRpId
  );

  // Step 3: enrol new method.
  const newMethod = await enrolNewMethod(
    args.newKind,
    nc.passkeyRpId,
    nc.passkeyRpName,
    args.userLabel
  );

  // Step 4: post to backend, enclave appends + reseals.
  const result = await postAddMethod(authProof, newMethod);

  // Step 5: bust the cache so signWithPreferredMethod re-fetches the
  // projection on the next transaction.
  invalidateEnrolledMethodsCache();

  return result;
}
