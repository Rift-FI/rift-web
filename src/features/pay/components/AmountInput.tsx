import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";
import RiftLoader from "@/components/ui/rift-loader";

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
  const { paymentData, updatePaymentData, setCurrentStep } = usePay();
  const [localAmount, setLocalAmount] = useState("");
  const isDesktop = useDesktopDetection();

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
    navigate("/app");
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

  const content = (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`flex flex-col h-full ${isDesktop ? "p-8" : "p-4"}`}
    >
      {isDesktop ? (
        <div className="w-full max-w-2xl mx-auto">
          {/* Desktop Header */}
          <div className="flex items-center p-6 border-b border-gray-200 mb-6">
            <button
              onClick={handleBack}
              className="mr-4 p-2 rounded-2xl hover:bg-accent-primary/10 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-accent-primary" />
            </button>
            <h1 className="text-xl font-semibold text-text-default">
              {getPaymentTypeLabel()}
            </h1>
          </div>

          {/* Desktop Amount Input */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-text-default mb-2">Enter Amount</h2>
                <p className="text-text-subtle">How much do you want to send?</p>
              </div>

              {/* Currency Info */}
              <div className="text-center mb-6">
                <span className="text-sm text-text-subtle bg-accent-primary/10 px-3 py-1.5 rounded-full">
                  Sending in {currency}
                </span>
              </div>

              {/* Amount Input Field */}
              <div className="bg-white rounded-2xl border-2 border-accent-primary/20 p-8 mb-6">
                <div className="flex items-center justify-center">
                  <span className="text-2xl font-medium mr-3 text-accent-primary">{currencySymbol}</span>
                  <input
                    type="number"
                    value={localAmount}
                    onChange={(e) => setLocalAmount(e.target.value)}
                    placeholder="0"
                    className="text-5xl font-bold bg-transparent border-none outline-none text-center w-full text-text-default placeholder:text-gray-300"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              {feeBreakdown && parseFloat(localAmount) > 0 && (
                <div className="bg-accent-primary/5 rounded-2xl border border-accent-primary/20 p-5 mb-6 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <FiInfo className="w-5 h-5 text-accent-primary" />
                    <span className="text-sm font-semibold text-text-default">Fee Breakdown</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-text-subtle">Recipient receives</span>
                    <span className="font-medium text-text-default">{currencySymbol} {feeBreakdown.localAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-text-subtle">Fee ({feeBreakdown.feePercentage}%)</span>
                    <span className="font-medium text-accent-primary">+ {currencySymbol} {feeBreakdown.feeLocal.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-accent-primary/20 pt-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-text-default">Total deducted</span>
                      <span className="font-bold text-accent-primary text-base">{currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-2">
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
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ Insufficient balance. You need {currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}{" "}
                    but only have {currencySymbol} {localBalance.toLocaleString()}.
                  </p>
                </div>
              )}

              {/* Desktop Next Button */}
              <div className="mt-8">
                <button
                  onClick={handleNext}
                  disabled={!isValidAmount || loadingRate}
                  className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingRate ? (
                    <>
                      <RiftLoader size="sm" />
                      <span>Loading...</span>
                    </>
                  ) : hasInsufficientBalance ? (
                    "Insufficient Balance"
                  ) : (
                    "Next"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={handleBack} className="p-2">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">{getPaymentTypeLabel()}</h1>
            <div className="w-5 h-5" />
          </div>

          {/* Mobile Content */}
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

            {/* Mobile Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {getQuickAmounts()
                .filter((amount, index, arr) => arr.indexOf(amount) === index)
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

            {/* Mobile Fee Breakdown */}
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

            {/* Mobile Insufficient Balance Warning */}
            {hasInsufficientBalance && feeBreakdown && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Insufficient balance. You need {currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}{" "}
                  but only have {currencySymbol} {localBalance.toLocaleString()}.
                </p>
              </div>
            )}
          </div>

          {/* Mobile Next Button */}
          <div className="mt-auto">
            <button
              onClick={handleNext}
              disabled={!isValidAmount || loadingRate}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingRate ? (
                <>
                  <RiftLoader size="sm" />
                  <span>Loading...</span>
                </>
              ) : hasInsufficientBalance ? (
                "Insufficient Balance"
              ) : (
                "Next"
              )}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="lg" className="h-full">
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}
