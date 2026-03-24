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

    // For Kenya, show payment type selection (MOBILE/PAYBILL/BUY_GOODS)
    // For others, skip to source selection directly
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
      className="flex flex-col h-full p-4"
    >
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate("/app")} className="p-2">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Send Money</h1>
        <div className="w-5 h-5" />
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiGlobe className="w-8 h-8 text-accent-primary" />
        </div>
        <h2 className="text-2xl font-medium mb-2">Send money across borders</h2>
        <p className="text-text-subtle">Pay bills, send to mobile money, banks, and more</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
          {SUPPORTED_COUNTRIES.map((country) => (
            <button
              key={country.currency}
              onClick={() => handleCountrySelect(country.currency)}
              className="w-full p-4 rounded-lg border-2 transition-all text-left bg-surface-subtle border-surface hover:border-accent-primary hover:bg-surface cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{country.flag}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-1">{country.name}</h3>
                  <p className="text-sm text-text-subtle">{country.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-text-subtle">
          {detectedCountry && (
            <>
              You're currently in {detectedCountry.name}
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
