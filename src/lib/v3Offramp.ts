/**
 * Client-side two-phase orchestrator for offramp / pay / withdraw.
 * Mirrors backend/src/services/v3OfframpService.ts.
 *
 *   1. POST /v1/offramps/init      → { orderId, ticketId, hashToSign }
 *   2. signWithPasskey(hashToSign) → authProof
 *   3. POST /v1/offramps/finalize  → { orderId, txHash, transactionCode }
 *
 * No OTP / password anywhere in this path — the passkey assertion IS
 * the consent step.
 */

import { type AuthProof } from "./webauthn";
import { riftRequest, requireTicket, signTicket } from "./nonCustodial";

export interface OfframpInitParams {
  token: string;
  amount: number;
  currency: string;
  chain: string;
  recipient: string | Record<string, any>;
  localAmount?: number;
  /** Saved beneficiary this payout goes to (optional). */
  beneficiaryId?: string;
}

export interface OfframpInitResponse {
  orderId: string;
  ticketId: string;
  userOpHashHex: string;
  allowCredentials?: string[];
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

/** Phase A: reserve the on-chain intent, get the hash to sign. */
export async function initOfframp(
  params: OfframpInitParams
): Promise<OfframpInitResponse> {
  const body = {
    token: params.token,
    amount: params.amount,
    currency: params.currency,
    chain: params.chain,
    recipient: params.recipient,
    ...(params.localAmount !== undefined
      ? { localAmount: params.localAmount }
      : {}),
    ...(params.beneficiaryId ? { beneficiaryId: params.beneficiaryId } : {}),
  };
  const { data: json } = await riftRequest<any>("POST", "/v1/offramps/init", body);
  if (json?.success === false) {
    throw new Error(json?.error || "Offramp init failed");
  }
  const data = (json?.data ?? json) as any;
  const ticket = requireTicket(data, "Offramp");
  return {
    orderId: data.orderId,
    ticketId: ticket.ticketId,
    userOpHashHex: ticket.hashToSign,
    allowCredentials: ticket.allowCredentials,
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
  const { data: json } = await riftRequest<any>("POST", "/v1/offramps/finalize", args);
  if (json?.success === false) {
    throw new Error(json?.error || "Offramp finalize failed");
  }
  return (json?.data ?? json) as OfframpFinalizeResponse;
}

/**
 * All-in-one helper — init → sign → finalize — for callers that want
 * the legacy one-call ergonomics.
 */
export async function runV3Offramp(
  params: OfframpInitParams
): Promise<OfframpFinalizeResponse> {
  const init = await initOfframp(params);
  const authProof = await signTicket({
    hashToSign: init.userOpHashHex,
    allowCredentials: init.allowCredentials ?? [],
  });
  return await finalizeOfframp({
    orderId: init.orderId,
    ticketId: init.ticketId,
    authProof,
  });
}
