import { motion } from "motion/react";
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
      setCurrentStep("source");
      return;
    }
    updatePaymentData({ currency });

    if (currency === "KES") {
      setCurrentStep("type");
    } else {
      setCurrentStep("source");
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="w-full"
    >
      <div className="rounded-lg border border-hairline bg-card">
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Destination country</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">
              {method === "bank"
                ? "Where the receiving bank account is held"
                : method === "mobile"
                  ? "Where the mobile money wallet is registered"
                  : "Send money across borders"}
            </p>
          </div>
          {detectedCountry && <span className="hidden text-[12px] text-ink-3 sm:block">Detected: {detectedCountry.name}</span>}
        </div>
        <ul className="grid grid-cols-1 gap-px bg-hairline sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2" role="list">
          {countries.map((country) => {
            const isDetected = detectedCountry?.currency === country.currency;
            return (
              <li key={country.currency} className="bg-card">
                <button
                  onClick={() => handleCountrySelect(country.currency)}
                  className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-subtle cursor-pointer"
                >
                  <span className="flex h-9 w-11 flex-shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-subtle text-[11.5px] font-semibold tracking-wide text-ink-2">
                    {country.currency}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14.5px] font-semibold text-ink">{country.name}</span>
                      {isDetected && (
                        <span className="rounded-full bg-teal-50 px-1.5 text-[11px] font-semibold leading-5 text-accent-primary">Your location</span>
                      )}
                    </span>
                    <span className="block truncate text-[12.5px] text-ink-3">{country.description}</span>
                  </span>
                  <span aria-hidden="true" className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-primary">
                    &rarr;
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}
