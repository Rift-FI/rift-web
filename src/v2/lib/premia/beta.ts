/**
 * PREMIA beta access — the invite gate.
 *
 * PREMIA is invite-only. A signed-in user who has not redeemed a code must
 * see no trace of it: no nav item, no mobile tab, no routes. That is enforced
 * by `hasAccess` from the backend, which is a SECOND gate independent of
 * `FEATURE_PREMIA` (the build-level kill switch).
 *
 * ── Why this fails closed ───────────────────────────────────────────────
 *
 * Every error path here returns "no access". An invite gate that opens when
 * the server is unreachable is not a gate — a user could take the section
 * offline (airplane mode, a blocked host, a 500) and walk straight in. So a
 * network failure, a timeout, a 4xx and a 5xx all mean the same thing as an
 * explicit `hasAccess: false`.
 *
 * The result is also never persisted to localStorage. Caching the *answer*
 * on the client would make "clear site data and set a key" a bypass; it is
 * held in memory for the session only and re-checked on every load.
 */
import { riftRequest } from "@/lib/nonCustodial";

export interface BetaStatus {
  hasAccess: boolean;
  code?: string;
  redeemedAt?: string;
}

/** The reasons the API returns for a code it won't accept. */
export type BetaReason = "unknown" | "expired" | "exhausted" | "disabled" | "terms_not_accepted";

export interface ValidateResult {
  valid: boolean;
  /** Raw machine reason from the API, when it gave one. */
  reason?: string;
}

/**
 * Turn an API reason code into something the recipient of a link can act on.
 * Unrecognised reasons fall through to a neutral line rather than leaking a
 * machine token onto the screen.
 */
export function explainReason(reason?: string): string {
  switch (reason) {
    case "unknown":
      return "We don't recognise this invite code. Check the link you were sent.";
    case "expired":
      return "This invite has expired.";
    case "exhausted":
      return "This invite has already been used by the maximum number of people.";
    case "disabled":
      return "This invite has been turned off.";
    case "network":
      return "Couldn't reach Rift to check this invite. Try again.";
    case "terms_not_accepted":
      return "You need to accept the beta terms first.";
    default:
      return "This invite link isn't valid.";
  }
}

const NO_ACCESS: BetaStatus = { hasAccess: false };

function token(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/**
 * Is this invite code real? Needs only the API key, so an invite landing page
 * can check a code before asking anyone to sign in.
 *
 * A validation failure is reported as invalid rather than thrown: the landing
 * page's job is to say "this link isn't valid", not to show a stack trace.
 */
export async function validateCode(code: string): Promise<ValidateResult> {
  // Sent as typed — the API matches case-, space- and hyphen-insensitively,
  // so normalising on the client could only disagree with it.
  if (!code.trim()) return { valid: false, reason: "unknown" };
  try {
    const { data } = await riftRequest<ValidateResult>("POST", "/v1/premia/beta/validate", { code });
    return { valid: !!data?.valid, ...(data?.reason ? { reason: data.reason } : {}) };
  } catch (e) {
    // A 4xx carries a typed reason (preserved as `code`); a network or CORS
    // failure does not. `/validate` sends an API key and is CORS-checked
    // against the project's known_origins, so serving the invite page from an
    // unregistered origin fails here, before the handler ever runs.
    const code = (e as { code?: string })?.code;
    return { valid: false, reason: code || "network" };
  }
}

/**
 * Redeem the code against the signed-in account. `acceptedTerms` is sent only
 * when the user has actually accepted them — this call IS the consent record.
 *
 * Throws with copy the caller can show: the API answers 400
 * `terms_not_accepted` or 403 with one of the invite reasons, and `apiError`
 * preserves that as `code`.
 */
export async function redeemCode(code: string): Promise<BetaStatus> {
  try {
    const { data } = await riftRequest<{
      ok: boolean;
      redeemedAt?: string;
      code?: string;
      reason?: string;
    }>("POST", "/v1/premia/beta/redeem", { code, acceptedTerms: true });
    if (!data?.ok) throw new Error(explainReason(data?.reason));
    return {
      hasAccess: true,
      ...(data.code ? { code: data.code } : {}),
      ...(data.redeemedAt ? { redeemedAt: data.redeemedAt } : {}),
    };
  } catch (e) {
    const reason = (e as { code?: string })?.code;
    throw new Error(reason ? explainReason(reason) : (e as Error).message);
  }
}

/** Does this account have access? Any failure means no. */
export async function fetchBetaStatus(): Promise<BetaStatus> {
  if (!token()) return NO_ACCESS;
  try {
    const { data } = await riftRequest<BetaStatus>("GET", "/v1/premia/beta/status");
    return data?.hasAccess
      ? {
          hasAccess: true,
          ...(data.code ? { code: data.code } : {}),
          ...(data.redeemedAt ? { redeemedAt: data.redeemedAt } : {}),
        }
      : NO_ACCESS;
  } catch {
    // Unreachable, 401, 500 — all of them mean "not admitted".
    return NO_ACCESS;
  }
}
