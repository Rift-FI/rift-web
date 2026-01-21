import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useRequest } from "../context";
import ActionButton from "@/components/ui/action-button";
import useCountryDetection from "@/hooks/data/use-country-detection";
import { SUPPORTED_CURRENCIES, Currency } from "@/components/ui/currency-selector";
import { useOfframpFeePreview, calculateOnrampFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

export default function AmountInput() {
  const navigate = useNavigate();
  const { updateRequestData, setCurrentStep, requestType } = useRequest();
  const [localAmount, setLocalAmount] = useState("");
  const { data: countryInfo, isLoading: countryLoading } = useCountryDetection();

  // Get selected currency from localStorage or detected country
  const getInitialCurrency = (): Currency => {
    const stored = localStorage.getItem("selected_currency");
    if (stored) {
      const found = SUPPORTED_CURRENCIES.find((c) => c.code === stored);
      if (found) return found;
    }
    if (countryInfo?.currency) {
      const found = SUPPORTED_CURRENCIES.find((c) => c.code === countryInfo.currency);
      if (found) return found;
    }
    return SUPPORTED_CURRENCIES.find((c) => c.code === "USD")!;
  };

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(getInitialCurrency());

  // Fetch fee preview for top-ups (onramp)
  const { data: feePreview, isLoading: feeLoading, error: feeError } = useOfframpFeePreview(
    selectedCurrency.code, 
    requestType === "topup" && selectedCurrency.code !== "USD"
  );

  // Calculate fee breakdown for top-ups
  const feeBreakdown = useMemo(() => {
    const amount = parseFloat(localAmount);
    if (!feePreview || isNaN(amount) || amount <= 0 || requestType !== "topup" || selectedCurrency.code === "USD") {
      return null;
    }
    return calculateOnrampFeeBreakdown(amount, feePreview);
  }, [localAmount, feePreview, requestType, selectedCurrency.code]);

  useEffect(() => {
    if (countryInfo?.currency && !localStorage.getItem("selected_currency")) {
      const found = SUPPORTED_CURRENCIES.find((c) => c.code === countryInfo.currency);
      if (found) {
        setSelectedCurrency(found);
      }
    }
  }, [countryInfo]);

  const handleNext = () => {
    if (!localAmount || parseFloat(localAmount) <= 0) return;
    
    if (requestType === "topup") {
      // For top-ups, skip description and go straight to creating the invoice
      updateRequestData({
        amount: parseFloat(localAmount),
        currency: selectedCurrency.code,
        description: "Rift wallet top-up",
        feeBreakdown: feeBreakdown || undefined,
      });
      // We'll handle the invoice creation in the sharing options component
      setCurrentStep("sharing");
    } else {
      // For requests, go to description step
      updateRequestData({
        amount: parseFloat(localAmount),
        currency: selectedCurrency.code,
      });
      setCurrentStep("description");
    }
  };

  const isValidAmount = localAmount && parseFloat(localAmount) > 0;

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate("/app")}
          className="mr-4 p-2 rounded-full hover:bg-surface-subtle transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">
          {requestType === "topup" ? "Top Up Account" : "Request Payment"}
        </h1>
      </div>

      {/* Amount Input */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium mb-2">Enter Amount</h2>
          <p className="text-text-subtle">
            {requestType === "topup" 
              ? "How much do you want to add to your account?" 
              : "How much do you want to request?"
            }
          </p>
        </div>

        <div className="w-full max-w-sm">
          {/* Currency Info */}
          <div className="text-center mb-2">
            <span className="text-sm text-text-subtle">
              {countryLoading ? "Detecting currency..." : `Requesting in ${selectedCurrency.code}`}
            </span>
          </div>

          <div className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <span className="text-lg font-medium mr-2">{CURRENCY_SYMBOLS[selectedCurrency.code as SupportedCurrency]}</span>
              <input
                type="number"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value)}
                placeholder="0"
                className="text-4xl font-bold bg-transparent border-none outline-none text-center w-full"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Amount Buttons - Dynamic based on currency */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(() => {
              const quickAmounts = 
                selectedCurrency.code === "KES" ? [100, 500, 1000, 2000, 5000, 10000] :
                selectedCurrency.code === "ETB" ? [50, 100, 500, 1000, 2000, 5000] :
                selectedCurrency.code === "UGX" ? [1000, 5000, 10000, 50000, 100000, 500000] :
                selectedCurrency.code === "GHS" ? [10, 50, 100, 200, 500, 1000] :
                selectedCurrency.code === "NGN" ? [500, 1000, 5000, 10000, 50000, 100000] :
                [5, 10, 20, 50, 100, 500]; // USD
              
              return quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setLocalAmount(amount.toString())}
                  className="py-2 px-3 text-sm bg-surface-subtle rounded-lg hover:bg-surface transition-colors"
                >
                  {amount.toLocaleString()}
                </button>
              ));
            })()}
          </div>

          {/* Fee Breakdown for Top-ups */}
          {requestType === "topup" && feeBreakdown && parseFloat(localAmount) > 0 && (
            <div className="bg-surface-subtle rounded-lg p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FiInfo className="w-4 h-4 text-accent-primary" />
                <span className="text-sm font-medium">Fee Breakdown</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-text-subtle">Top-up amount</span>
                <span className="font-medium">{CURRENCY_SYMBOLS[selectedCurrency.code as SupportedCurrency]} {feeBreakdown.localAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-text-subtle">Fee ({feeBreakdown.feePercentage}%)</span>
                <span className="font-medium text-yellow-600">+ {CURRENCY_SYMBOLS[selectedCurrency.code as SupportedCurrency]} {feeBreakdown.feeLocal.toLocaleString()}</span>
              </div>
              
              <div className="border-t border-surface pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total you pay</span>
                  <span className="font-bold">{CURRENCY_SYMBOLS[selectedCurrency.code as SupportedCurrency]} {feeBreakdown.totalLocalToPay.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading fee info */}
          {requestType === "topup" && feeLoading && parseFloat(localAmount) > 0 && selectedCurrency.code !== "USD" && (
            <div className="bg-surface-subtle rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-text-subtle">Loading fee information...</p>
            </div>
          )}
          
          {/* Error loading fee - show warning */}
          {requestType === "topup" && feeError && !feeLoading && parseFloat(localAmount) > 0 && selectedCurrency.code !== "USD" && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Could not load fee info. A 1% service fee will apply to your top-up.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Next Button */}
      <div className="mt-auto">
        <ActionButton
          onClick={handleNext}
          disabled={!isValidAmount || (requestType === "topup" && feeLoading && selectedCurrency.code !== "USD")}
          className="w-full"
        >
          Next
        </ActionButton>
      </div>
    </motion.div>
  );
}