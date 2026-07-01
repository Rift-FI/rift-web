/**
 * Non-custodial mode glue.
 *
 * Off by default — enable with `VITE_NON_CUSTODIAL=true` at build time
 * (sandbox flavour). When ON:
 *   - Signup mints a v3 envelope (passkey-bound) instead of v1 (custodial).
 *   - On-chain ops use two-phase signing: preview → passkey assertion
 *     bound to user_op_hash → submit-prepared.
 *
 * Why this lives outside of `lib/rift.ts`:
 *   The published SDK 1.4.x doesn't expose the v3 endpoints. Rather than
 *   dual-install v3 SDK alongside, we hit the new routes directly with
 *   fetch — small surface, no extra bundle weight.
 */

import {
  signWithPasskey,
  signWithOidc,
  enrolPasskey,
  isPlatformAuthenticatorAvailable,
  type AuthProof,
  type EnrolledMethod,
} from "./webauthn";
import { GOOGLE_CLIENT_ID } from "@/constants";

/**
 * Client hint about which enrolled method to use for signing. Callers
 * that surface a "choose method" UI (e.g. TransactionMethodChooser) pass
 * the user's pick; internal callers omit and get the default
 * passkey-first cascade.
 */
export type SigningMethodPreference = "auto" | "passkey" | "google";

/**
 * Session-scoped cache of the /wallet/methods projection. Populated on
 * first sign attempt, cleared on logout / token change. The projection is
 * derived from the User row (googleSub etc.), not the sealed envelope's
 * true CBOR method list — but it's the best signal the client has for
 * "which method should I even try" without opening the enclave. It
 * correctly reflects "OIDC-only signup" so we don't waste a passkey
 * prompt on a wallet that has no passkey enrolled.
 */
export interface EnrolledMethodHint {
  kind: "passkey" | "oidc";
  iss?: string;
  label?: string;
}
let methodsCache: {
  token: string;
  enrolled: EnrolledMethodHint[];
} | null = null;

/**
 * Global "ask the user which method" hook. Registered by
 * <MethodChooserProvider/> at shell mount. When multiple methods are
 * enrolled and the caller didn't force a preference, resolveAuthProof
 * calls this to pop a modal and awaits the user's pick.
 *
 * Kept as a plain module-level callback so this library file stays free
 * of React imports — the UI registers into the library, not the other
 * way round.
 */
type MethodChooserFn = (
  options: EnrolledMethodHint[]
) => Promise<"passkey" | "google">;

let methodChooser: MethodChooserFn | null = null;

export function registerMethodChooser(fn: MethodChooserFn | null): void {
  methodChooser = fn;
}

async function fetchEnrolledMethods(
  accessToken: string
): Promise<EnrolledMethodHint[] | null> {
  if (methodsCache && methodsCache.token === accessToken) {
    return methodsCache.enrolled;
  }
  try {
    const base = backendBaseUrl();
    const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
    const res = await fetch(`${base}/wallet/methods`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      enrolled?: Array<{ kind?: string; iss?: string; label?: string }>;
    };
    const enrolled: EnrolledMethodHint[] = (body.enrolled ?? [])
      .filter((m) => m.kind === "passkey" || m.kind === "oidc")
      .map((m) => ({
        kind: m.kind as "passkey" | "oidc",
        ...(m.iss !== undefined ? { iss: m.iss } : {}),
        ...(m.label !== undefined ? { label: m.label } : {}),
      }));
    methodsCache = { token: accessToken, enrolled };
    return enrolled;
  } catch {
    return null;
  }
}

/**
 * Try the preferred method first, cascade to the alternate on
 * capability / cancel errors.
 *
 *   preference="auto"    → prefer whatever's enrolled; passkey first if both
 *   preference="passkey" → passkey only, throws if not enrolled or on failure
 *   preference="google"  → OIDC only (skip passkey entirely)
 *
 * "auto" now probes /wallet/methods first — skipping the passkey attempt
 * entirely for OIDC-only wallets (the previous behaviour showed a passkey
 * prompt for accounts that had only Google enrolled; the browser would
 * happily list synced passkeys from other RPs, the user would sign one,
 * and the enclave would reject because that cred_id isn't in the sealed
 * envelope's methods list).
 *
 * Rationale for order: silent Touch ID is 200ms; Google popup is 2–5s +
 * round-trip. Passkey wins on a trusted device; OIDC is the multi-device
 * escape hatch.
 */
