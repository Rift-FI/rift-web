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
  enrolPasskey,
  isPlatformAuthenticatorAvailable,
  type AuthProof,
  type EnrolledMethod,
} from "./webauthn";

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

  // ── Phase 2: passkey assertion bound to user_op_hash ────────────────
  args.onPromptStart?.(preview.userOpHashHex);
  let authProof: AuthProof;
  try {
    authProof = await signWithPasskey({
      rpId: args.rpId,
      userOpHashHex: preview.userOpHashHex,
      credIds: args.credIds,
    });
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

  // Phase 2 — passkey assertion bound to user_op_hash
  args.onPromptStart?.(preview.userOpHashHex);
  let authProof: AuthProof;
  try {
    authProof = await signWithPasskey({
      rpId: args.rpId,
      userOpHashHex: preview.userOpHashHex,
      credIds: args.credIds,
    });
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
}): Promise<
  {
    alreadyMigrated: boolean;
    fromVersion?: "v1" | "v2";
    deferred?: boolean;
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
    if (!supported) return null;

    // ── Defer for popup-based flows (Google / Apple) ────────────────
    // navigator.credentials.create requires transient user activation.
    // After a Google/Apple popup closes, the opener does NOT get a
    // fresh gesture, so the browser would throw NotAllowedError and
    // we'd silently fail. Skip and let a follow-up UI trigger this.
    if (args.activationHint === "stale") {
      console.log(
        "[rift] enrolment deferred — activation stale, will retry from UI"
      );
      return { alreadyMigrated: false, deferred: true };
    }

    const { method } = await enrolPasskey({
      rpId: args.rpId,
      rpName: args.rpName,
      userName: args.userLabel,
    });
    const methods: EnrolledMethod[] = [method];

    const base = backendBaseUrl();
    const res = await postJson<{
      alreadyMigrated: boolean;
      fromVersion?: "v1" | "v2";
    }>(`${base}/wallet/migrate-to-v3`, { enrolledMethods: methods }, args.accessToken);

    if (res.alreadyMigrated) {
      console.log("[rift] envelope already v3 — no migration needed");
    } else {
      console.log(
        `[rift] migrated ${res.fromVersion} → v3 (wallet address unchanged)`
      );
    }
    return res;
  } catch (e: any) {
    console.warn("[rift] migrate-to-v3 skipped:", e?.message || e);
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
