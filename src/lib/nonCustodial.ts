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

import { signWithPasskey, type AuthProof } from "./webauthn";

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

// Where does the backend live? rift.ts (v1 SDK) picks via its own
// Environment enum, but for raw fetch calls we need an explicit base URL.
// VITE_RIFT_API_BASE wins when set; otherwise we infer from the SDK env.
export function backendBaseUrl(): string {
  const explicit = import.meta.env.VITE_RIFT_API_BASE;
  if (explicit) return String(explicit).replace(/\/$/, "");
  const env = String(import.meta.env.VITE_RIFT_ENVIRONMENT || "").toLowerCase();
  if (env === "sandbox") return "https://sandbox.riftfi.com";
  if (env === "production") return "https://service.riftfi.xyz";
  // Development default mirrors lib/rift.ts's Environment.DEVELOPMENT.
  return "https://api-staging.riftfi.xyz";
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

async function postJson<T>(
  url: string,
  body: unknown,
  bearerToken: string
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
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