async function resolveAuthProof(
  userOpHashHex: string,
  rpId: string,
  credIds?: string[],
  preference: SigningMethodPreference = "auto"
): Promise<AuthProof> {
  if (preference === "google") {
    // Explicit Google pick from the chooser. If Google fails AND a
    // passkey is enrolled, transparently retry with passkey — saves the
    // user a full tx-retry cycle when the OIDC popup misbehaves.
    try {
      return await signWithOidc({ clientId: GOOGLE_CLIENT_ID, userOpHashHex });
    } catch (googleErr: any) {
      const token = localStorage.getItem("token");
      const methods = token ? await fetchEnrolledMethods(token) : null;
      const canFallBackToPasskey =
        !!methods && methods.some((m) => m.kind === "passkey");
      if (!canFallBackToPasskey) throw googleErr;
      console.log(
        "[rift] Google signing failed, falling back to passkey (also enrolled)"
      );
      return await signWithPasskey({ rpId, userOpHashHex, credIds });
    }
  }

  // For auto/passkey mode, probe what's actually enrolled before showing
  // a passkey prompt. Skip the probe if we already have a hint (from a
  // deliberate "passkey" preference the UI resolved).
  let enrolled: EnrolledMethodHint[] = [];
  let hasPasskey = true;
  let hasOidc = false;
  if (preference === "auto") {
    const token = localStorage.getItem("token");
    if (token) {
      const methods = await fetchEnrolledMethods(token);
      if (methods && methods.length > 0) {
        enrolled = methods;
        hasPasskey = methods.some((m) => m.kind === "passkey");
        hasOidc = methods.some((m) => m.kind === "oidc");
      }
    }
  }

  // Multi-method: give the user the choice. Modal blocks the tx flow
  // until they pick. Falls through to silent single-method paths below
  // if the chooser isn't registered (e.g. non-shell context).
  if (preference === "auto" && hasPasskey && hasOidc && methodChooser) {
    const pick = await methodChooser(enrolled);
    return resolveAuthProof(userOpHashHex, rpId, credIds, pick);
  }

  // OIDC-only wallet: don't prompt for a passkey the enclave won't accept.
  if (preference === "auto" && !hasPasskey && hasOidc) {
    console.log("[rift] wallet has no passkey enrolled — signing with Google OIDC");
    return await signWithOidc({ clientId: GOOGLE_CLIENT_ID, userOpHashHex });
  }

  try {
    return await signWithPasskey({ rpId, userOpHashHex, credIds });
  } catch (passkeyErr: any) {
    if (preference === "passkey") throw passkeyErr;
    const msg = String(passkeyErr?.message || passkeyErr);
    const shouldFallback =
      msg.includes("NotAllowed") ||
      msg.includes("NotSupported") ||
      msg.includes("not supported") ||
      msg.includes("returned no assertion");
    if (!shouldFallback) throw passkeyErr;
    console.log("[rift] passkey unavailable, falling back to Google OIDC");
    return await signWithOidc({ clientId: GOOGLE_CLIENT_ID, userOpHashHex });
  }
}

/**
 * Clear the enrolled-methods cache. Call on logout, or after a successful
 * add-method flow so the next sign attempt sees the new enrolment.
 */
export function invalidateEnrolledMethodsCache(): void {
  methodsCache = null;
}

/**
 * Public helper: for a UI that wants to explicitly choose the signing
 * method (e.g. "Sign with Google" fallback button after passkey fails).
 */
export async function signWithPreferredMethod(args: {
  userOpHashHex: string;
  rpId: string;
  credIds?: string[];
  preference?: SigningMethodPreference;
}): Promise<AuthProof> {
  return resolveAuthProof(
    args.userOpHashHex,
    args.rpId,
    args.credIds,
    args.preference || "auto"
  );
}

export interface NonCustodialConfig {
  enabled: boolean;
  passkeyRpId: string;
  passkeyRpName: string;
}

export function nonCustodialConfig(): NonCustodialConfig {
  const enabled =
    String(import.meta.env.VITE_NON_CUSTODIAL || "").toLowerCase() === "true";
  // eTLD+1 of the hostname is the safe default for RP id. e.g.
  // app.sandbox.riftfi.com → "riftfi.com".
  const fallbackRpId =
    typeof window !== "undefined"
      ? window.location.hostname.split(".").slice(-2).join(".")
      : "localhost";
  return {
    enabled,
    passkeyRpId: import.meta.env.VITE_PASSKEY_RP_ID || fallbackRpId,
    passkeyRpName: import.meta.env.VITE_PASSKEY_RP_NAME || "Rift",
  };
}

