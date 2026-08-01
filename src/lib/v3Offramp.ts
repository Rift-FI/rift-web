/**
 * Client-side two-phase orchestrator for the v3 offramp / pay / withdraw
 * flow. Mirrors backend/src/services/v3OfframpService.ts.
 *
 *   1. POST /v1/offramps/init      → { orderId, ticketId, userOpHashHex }
 *   2. signWithPasskey / signWithOidc(userOpHashHex) → authProof
 *   3. POST /v1/offramps/finalize  → { orderId, txHash, transactionCode }
 *
 * Backend has already bypassed OTP for v3 users, so the client sees no
 * password prompt anywhere in this path — the Touch ID / Face ID
 * (or Google popup, on non-passkey devices) IS the consent step.
 */

import { getApiBase } from "./apiBase";
import { type AuthProof } from "./webauthn";
import { nonCustodialConfig, signWithPreferredMethod } from "./nonCustodial";

export interface OfframpInitParams {
  token: string;
  amount: number;
  currency: string;
  chain: string;
  recipient: string | Record<string, any>;
  localAmount?: number;
}

export interface OfframpInitResponse {
  orderId: string;
  ticketId: string;
  userOpHashHex: string;
  expiresAtMs: number;
  ttlMs: number;
  chainId: number;
  provider: "pretium" | "paycrest";
  transferAmount: number;
  fiatAmount: number;
  totalDeductedFiat: number;
  feeFiat: number;
  feePercentage: number;
  exchangeRate: number;
}

export interface OfframpFinalizeResponse {
  orderId: string;
  txHash: string;
  transactionCode: string;
  status: string;
  fiatAmount: number;
  currency: string;
}

function headers(): Record<string, string> {
  const token = localStorage.getItem("token");
  const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(apiKey ? { "x-api-key": apiKey } : {}),
  };
}

/**
 * Sign the offramp user_op_hash. Delegates to the shared
 * nonCustodial::signWithPreferredMethod so the offramp path shares the
 * exact same behaviour as send / swap / WC approve:
 *
 *   - Probes /wallet/methods for what's actually enrolled
 *   - Skips passkey entirely for OIDC-only wallets (art68401's case)
 *   - Pops the chooser modal when both are enrolled
 *   - Auto-falls-back to the other method on failure
 *
 * Previously this file had its own local resolveAuthProofForOfframp
 * that unconditionally tried passkey first — which prompted for a
 * passkey even for wallets whose sealed envelope carries only Google.
 */
async function resolveAuthProofForOfframp(
  userOpHashHex: string,
  rpId: string
): Promise<AuthProof> {
  return await signWithPreferredMethod({
    userOpHashHex,
    rpId,
    preference: "auto",
  });
}

/** Phase A: reserve the on-chain intent, get the hash to sign. */
export async function initOfframp(
  params: OfframpInitParams
): Promise<OfframpInitResponse> {
  const base = getApiBase();
  const body = {
    token: params.token,
    amount: params.amount,
    currency: params.currency,
    chain: params.chain,
    recipient: params.recipient,
    ...(params.localAmount !== undefined
      ? { localAmount: params.localAmount }
      : {}),
  };
  const res = await fetch(`${base}/v1/offramps/init`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(
      json?.error || `Offramp init failed (${res.status})`
    );
  }
  const data = json.data as any;
  return {
    orderId: data.orderId,
    ticketId: data.ticketId,
    userOpHashHex: data.userOpHashHex,
    expiresAtMs: Number(data.expiresAtMs),
    ttlMs: Number(data.ttlMs),
    chainId: Number(data.chainId),
    provider: data.provider,
    transferAmount: Number(data.transferAmount),
    fiatAmount: Number(data.fiatAmount),
    totalDeductedFiat: Number(data.totalDeductedFiat),
    feeFiat: Number(data.feeFiat),
    feePercentage: Number(data.feePercentage),
    exchangeRate: Number(data.exchangeRate),
  };
}

/** Phase C: post the signed authProof, backend broadcasts + payouts. */
export async function finalizeOfframp(args: {
  orderId: string;
  ticketId: string;
  authProof: AuthProof;
}): Promise<OfframpFinalizeResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/v1/offramps/finalize`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(
      json?.error || `Offramp finalize failed (${res.status})`
    );
  }
  return json.data as OfframpFinalizeResponse;
}

/**
 * All-in-one helper — init → sign → finalize — for callers that want
 * the legacy one-call ergonomics.
 */
export async function runV3Offramp(
  params: OfframpInitParams
): Promise<OfframpFinalizeResponse> {
  const nc = nonCustodialConfig();
  const init = await initOfframp(params);
  const authProof = await resolveAuthProofForOfframp(
    init.userOpHashHex,
    nc.passkeyRpId
  );
  return await finalizeOfframp({
    orderId: init.orderId,
    ticketId: init.ticketId,
    authProof,
  });
}
