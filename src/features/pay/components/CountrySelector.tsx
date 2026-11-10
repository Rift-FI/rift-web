import { OptionTile } from "@/v2/ui/flow";
import { usePay } from "../context";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCountryDetection from "@/hooks/data/use-country-detection";
import { useEffect } from "react";

interface CountryOption {
  currency: SupportedCurrency;
  name: string;
  flag: string;
  description: string;
}

const SUPPORTED_COUNTRIES: CountryOption[] = [
  {
    currency: "KES",
    name: "Kenya",
    flag: "\u{1F1F0}\u{1F1EA}",
    description: "M-Pesa, Paybill, Buy Goods, Banks",
  },
  {
    currency: "NGN",
    name: "Nigeria",
    flag: "\u{1F1F3}\u{1F1EC}",
    description: "Bank transfers",
  },
  {
    currency: "UGX",
    name: "Uganda",
    flag: "\u{1F1FA}\u{1F1EC}",
    description: "MTN, Airtel Money",
  },
  {
    currency: "TZS",
    name: "Tanzania",
    flag: "\u{1F1F9}\u{1F1FF}",
    description: "Tigo Pesa, Airtel, Banks",
  },
  {
    currency: "CDF",
    name: "DR Congo",
    flag: "\u{1F1E8}\u{1F1E9}",
    description: "Orange Money, Airtel Money",
  },
  {
    currency: "MWK",
    name: "Malawi",
    flag: "\u{1F1F2}\u{1F1FC}",
    description: "TNM Mpamba, Banks",
  },
  {
    currency: "BRL",
    name: "Brazil",
    flag: "\u{1F1E7}\u{1F1F7}",
    description: "PIX instant payment",
  },
];

export default function CountrySelector() {
  const { updatePaymentData, setCurrentStep, method } = usePay();
  const { data: countryInfo } = useCountryDetection();

  useEffect(() => {
    if (countryInfo?.currency) {
      // Could auto-select here, but let user choose
    }
  }, [countryInfo]);

  const handleCountrySelect = (currency: SupportedCurrency) => {
    // Bank payouts to Kenya skip the M-Pesa type picker.
    if (currency === "KES" && method === "bank") {
      updatePaymentData({ currency, type: "BANK" });
      setCurrentStep("recipient");
      return;
    }
    updatePaymentData({ currency });

    if (currency === "KES") {
      setCurrentStep("type");
    } else {
      setCurrentStep("recipient");
    }
  };

  // Find if user's detected country is in the list
  const detectedCountry = countryInfo?.currency
    ? SUPPORTED_COUNTRIES.find((c) => c.currency === countryInfo.currency)
    : null;

  const METHOD_COUNTRIES: Record<string, SupportedCurrency[]> = {
    mobile: ["KES", "UGX", "TZS", "CDF", "MWK"],
    bank: ["KES", "NGN", "TZS", "MWK", "BRL"],
  };
  const BANK_DESCRIPTION: Partial<Record<SupportedCurrency, string>> = {
    KES: "Any Kenyan bank account",
    NGN: "Any Nigerian bank account",
    TZS: "Tanzanian bank accounts",
    MWK: "Malawian bank accounts",
    BRL: "PIX instant payment",
  };
  const countries =
    method === "all"
      ? SUPPORTED_COUNTRIES
      : SUPPORTED_COUNTRIES.filter((c) => METHOD_COUNTRIES[method].includes(c.currency)).map((c) =>
          method === "bank" ? { ...c, description: BANK_DESCRIPTION[c.currency] || c.description } : c
        );

  return (
    <div className="w-full">
      {detectedCountry && <p className="mb-3 text-[12.5px] text-ink-3">Detected location: {detectedCountry.name}</p>}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="list" aria-label="Destination country">
        {countries.map((country) => {
          const isDetected = detectedCountry?.currency === country.currency;
          return (
            <li key={country.currency}>
              <OptionTile onClick={() => handleCountrySelect(country.currency)}>
                <span className="flex h-9 w-11 flex-shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-subtle text-[11.5px] font-semibold tracking-wide text-ink-2">
                  {country.currency}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold text-ink">{country.name}</span>
                    {isDetected && <span className="rounded-full bg-teal-50 px-1.5 text-[11px] font-semibold leading-5 text-accent-primary">Your location</span>}
                  </span>
                  <span className="block truncate text-[12.5px] text-ink-3">{country.description}</span>
                </span>
              </OptionTile>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
