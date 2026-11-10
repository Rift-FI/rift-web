/**
 * Paycrest onramp (buy stablecoins with local currency). Contract:
 *   GET  /v1/onramps/quote?currency&amount&token&chain
 *   POST /v1/onramps { currency, fiatAmount, token, chain, kyc? }
 *     → { id, status, providerAccount?, collection?, fiatAmount, cryptoAmount, token, chain, expiresAt }
 *     → 409 { error: "ONRAMP_KYC_REQUIRED", missing: [...] } | { error: "ONRAMP_DISABLED" }
 *   GET  /v1/onramps/:id
 */
import { authHeaders, backendBaseUrl, riftRequest } from "@/lib/nonCustodial";
import type { OnrampOrder } from "@/hooks/data/use-onramp-orders";

export interface OnrampQuote {
  currency: string;
  fiatAmount: number;
  token: string;
  chain: string;
  cryptoAmount: number;
  rate: number;
  fee: number;
  expiresAt?: string;
}

export interface OnrampKyc {
  fullName?: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  idCountry?: string;
  phone?: string;
  bvn?: string;
  nin?: string;
}

export type CreateOnrampResult =
  | { kind: "order"; order: OnrampOrderFull }
  | { kind: "kyc"; missing: (keyof OnrampKyc)[] }
  | { kind: "disabled" };

export interface OnrampOrderFull extends OnrampOrder {
  collection?: { phone?: string; network?: string; prompt?: boolean };
}

const unwrap = (d: any) => d?.data ?? d;

export async function getOnrampQuote(args: { currency: string; amount: number; token: string; chain: string }): Promise<OnrampQuote> {
  const q = new URLSearchParams({ currency: args.currency, amount: String(args.amount), token: args.token, chain: args.chain });
  const { data } = await riftRequest<any>("GET", `/v1/onramps/quote?${q}`);
  const d = unwrap(data);
  return {
    currency: d.currency ?? args.currency,
    fiatAmount: Number(d.fiatAmount ?? args.amount),
    token: d.token ?? args.token,
    chain: d.chain ?? args.chain,
    cryptoAmount: Number(d.cryptoAmount ?? 0),
    rate: Number(d.rate ?? 0),
    fee: Number(d.fee ?? 0),
    expiresAt: d.expiresAt,
  };
}

export async function createOnramp(body: { currency: string; fiatAmount: number; token: string; chain: string }): Promise<CreateOnrampResult> {
  const res = await fetch(`${backendBaseUrl()}/v1/onramps`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body), cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  const code = json?.error ?? json?.code ?? json?.data?.error;
  if (code === "ONRAMP_KYC_REQUIRED") return { kind: "kyc", missing: (json?.missing ?? json?.data?.missing ?? ["fullName", "dateOfBirth", "idType", "idNumber", "idCountry"]) as (keyof OnrampKyc)[] };
  if (code === "ONRAMP_DISABLED") return { kind: "disabled" };
  if (!res.ok) throw new Error(json?.message || "Couldn't start the purchase. Try again.");
  return { kind: "order", order: unwrap(json) as OnrampOrderFull };
}

export async function getOnramp(id: string): Promise<OnrampOrderFull> {
  const { data } = await riftRequest<any>("GET", `/v1/onramps/${encodeURIComponent(id)}`);
  return unwrap(data) as OnrampOrderFull;
}
