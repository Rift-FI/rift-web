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
import {
  signWithPasskey,
  signWithOidc,
  isPlatformAuthenticatorAvailable,
  type AuthProof,
} from "./webauthn";
import { nonCustodialConfig } from "./nonCustodial";
import { GOOGLE_CLIENT_ID } from "@/constants";

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
 * Sign the offramp user_op_hash. Passkey-first, Google OIDC as fallback
 * if the device can't do WebAuthn or the user cancels. Same shape as
 * nonCustodial::resolveAuthProof but exported for direct use from the
 * offramp path.
 */
async function resolveAuthProofForOfframp(
  userOpHashHex: string,
  rpId: string
): Promise<AuthProof> {
  const capable = await isPlatformAuthenticatorAvailable();
  if (capable) {
    try {
      return await signWithPasskey({ rpId, userOpHashHex });
    } catch (e: any) {
      const msg = String(e?.message || e);
      const isCancel =
        msg.includes("NotAllowed") ||
        msg.includes("NotSupported") ||
        msg.includes("returned no assertion");
      if (!isCancel) throw e;
      // fall through to OIDC
    }
  }
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Passkey unavailable and no Google Client ID configured — cannot sign offramp"
    );
  }
  return await signWithOidc({
    clientId: GOOGLE_CLIENT_ID,
    userOpHashHex,
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
