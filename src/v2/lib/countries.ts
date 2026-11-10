/**
 * Payout / onramp countries (GET /v1/payouts/countries), with the rails and
 * mobile networks each supports. Falls back to a built-in list while the
 * endpoint isn't deployed.
 */
import { useQuery } from "@tanstack/react-query";
import { riftRequest } from "@/lib/nonCustodial";

export interface PayoutCountry {
  country: string; // ISO alpha-2, e.g. "KE"
  currency: string; // KES
  name?: string;
  phoneCode: string; // +254
  rails: { mobile: string[]; bank: boolean; till: boolean; paybill: boolean };
  offrampActive: boolean;
  onrampActive: boolean;
  /** "paycrest" | "pretium"; derived from the currency when absent. */
  onrampProvider?: string;
}

export const FALLBACK_COUNTRIES: PayoutCountry[] = [
  { country: "KE", currency: "KES", name: "Kenya", phoneCode: "+254", rails: { mobile: ["Safaricom", "Airtel"], bank: true, till: true, paybill: true }, offrampActive: true, onrampActive: false },
  { country: "NG", currency: "NGN", name: "Nigeria", phoneCode: "+234", rails: { mobile: [], bank: true, till: false, paybill: false }, offrampActive: true, onrampActive: false },
  { country: "UG", currency: "UGX", name: "Uganda", phoneCode: "+256", rails: { mobile: ["MTN", "Airtel"], bank: false, till: false, paybill: false }, offrampActive: true, onrampActive: false },
  { country: "TZ", currency: "TZS", name: "Tanzania", phoneCode: "+255", rails: { mobile: ["Vodacom", "Halotel", "Airtel", "Yas"], bank: false, till: false, paybill: false }, offrampActive: true, onrampActive: false },
  { country: "GH", currency: "GHS", name: "Ghana", phoneCode: "+233", rails: { mobile: ["MTN", "AirtelTigo", "Telecel"], bank: false, till: false, paybill: false }, offrampActive: false, onrampActive: false },
  { country: "CD", currency: "CDF", name: "DR Congo", phoneCode: "+243", rails: { mobile: ["Orange Money", "Airtel Money"], bank: false, till: false, paybill: false }, offrampActive: true, onrampActive: false },
  { country: "MW", currency: "MWK", name: "Malawi", phoneCode: "+265", rails: { mobile: ["TNM"], bank: true, till: false, paybill: false }, offrampActive: true, onrampActive: false },
  { country: "BR", currency: "BRL", name: "Brazil", phoneCode: "+55", rails: { mobile: [], bank: true, till: false, paybill: false }, offrampActive: true, onrampActive: false },
];

const NAMES: Record<string, string> = { KE: "Kenya", NG: "Nigeria", UG: "Uganda", TZ: "Tanzania", GH: "Ghana", CD: "DR Congo", MW: "Malawi", BR: "Brazil", ET: "Ethiopia", ZA: "South Africa", RW: "Rwanda" };

function normalise(raw: any): PayoutCountry | null {
  if (!raw?.currency) return null;
  const country = String(raw.country ?? raw.countryCode ?? "").toUpperCase();
  const r = raw.rails ?? {};
  return {
    country,
    currency: String(raw.currency).toUpperCase(),
    name: raw.name ?? NAMES[country] ?? country,
    phoneCode: raw.phoneCode ?? "",
    rails: {
      mobile: Array.isArray(r.mobile) ? r.mobile.map(String) : [],
      bank: !!r.bank,
      till: !!r.till,
      paybill: !!r.paybill,
    },
    offrampActive: raw.offrampActive !== false,
    onrampActive: !!raw.onrampActive,
    onrampProvider: raw.onrampProvider ?? raw.onramp?.provider,
  };
}

export function useCountries() {
  const q = useQuery({
    queryKey: ["payout-countries"],
    queryFn: async (): Promise<PayoutCountry[]> => {
      const { data } = await riftRequest<any>("GET", "/v1/payouts/countries");
      const list = Array.isArray(data) ? data : data?.countries ?? data?.data ?? [];
      const out = (Array.isArray(list) ? list : []).map(normalise).filter(Boolean) as PayoutCountry[];
      if (!out.length) throw new Error("no countries");
      return out;
    },
    retry: false,
    staleTime: 10 * 60_000,
  });
  return { countries: q.data ?? (q.isError ? FALLBACK_COUNTRIES : []), isLoading: q.isLoading };
}

export type Rail = "mobile" | "bank" | "till" | "paybill";

export function supportsRail(c: PayoutCountry, rail: Rail) {
  return rail === "mobile" ? c.rails.mobile.length > 0 : c.rails[rail];
}
