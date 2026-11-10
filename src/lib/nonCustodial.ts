/**
 * Passkey signing glue — the ONLY way the app moves funds.
 *
 * Every fund-moving or signing operation is two-phase (spec §2b):
 *   preview → { ticketId, hashToSign, allowCredentials, … }
 *   → passkey assertion over hashToSign (clientDataJSON.challenge)
 *   → submit { ticketId, authProof } → { userOpHash, transactionHash }
 *
 * Rift's servers never hold a key that can move user funds, so there is
 * no "server signs for me" fallback any more: a missing passkey surfaces
 * as 409 PASSKEY_SETUP_REQUIRED, which opens the setup gate.
 *
 * We hit the routes with fetch rather than the published 1.4.x SDK, which
 * predates two-phase signing.
 */

import { signWithPasskey, type AuthProof } from "./webauthn";
import { getApiBase } from "./apiBase";
import { pickPaymasterToken } from "./paymaster";
import { ApiResponseError } from "./apiError";
import {
  friendlyPasskeyError,
  friendlyWebAuthnError,
  normaliseSubmit,
  normaliseTicket,
  passkeyErrorCode,
  resolveRpId,
  type NormalisedTicket,
} from "./passkeyUtils";

export interface PasskeyConfig {
  passkeyRpId: string;
  passkeyRpName: string;
}

export function nonCustodialConfig(): PasskeyConfig {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  return {
    passkeyRpId: resolveRpId(hostname, import.meta.env.VITE_PASSKEY_RP_ID),
    passkeyRpName: import.meta.env.VITE_PASSKEY_RP_NAME || "Rift",
  };
}

// Where does the backend live? Delegates to the shared apiBase resolver
// so every fetch in the app uses one path.
export function backendBaseUrl(): string {
  return getApiBase();
}

/** Fired on 409 PASSKEY_SETUP_REQUIRED; the setup gate listens for it. */
export const PASSKEY_SETUP_REQUIRED_EVENT = "rift:passkey-setup-required";

function authHeaders(bearerToken?: string | null): Record<string, string> {
  const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
  const token = bearerToken ?? localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Backend's authenticateApiKey middleware runs before CORS —
    // without this header the request 401s and the response has no
    // Access-Control-Allow-Origin, which the browser reports as
    // "CORS blocked" (misleading — the real failure is auth).
    ...(apiKey ? { "x-api-key": apiKey } : {}),
  };
}

/**
 * fetch + JSON with the passkey error contract applied: known error
 * codes become an ApiResponseError carrying `code` and friendly copy;
 * PASSKEY_SETUP_REQUIRED additionally opens the setup gate.
 */
