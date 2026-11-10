/**
 * Onramp (buy stablecoins with local currency). Two providers:
 *   KES / NGN → Paycrest (identity verified once via SmileID; KES = phone
 *   prompt, NGN = virtual bank account).
 *   TZS / UGX / GHS / MWK / CDF → Pretium mobile-money prompt (phone +
 *   network; USDC on Base or USDT on Celo only; no identity check).
 * Contract:
 *   GET  /v1/onramps/quote?currency&amount&token&chain
 *   POST /v1/onramps { currency, fiatAmount, token, chain, phone?, network? }
 *     → { id, status, providerAccount?, collection?, fiatAmount, cryptoAmount, token, chain, expiresAt }
 *     → 409 { error: "ONRAMP_KYC_REQUIRED", missing: [...] } | { error: "ONRAMP_DISABLED" }
 *     → 400 { error: "AMOUNT_OUT_OF_RANGE", min, max }
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
  | { kind: "disabled" }
  | { kind: "range"; min: number; max: number };

export type OnrampProvider = "paycrest" | "pretium";
export const PAYCREST_CURRENCIES = ["KES", "NGN"];
export const onrampProviderFor = (currency: string, explicit?: string): OnrampProvider =>
  explicit === "paycrest" || explicit === "pretium" ? explicit : PAYCREST_CURRENCIES.includes(currency) ? "paycrest" : "pretium";

/** What each provider can deliver, as token + chain pairs. */
export const ONRAMP_ASSETS: Record<OnrampProvider, { token: string; chain: string }[]> = {
  paycrest: [
    { token: "USDC", chain: "BASE" },
    { token: "USDT", chain: "BASE" },
    { token: "USDC", chain: "POLYGON" },
    { token: "USDT", chain: "POLYGON" },
    { token: "USDC", chain: "ETHEREUM" },
    { token: "USDT", chain: "ETHEREUM" },
  ],
  pretium: [
    { token: "USDC", chain: "BASE" },
    { token: "USDT", chain: "CELO" },
  ],
};

export function rangeFrom(json: any): { min: number; max: number } | null {
  const d = json?.data ?? json ?? {};
  const code = d?.error ?? d?.code;
  if (code !== "AMOUNT_OUT_OF_RANGE") return null;
  const min = Number(d.min ?? d.minAmount ?? d.limits?.min);
  const max = Number(d.max ?? d.maxAmount ?? d.limits?.max);
  return { min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0 };
}

export interface OnrampOrderFull extends OnrampOrder {
  collection?: { phone?: string; network?: string; prompt?: boolean };
}

const unwrap = (d: any) => d?.data ?? d;

export async function getOnrampQuote(args: { currency: string; amount: number; token: string; chain: string }): Promise<OnrampQuote> {
  const q = new URLSearchParams({ currency: args.currency, amount: String(args.amount), token: args.token, chain: args.chain });
  const res = await fetch(`${backendBaseUrl()}/v1/onramps/quote?${q}`, { headers: authHeaders(), cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: Error & { range?: { min: number; max: number } } = new Error(json?.message || "No quote for this amount");
    err.range = rangeFrom(json) ?? undefined;
    throw err;
  }
  const d = unwrap(json);
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

export async function createOnramp(body: { currency: string; fiatAmount: number; token: string; chain: string; phone?: string; network?: string }): Promise<CreateOnrampResult> {
  const res = await fetch(`${backendBaseUrl()}/v1/onramps`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body), cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  const code = json?.error ?? json?.code ?? json?.data?.error;
  if (code === "ONRAMP_KYC_REQUIRED") return { kind: "kyc", missing: (json?.missing ?? json?.data?.missing ?? ["fullName", "dateOfBirth", "idType", "idNumber", "idCountry"]) as (keyof OnrampKyc)[] };
  if (code === "ONRAMP_DISABLED") return { kind: "disabled" };
  const range = rangeFrom(json);
  if (range) return { kind: "range", ...range };
  if (!res.ok) throw new Error(json?.message || "Couldn't start the purchase. Try again.");
  return { kind: "order", order: unwrap(json) as OnrampOrderFull };
}

export async function getOnramp(id: string): Promise<OnrampOrderFull> {
  const { data } = await riftRequest<any>("GET", `/v1/onramps/${encodeURIComponent(id)}`);
  return unwrap(data) as OnrampOrderFull;
}