// Where does the backend live? Delegates to the shared apiBase resolver
// (VITE_RIFT_API_BASE || VITE_API_URL || prod default) so every fetch in
// the app uses one path — no divergence between v3 helpers and legacy
// hooks.
import { getApiBase } from "./apiBase";
export function backendBaseUrl(): string {
  return getApiBase();
}

interface PreviewResp {
  success: boolean;
  userOpHashHex: string;
  ticketId: string;
  expiresAtMs: number;
  ttlMs: number;
  smartAccountAddress: string;
  chainId: number;
}

interface SubmitResp {
  success: boolean;
  hash: string;
  userOperationHash?: string;
  transactionHash?: string;
  chainId?: number;
}

interface PreviewBody {
  chain: string;
  transactionData: {
    to: string;
    value?: string;
    data?: string;
  };
}

/**
 * Two-phase signing flow for a single user op. Drops the caller into
 * the existing one-phase shape (returns { hash, transactionHash, ... })
 * so call sites only swap the SDK call for this helper.
 *
 * Throws on failure — caller should wrap in try/catch and surface as a
 * user-visible "Sign rejected" / "Preview expired" etc.
 */
export async function signAndSubmitUserOp(args: {
  accessToken: string;
  chain: string;
  transactionData: PreviewBody["transactionData"];
  // Credential IDs the user enrolled at signup / migrate-to-v3. The
  // backend's getUser() returns these on the `methods` field; if empty
  // the browser will let the user pick from all eligible credentials.
  credIds?: string[];
  rpId: string;
  // Hook to render a "Touch ID prompt" UI between preview and assertion.
  onPromptStart?: (userOpHashHex: string) => void;
  onPromptDone?: () => void;
}): Promise<SubmitResp> {
  const base = backendBaseUrl();

  // ── Phase 1: preview ────────────────────────────────────────────────
  const preview = await postJson<PreviewResp>(
    `${base}/v1/wallet/user-operations/preview`,
    {
      chain: args.chain,
      transactionData: {
        to: args.transactionData.to,
        ...(args.transactionData.value !== undefined
          ? { value: String(args.transactionData.value) }
          : {}),
        ...(args.transactionData.data
          ? { data: args.transactionData.data }
          : {}),
      } satisfies PreviewBody["transactionData"],
    },
    args.accessToken
  );
  if (!preview?.success || !preview.userOpHashHex || !preview.ticketId) {
    throw new Error("preview failed — backend returned no ticket");
  }

  // ── Phase 2: authProof (passkey → OIDC fallback) ─────────────────
  args.onPromptStart?.(preview.userOpHashHex);
  let authProof: AuthProof;
  try {
    authProof = await resolveAuthProof(
      preview.userOpHashHex,
      args.rpId,
      args.credIds
    );
  } finally {
    args.onPromptDone?.();
  }

  // ── Phase 3: submit ────────────────────────────────────────────────
  const submit = await postJson<SubmitResp>(
    `${base}/v1/wallet/user-operations/submit-prepared`,
    { ticketId: preview.ticketId, authProof },
    args.accessToken
  );
  if (!submit?.success) {
    throw new Error("submit failed — enclave rejected authProof or bundler error");
  }
  return submit;
}

/**
 * Generic on-chain tx submitter. In non-custodial mode it routes
 * through the two-phase preview → passkey → submit-prepared flow. In
 * legacy mode it calls the v1 SDK's `proxyWallet.sendTransaction`.
 *
 * Same return shape both ways so callers don't have to branch.
 *
 * Pass a `riftSdk` reference (typed as `any` to avoid a hard dep on v1
 * SDK types in this shared util) so this file stays decoupled from the
 * SDK singleton in lib/rift.ts.
 */
