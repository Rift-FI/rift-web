import { motion } from "motion/react";
import { FiArrowLeft, FiGlobe } from "react-icons/fi";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";
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
    flag: "🇰🇪",
    description: "M-Pesa, Paybill, Buy Goods",
  },
  {
    currency: "ETB",
    name: "Ethiopia",
    flag: "🇪🇹",
    description: "Telebirr",
  },
  {
    currency: "UGX",
    name: "Uganda",
    flag: "🇺🇬",
    description: "MTN, Airtel Money",
  },
  {
    currency: "GHS",
    name: "Ghana",
    flag: "🇬🇭",
    description: "MTN, AirtelTigo, Airtel",
  },
  // Nigeria - Not active yet
  // {
  //   currency: "NGN",
  //   name: "Nigeria",
  //   flag: "🇳🇬",
  //   description: "Coming soon",
  // },
];

export default function CountrySelector() {
  const navigate = useNavigate();
  const { updatePaymentData, setCurrentStep } = usePay();
  const { data: countryInfo } = useCountryDetection();

  // Auto-select user's current country if detected
  useEffect(() => {
    if (countryInfo?.currency) {
      const supported = SUPPORTED_COUNTRIES.find(
        (c) => c.currency === countryInfo.currency
      );
      if (supported) {
        // Could auto-select here, but let's let user choose
      }
    }
  }, [countryInfo]);

  const handleCountrySelect = (currency: SupportedCurrency) => {
    updatePaymentData({ currency });

    // For Kenya, show payment type selection (MOBILE/PAYBILL/BUY_GOODS)
    // For others, skip to amount directly
    if (currency === "KES") {
      setCurrentStep("type");
    } else {
      setCurrentStep("amount");
    }
  };

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
        <div className="w-5 h-5" /> {/* Placeholder for alignment */}
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiGlobe className="w-8 h-8 text-accent-primary" />
        </div>
        <h2 className="text-2xl font-medium mb-2">Send money to 4 African countries</h2>
        <p className="text-text-subtle">Pay bills, send to mobile money, and more</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
          {SUPPORTED_COUNTRIES.map((country) => (
            <button
              key={country.currency}
              onClick={() => handleCountrySelect(country.currency)}
              className="w-full p-4 rounded-lg border-2 transition-all text-left bg-surface-subtle border-surface hover:border-accent-primary hover:bg-surface"
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
          {countryInfo?.currency && (
            <>
              📍 You're currently in{" "}
              {SUPPORTED_COUNTRIES.find((c) => c.currency === countryInfo.currency)
                ?.name || "a supported country"}
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}

