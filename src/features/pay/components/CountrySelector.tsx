import { useEffect, useMemo, useState } from "react";
import { usePay, type PaymentType } from "../context";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCountryDetection from "@/hooks/data/use-country-detection";
import { supportsRail, useCountries, type Rail } from "@/v2/lib/countries";
import { Button, Skeleton } from "@/v2/ui";
import { CurrencyPicker, isoFor } from "@/v2/ui/currency-picker";
import { SectionActions } from "@/v2/ui/flow";

const RAIL_OF: Record<string, Rail> = { mobile: "mobile", bank: "bank", till: "till", paybill: "paybill" };
const KES_TYPE: Record<Rail, PaymentType> = { mobile: "MOBILE", bank: "BANK", till: "BUY_GOODS", paybill: "PAYBILL" };

/** Destination country, from the live payout-countries list (active only). */
export default function CountrySelector() {
  const { updatePaymentData, setCurrentStep, method, paymentData } = usePay();
  const { data: countryInfo } = useCountryDetection();
  const { countries, isLoading } = useCountries();
  const rail = RAIL_OF[method] ?? "mobile";

  const available = useMemo(() => countries.filter((c) => c.offrampActive && supportsRail(c, rail)), [countries, rail]);
  const items = available.map((c) => ({ code: c.currency, name: c.name ?? c.country, iso: isoFor(c.country, c.currency) }));
  const [currency, setCurrency] = useState<string>(paymentData.currency || "");

  useEffect(() => {
    if (currency && available.some((c) => c.currency === currency)) return;
    const detected = available.find((c) => c.currency === countryInfo?.currency);
    if (detected || available[0]) setCurrency((detected ?? available[0]).currency);
  }, [available, countryInfo?.currency]);

  const choose = () => {
    const c = available.find((x) => x.currency === currency);
    if (!c) return;
    updatePaymentData({ currency: c.currency as SupportedCurrency, type: c.currency === "KES" ? KES_TYPE[rail] : undefined, recipient: undefined });
    setCurrentStep("recipient");
  };

  if (isLoading) return <Skeleton className="h-11 w-full" />;
  if (!available.length) return <p className="py-4 text-[14px] text-ink-3">Not available right now.</p>;

  return (
    <div className="w-full">
      <CurrencyPicker label="Country" value={currency} onChange={setCurrency} items={items} testId="country-picker" />
      <SectionActions>
        <Button size="lg" onClick={choose} disabled={!currency}>
          Continue
        </Button>
      </SectionActions>
    </div>
  );
}