export async function sendChainTx(
  chain: string,
  transactionData: {
    to: string;
    data?: string;
    value?: string;
    [key: string]: any;
  },
  riftSdk: { proxyWallet: { sendTransaction: (req: any) => Promise<any> } } | any
): Promise<{ hash: string }> {
  const { enabled, passkeyRpId } = nonCustodialConfig();
  if (enabled) {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) throw new Error("No access token for non-custodial tx");
    const res = await signAndSubmitUserOp({
      accessToken,
      chain,
      transactionData: {
        to: transactionData.to,
        ...(transactionData.value !== undefined
          ? { value: String(transactionData.value) }
          : {}),
        ...(transactionData.data ? { data: transactionData.data } : {}),
      },
      rpId: passkeyRpId,
    });
    return { hash: res.hash };
  }
  // Legacy one-phase path: v1/v2 wallets — backend signs internally.
  const r = await riftSdk.proxyWallet.sendTransaction({
    chain,
    transactionData,
  });
  return { hash: r.hash };
}

/**
 * Two-phase non-custodial token transfer (spend). Mirrors the legacy
 * `rift.transactions.send({chain, token, recipient, amount})` shape but
 * routes via /v1/transactions/preview + /v1/wallet/user-operations/submit-prepared.
 *
 * Backend's previewSpend controller builds the ERC-20 transfer call
 * internally and forwards to smart-wallet's preview, so the client
 * doesn't need to know token addresses or decimals.
 */
export async function signAndSubmitSpend(args: {
  accessToken: string;
  chain: string;
  token: string;
  recipient: string;
  amount: string | number;
  rpId: string;
  credIds?: string[];
  onPromptStart?: (userOpHashHex: string) => void;
  onPromptDone?: () => void;
}): Promise<{ success: boolean; hash: string; transactionHash?: string }> {
  const base = backendBaseUrl();

  // Phase 1 — backend reduces to calls + runs prepareUserOperation
  const preview = await postJson<{
    success: boolean;
    userOpHashHex: string;
    ticketId: string;
  }>(
    `${base}/v1/transactions/preview`,
    {
      chain: args.chain,
      token: args.token,
      recipient: args.recipient,
      amount: String(args.amount),
    },
    args.accessToken
  );
  if (!preview?.success || !preview.userOpHashHex || !preview.ticketId) {
    throw new Error("spend preview failed — backend returned no ticket");
  }

  // Phase 2 — authProof (passkey → OIDC fallback)
  args.onPromptStart?.(preview.userOpHashHex);
  let authProof: AuthProof;
  try {
    authProof = await resolveAuthProof(
      preview.userOpHashHex,
      args.rpId,
      args.credIds
    );
  } finally {
    args.onPromptDone?.();
  }

  // Phase 3 — submit (shared endpoint)
  const submit = await postJson<{
    success: boolean;
    hash: string;
    transactionHash?: string;
  }>(
    `${base}/v1/wallet/user-operations/submit-prepared`,
    { ticketId: preview.ticketId, authProof },
    args.accessToken
  );
  if (!submit?.success) {
    throw new Error("spend submit failed — enclave rejected authProof or bundler error");
  }
  return submit;
}

/**
 * Read-only probe: what envelope version does the authenticated user
 * currently have? Used to decide whether a passkey enrolment prompt is
 * even worth showing on this login.
 *
 * Returns null on any failure (network, 401, backend not deployed) so
 * the caller can degrade gracefully.
 */
