import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
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
  const { paymentData, updatePaymentData, setCurrentStep } = usePay();
  const [localAmount, setLocalAmount] = useState("");

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Fetch fee preview from API
  const { data: feePreview, isLoading: feeLoading } = useOfframpFeePreview(currency, currency !== "USD");
  
  // Get user's balance
  const { data: balanceData } = useBaseUSDCBalance({ currency });
  const usdcBalance = balanceData?.usdcAmount || 0;
  const localBalance = balanceData?.localAmount || 0;

  // Get buying rate from fee preview
  const buyingRate = feePreview?.buying_rate || feePreview?.rate || (currency === "USD" ? 1 : null);
  const loadingRate = feeLoading && currency !== "USD";

  // Calculate fee breakdown when amount changes
  const feeBreakdown = useMemo(() => {
    const amount = parseFloat(localAmount);
    if (!feePreview || isNaN(amount) || amount <= 0 || currency === "USD") return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [localAmount, feePreview, currency]);

  // Check if user has enough USDC balance (including fee)
  const hasInsufficientBalance = useMemo(() => {
    if (!feeBreakdown) {
      // For USD, just check direct conversion
      if (currency === "USD") {
        const amount = parseFloat(localAmount);
        return !isNaN(amount) && amount > usdcBalance;
      }
      return false;
    }
    return feeBreakdown.usdcNeeded > usdcBalance;
  }, [feeBreakdown, usdcBalance, localAmount, currency]);

  // Calculate minimum payment: 0.3 USDC × buying_rate
  const minPaymentLocal = buyingRate ? Math.round(0.3 * buyingRate) : 10;

  const handleBack = () => {
    if (paymentData.currency === "KES") {
      setCurrentStep("type");
    } else {
      setCurrentStep("country");
    }
  };

  const handleNext = () => {
    const amount = parseFloat(localAmount);

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount < minPaymentLocal) {
      toast.error(
        `Minimum payment is ${currencySymbol} ${minPaymentLocal.toLocaleString()} (0.3 USDC)`
      );
      return;
    }

    // Check if user has sufficient USDC balance (including fee)
    if (hasInsufficientBalance && feeBreakdown) {
      toast.error(
        `Insufficient balance. You need ${feeBreakdown.usdcNeeded.toFixed(4)} USDC (includes ${currencySymbol} ${feeBreakdown.feeLocal.toLocaleString()} fee) but only have ${usdcBalance.toFixed(4)} USDC.`
      );
      return;
    }

    updatePaymentData({
      amount: amount,
      feeBreakdown: feeBreakdown || undefined,
    });
    setCurrentStep("recipient");
  };

  const isValidAmount = localAmount && parseFloat(localAmount) >= minPaymentLocal && !hasInsufficientBalance;

  const getPaymentTypeLabel = () => {
    if (paymentData.type === "MOBILE") return "Send Money";
    if (paymentData.type === "PAYBILL") return "Paybill Payment";
    if (paymentData.type === "BUY_GOODS") return "Buy Goods Payment";
    
    // For non-Kenya countries
    const countryNames: Record<SupportedCurrency, string> = {
      KES: "Kenya",
      ETB: "Ethiopia",
      UGX: "Uganda",
      GHS: "Ghana",
      NGN: "Nigeria",
      USD: "International",
    };
    return `Send to ${countryNames[currency]}`;
  };

  // Dynamic quick amounts based on currency
  const getQuickAmounts = () => {
    const min = minPaymentLocal;
    switch (currency) {
      case "KES":
        return [min, 100, 500, 1000, 2000, 5000];
      case "ETB":
        return [min, 100, 500, 1000, 2000, 5000];
      case "UGX":
        return [min, 5000, 10000, 50000, 100000, 500000];
      case "GHS":
        return [min, 20, 50, 100, 500, 1000];
      case "NGN":
        return [min, 1000, 5000, 10000, 50000, 100000];
      case "USD":
        return [1, 5, 10, 20, 50, 100];
      default:
        return [min, 100, 500, 1000, 2000, 5000];
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
        <button onClick={handleBack} className="p-2">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">{getPaymentTypeLabel()}</h1>
        <div className="w-5 h-5" /> {/* Placeholder for alignment */}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium mb-2">Enter Amount</h2>
        <p className="text-text-subtle">How much do you want to send?</p>
      </div>

      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <span className="text-lg font-medium mr-2">{currencySymbol}</span>
            <input
              type="number"
              value={localAmount}
              onChange={(e) => setLocalAmount(e.target.value)}
              placeholder="0"
              className="text-4xl font-bold bg-transparent border-none outline-none text-center w-full"
              autoFocus
            />
          </div>
          <p className="text-sm text-text-subtle">Sending in {currency}</p>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {getQuickAmounts()
            .filter((amount, index, arr) => arr.indexOf(amount) === index) // Remove duplicates
            .sort((a, b) => a - b)
            .slice(0, 6)
            .map((amount) => (
              <button
                key={amount}
                onClick={() => setLocalAmount(amount.toString())}
                className="p-3 bg-surface-subtle rounded-lg hover:bg-surface transition-colors text-sm font-medium"
              >
                {amount.toLocaleString()}
              </button>
            ))}
        </div>

        {/* Fee Breakdown */}
        {feeBreakdown && parseFloat(localAmount) > 0 && (
          <div className="bg-surface-subtle rounded-lg p-4 mb-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <FiInfo className="w-4 h-4 text-accent-primary" />
              <span className="text-sm font-medium">Fee Breakdown</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-text-subtle">Recipient receives</span>
              <span className="font-medium">{currencySymbol} {feeBreakdown.localAmount.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-text-subtle">Fee ({feeBreakdown.feePercentage}%)</span>
              <span className="font-medium text-yellow-600">+ {currencySymbol} {feeBreakdown.feeLocal.toLocaleString()}</span>
            </div>
            
            <div className="border-t border-surface pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-subtle">Total deducted</span>
                <span className="font-bold">{currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-text-subtle">Your balance</span>
                <span className={hasInsufficientBalance ? "text-red-500 font-medium" : "text-green-600"}>
                  {currencySymbol} {localBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {hasInsufficientBalance && feeBreakdown && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ Insufficient balance. You need {currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}{" "}
              but only have {currencySymbol} {localBalance.toLocaleString()}.
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <ActionButton
          onClick={handleNext}
          disabled={!isValidAmount || loadingRate}
          loading={loadingRate}
          className="w-full"
        >
          {loadingRate 
            ? "Loading..." 
            : hasInsufficientBalance 
            ? "Insufficient Balance" 
            : "Next"}
        </ActionButton>
      </div>
    </motion.div>
  );
}
