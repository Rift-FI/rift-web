import { motion } from "motion/react";
import { FiArrowLeft, FiGlobe } from "react-icons/fi";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const { updatePaymentData, setCurrentStep } = usePay();
  const { data: countryInfo } = useCountryDetection();

  useEffect(() => {
    if (countryInfo?.currency) {
      // Could auto-select here, but let user choose
    }
  }, [countryInfo]);

  const handleCountrySelect = (currency: SupportedCurrency) => {
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

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full overflow-y-auto overscroll-contain p-4 pb-8 md:p-8"
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button
            onClick={() => navigate("/app")}
            className="p-2 -ml-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5 text-text-default" />
          </button>
          <h1
            className="text-[17px] md:text-[18px] font-semibold text-text-default tracking-[-0.015em]"
            style={{ fontFamily: 'var(--app-font-display)' }}
          >
            Send Money
          </h1>
          <div className="w-9 h-9" />
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-accent-primary/15">
            <FiGlobe className="w-7 h-7 md:w-8 md:h-8 text-accent-primary" />
          </div>
          <h2
            className="text-[24px] md:text-[32px] font-semibold text-text-default mb-2 leading-[1.1] tracking-[-0.02em]"
            style={{ fontFamily: 'var(--app-font-display)' }}
          >
            Send money across borders
          </h2>
          <p className="text-[14px] md:text-[15px] text-text-subtle/90 max-w-md mx-auto">
            Pay bills, send to mobile money, banks, and more — powered by on-chain rails.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            {SUPPORTED_COUNTRIES.map((country) => {
              const isDetected =
                detectedCountry?.currency === country.currency;
              return (
                <button
                  key={country.currency}
                  onClick={() => handleCountrySelect(country.currency)}
                  className="group relative w-full p-4 rounded-2xl border bg-white border-surface hover:border-accent-primary/40 hover:shadow-md transition-all text-left cursor-pointer active:scale-[0.99]"
                >
                  {isDetected && (
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-primary text-white">
                      You
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-[32px] leading-none">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[15px] text-text-default mb-0.5 truncate">
                        {country.name}
                      </h3>
                      <p className="text-[12px] text-text-subtle/80 truncate">
                        {country.description}
                      </p>
                    </div>
                    <span className="text-text-subtle/40 group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all">
                      &rarr;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[12px] text-text-subtle/70">
            {detectedCountry && (
              <>Detected location: {detectedCountry.name}</>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