export async function getV3Status(
  accessToken: string
): Promise<{ version: "v1" | "v2" | "v3" | null } | null> {
  try {
    const base = backendBaseUrl();
    const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
    const res = await fetch(`${base}/wallet/v3-status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Backend's authenticateApiKey middleware runs before CORS —
        // without this header the request 401s and the response has no
        // Access-Control-Allow-Origin, which the browser reports as
        // "CORS blocked" (misleading — the real failure is auth).
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as { version: "v1" | "v2" | "v3" | null };
  } catch {
    return null;
  }
}

/**
 * Best-effort post-login migration to v3.
 *
 * NEW: probes `/wallet/v3-status` FIRST. If the user is already on v3
 * we return immediately without touching WebAuthn — no biometric prompt,
 * no orphaned passkey creation on device #2/#3.
 *
 * If the user is on v1/v2, we enrol a passkey and call migrate-to-v3.
 *
 * Returns `null` and logs (doesn't throw) on any failure so the caller
 * can fall through to a normal signed-in state.
 *
 * Notes:
 *   - Multi-device passkey addition is intentionally NOT handled here
 *     (backend does not expose an add-method endpoint yet — device #2
 *     currently signs via device #1's synced credential on the same
 *     Google Password Manager / iCloud Keychain).
 *   - The `activationHint` arg lets callers signal whether the current
 *     execution has a fresh user gesture (OTP submit = yes, popup-based
 *     OAuth = probably no). When "stale", we skip the enrolment call
 *     entirely rather than firing an invisible NotAllowedError.
 */
export async function maybeMigrateToV3(args: {
  accessToken: string;
  userLabel: string;
  rpId: string;
  rpName: string;
  /** "fresh" = we can call navigator.credentials.create right now.
   *  "stale" = we just returned from an OAuth popup / async delay and
   *  should defer enrolment to a user-gesture-triggered retry.  */
  activationHint?: "fresh" | "stale";
  /** For OAuth flows: additional enrolled methods we already have from
   *  the login (Google/Apple id_token → oidc method). Merged with the
   *  passkey enrolment if capability exists, sent to the enclave so the
   *  user gets recovery via OIDC from the start. */
  additionalMethods?: EnrolledMethod[];
}): Promise<
  {
    alreadyMigrated: boolean;
    fromVersion?: "v1" | "v2";
    /** True when the envelope is still not v3 and the UI must show the
     *  setup gate to complete enrolment via user click. */
    needsSetup?: boolean;
  } | null
> {
  try {
    // ── Probe first — cheap, no biometric prompt ─────────────────────
    const status = await getV3Status(args.accessToken);
    if (status?.version === "v3") {
      console.log("[rift] envelope already v3 — no enrolment needed");
      return { alreadyMigrated: true };
    }

    const supported = await isPlatformAuthenticatorAvailable();
    const methods: EnrolledMethod[] = [];

    // ── Try passkey enrolment inline if activation is fresh ────────
    if (supported && args.activationHint !== "stale") {
      try {
        const { method } = await enrolPasskey({
          rpId: args.rpId,
          rpName: args.rpName,
          userName: args.userLabel,
        });
        methods.push(method);
      } catch (e: any) {
        console.warn("[rift] passkey enrol failed inline:", e?.message || e);
      }
    }

    // Merge OAuth-provided methods (Google/Apple id_token → oidc).
    if (args.additionalMethods?.length) {
      methods.push(...args.additionalMethods);
    }

    // No enrolable method now (popup stole activation, no capability,
    // and no OAuth token). Defer the whole thing to the UI setup gate.
    if (methods.length === 0) {
      console.log("[rift] no enrolable method — deferring to setup gate");
      return { alreadyMigrated: false, needsSetup: true };
    }

    const base = backendBaseUrl();
    const res = await postJson<{
      alreadyMigrated: boolean;
      fromVersion?: "v1" | "v2";
    }>(`${base}/wallet/migrate-to-v3`, { enrolledMethods: methods }, args.accessToken);

    if (res.alreadyMigrated) {
      console.log("[rift] envelope already v3 — no migration needed");
    } else {
      console.log(
        `[rift] migrated ${res.fromVersion} → v3 (wallet address unchanged, ${methods.length} method(s))`
      );
    }
    return res;
  } catch (e: any) {
    console.warn("[rift] migrate-to-v3 skipped:", e?.message || e);
    // Don't leave the user on v1 silently — force the gate to appear.
    return { alreadyMigrated: false, needsSetup: true };
  }
}

/**
 * Decode a Google id_token payload (JWT). No signature verification —
 * that's the enclave's job. We only need `iss` + `sub` locally to build
 * the EnrolledMethod for OIDC.
 */
export function decodeOidcMethodFromIdToken(
  idToken: string,
  fallbackIss: string
): EnrolledMethod | null {
  try {
    const [, payloadB64] = idToken.split(".");
    if (!payloadB64) return null;
    const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(pad);
    const payload = JSON.parse(json) as { iss?: string; sub?: string };
    if (!payload?.sub) return null;
    return {
      kind: "oidc",
      iss: payload.iss || fallbackIss,
      sub: payload.sub,
    };
  } catch {
    return null;
  }
}

async function postJson<T>(
  url: string,
  body: unknown,
  bearerToken: string
): Promise<T> {
  const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
      // Required by authenticateApiKey — see getV3Status for the CORS
      // side-effect if it's missing.
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text();
    }
    throw new Error(`${url} → ${res.status}: ${detail}`);
  }
  return (await res.json()) as T;
}