export async function riftRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
  bearerToken?: string | null
): Promise<{ status: number; data: T }> {
  const url = path.startsWith("http") ? path : `${backendBaseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: authHeaders(bearerToken),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) throw apiError(res.status, json, url);
  return { status: res.status, data: json as T };
}

function apiError(status: number, json: unknown, url: string): ApiResponseError {
  const code = passkeyErrorCode(json);
  if (code === "PASSKEY_SETUP_REQUIRED" && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PASSKEY_SETUP_REQUIRED_EVENT));
  }
  const b = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  const raw =
    (typeof b.message === "string" && b.message) ||
    (typeof b.error === "string" && b.error) ||
    `${url.replace(backendBaseUrl(), "")} failed (${status})`;
  return new ApiResponseError(friendlyPasskeyError(code) ?? raw, {
    status,
    code,
    requestId: typeof b.requestId === "string" ? b.requestId : undefined,
  });
}

async function postJson<T>(path: string, body: unknown, bearerToken?: string | null): Promise<T> {
  return (await riftRequest<T>("POST", path, body, bearerToken)).data;
}

/**
 * Passkey-sign a preview ticket. allowCredentials from the server pins
 * the prompt to this wallet's passkeys; the callbacks let a UI show
 * "Confirm with your passkey…" while the OS sheet is up.
 */
export async function signTicket(
  ticket: Pick<NormalisedTicket, "hashToSign" | "allowCredentials">,
  hooks: {
    onPromptStart?: (hashToSign: string) => void;
    onPromptDone?: () => void;
    credIds?: string[];
  } = {}
): Promise<AuthProof> {
  const { passkeyRpId } = nonCustodialConfig();
  hooks.onPromptStart?.(ticket.hashToSign);
  try {
    return await signWithPasskey({
      rpId: passkeyRpId,
      userOpHashHex: ticket.hashToSign,
      credIds: ticket.allowCredentials.length ? ticket.allowCredentials : hooks.credIds,
    });
  } catch (e) {
    throw new Error(friendlyWebAuthnError(e));
  } finally {
    hooks.onPromptDone?.();
  }
}

/** Sign an arbitrary 32-byte hash with the user's passkey. */
export async function signHash(hashToSign: string, credIds?: string[]): Promise<AuthProof> {
  return signTicket({ hashToSign, allowCredentials: credIds ?? [] });
}

export function requireTicket(raw: unknown, what: string): NormalisedTicket {
  const t = normaliseTicket(raw);
  if (!t) throw new Error(`${what} preview returned no ticket / hash`);
  return t;
}

interface SignHooks {
  onPromptStart?: (hashToSign: string) => void;
  onPromptDone?: () => void;
}

export interface SubmitResult {
  success: boolean;
  hash: string;
  transactionHash?: string;
  userOperationHash?: string;
  status?: string;
}

/**
 * preview → passkey → submit-prepared, the shape every on-chain op uses.
 * Returns the raw preview too so callers can show quote details.
 */
export async function previewSignSubmit<P = Record<string, unknown>>(args: {
  previewPath: string;
  previewBody: unknown;
  submitPath?: string;
  what: string;
  accessToken?: string | null;
} & SignHooks): Promise<SubmitResult & { preview: P }> {
  const preview = await postJson<P>(args.previewPath, args.previewBody, args.accessToken);
  const ticket = requireTicket(preview, args.what);
  const authProof = await signTicket(ticket, args);
  const submitted = await postJson<unknown>(
    args.submitPath ?? "/v1/wallet/user-operations/submit-prepared",
    { ticketId: ticket.ticketId, authProof },
    args.accessToken
  );
  const n = normaliseSubmit(submitted);
  if ((submitted as { success?: boolean })?.success === false) {
    throw new Error(`${args.what} submit failed`);
  }
  return {
    success: true,
    hash: n.hash,
    ...(n.transactionHash ? { transactionHash: n.transactionHash } : {}),
    ...(n.userOpHash ? { userOperationHash: n.userOpHash } : {}),
    ...(n.status ? { status: n.status } : {}),
    preview,
  };
}

/**
 * Two-phase signing flow for a single user op (arbitrary call). Same
 * return shape as the old one-phase SDK call so call sites don't branch.
 */
export async function signAndSubmitUserOp(args: {
  accessToken: string;
  chain: string;
  transactionData: { to: string; value?: string; data?: string };
  credIds?: string[];
  rpId?: string;
  /** Stablecoin (USDC/USDT address) to pay gas in; omitted = sponsored. */
  paymasterToken?: string;
} & SignHooks): Promise<SubmitResult> {
  const { preview: _p, ...rest } = await previewSignSubmit({
    previewPath: "/v1/wallet/user-operations/preview",
    previewBody: {
      chain: args.chain,
      ...(args.paymasterToken ? { paymasterToken: args.paymasterToken } : {}),
      transactionData: {
        to: args.transactionData.to,
        ...(args.transactionData.value !== undefined
          ? { value: String(args.transactionData.value) }
          : {}),
        ...(args.transactionData.data ? { data: args.transactionData.data } : {}),
      },
    },
    what: "Transaction",
    accessToken: args.accessToken,
    onPromptStart: args.onPromptStart,
    onPromptDone: args.onPromptDone,
  });
  void _p;
  return rest;
}

/**
 * Generic on-chain tx submitter used by swap (LiFi) and prediction
 * markets. Always passkey-approved.
 *
 * The third argument is accepted for call-site compatibility with the
 * old SDK-fallback signature and ignored.
 */
export async function sendChainTx(
  chain: string,
  transactionData: {
    to: string;
    data?: string;
    value?: string;
    [key: string]: any;
  },
  _legacySdk?: unknown
): Promise<{ hash: string }> {
  void _legacySdk;
  const accessToken = localStorage.getItem("token");
  if (!accessToken) throw new Error("Sign in to approve this transaction");
  // Gas in the user's stablecoin on this chain when they hold some.
  const paymasterToken = await pickPaymasterToken(chain);
  const res = await signAndSubmitUserOp({
    accessToken,
    chain,
    paymasterToken,
    transactionData: {
      to: transactionData.to,
      ...(transactionData.value !== undefined
        ? { value: String(transactionData.value) }
        : {}),
      ...(transactionData.data ? { data: transactionData.data } : {}),
    },
  });
  return { hash: res.hash };
}

/**
 * Two-phase token transfer (spend): /v1/transactions/preview builds the
 * ERC-20 / native transfer server-side (plus fee markup calls) so the
 * client doesn't need token addresses or decimals.
 */
export async function signAndSubmitSpend(args: {
  accessToken: string;
  chain: string;
  token: string;
  recipient: string;
  amount: string | number;
  rpId?: string;
  credIds?: string[];
} & SignHooks): Promise<{ success: boolean; hash: string; transactionHash?: string }> {
  const { preview: _p, ...rest } = await previewSignSubmit({
    previewPath: "/v1/transactions/preview",
    previewBody: {
      chain: args.chain,
      token: args.token,
      recipient: args.recipient,
      amount: String(args.amount),
    },
    what: "Transfer",
    accessToken: args.accessToken,
    onPromptStart: args.onPromptStart,
    onPromptDone: args.onPromptDone,
  });
  void _p;
  return rest;
}
