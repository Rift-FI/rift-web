import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiCheck, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import usePayment from "@/hooks/data/use-payment";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
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

export default function PaymentConfirmation() {
  const navigate = useNavigate();
  const { paymentData, setCurrentStep, resetPayment } = usePay();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const paymentMutation = usePayment();
  const isDesktop = useDesktopDetection();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Get user's balance
  const { data: balanceData, isLoading: balanceLoading } = useBaseUSDCBalance({ currency });
  const localBalance = balanceData?.localAmount || 0;
  const usdcBalance = balanceData?.usdcAmount || 0;
  
  // Always fetch fee preview to show fees even if not passed from context
  const { data: feePreview, isLoading: feeLoading, error: feeError } = useOfframpFeePreview(currency);
  
  // Calculate fee breakdown - use from context if available, otherwise calculate here
  const feeBreakdown = useMemo(() => {
    // If we have it from context, use it
    if (paymentData.feeBreakdown) {
      return paymentData.feeBreakdown;
    }
    // Otherwise calculate it here
    const amount = paymentData.amount || 0;
    if (!feePreview || amount <= 0) return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [paymentData.feeBreakdown, paymentData.amount, feePreview]);

  // Use fee breakdown for exchange rate if available
  const exchangeRate = feeBreakdown?.exchangeRate || balanceData?.exchangeRate || null;
  const isLoading = balanceLoading || feeLoading;
  
  // Calculate fallback fee if API fails but we have balance data
  const fallbackFeeBreakdown = useMemo(() => {
    if (feeBreakdown) return null; // Don't need fallback if we have real data
    if (!balanceData?.exchangeRate || !paymentData.amount) return null;
    
    const amount = paymentData.amount;
    const feePercentage = 1; // Default 1% fee
    const feeLocal = Math.ceil(amount * (feePercentage / 100));
    const totalLocalDeducted = amount + feeLocal;
    const usdcAmount = Math.ceil((amount / balanceData.exchangeRate) * 1e6) / 1e6; // Amount to send to backend
    const usdcNeeded = Math.ceil((totalLocalDeducted / balanceData.exchangeRate) * 1e6) / 1e6; // For balance check
    
    return {
      localAmount: amount,
      feeLocal,
      totalLocalDeducted,
      usdcAmount,    // Send this to backend
      usdcNeeded,    // Use this for balance check
      exchangeRate: balanceData.exchangeRate,
      feePercentage,
      feeBps: 100,
    };
  }, [feeBreakdown, balanceData?.exchangeRate, paymentData.amount]);
  
  // Use real fee breakdown or fallback
  const displayFeeBreakdown = feeBreakdown || fallbackFeeBreakdown;

  const handleBack = () => {
    navigate("/app");
  };

  const handleConfirmPayment = async () => {
    if (!paymentData.amount || !paymentData.recipient) {
      toast.error("Missing payment information");
      return;
    }

    // Check if user has sufficient USDC balance (including fee)
    const feeData = displayFeeBreakdown;
    if (feeData && feeData.usdcNeeded > usdcBalance) {
      toast.error(
        `Insufficient balance. You need ${feeData.usdcNeeded.toFixed(4)} USDC but only have ${usdcBalance.toFixed(4)} USDC.`
      );
      return;
    }

    // Amount to send to backend (WITHOUT fee - backend will deduct fee)
    const localAmount = paymentData.amount;
    const usdAmountToSend = feeData?.usdcAmount || (currency === "USD" 
      ? localAmount 
      : exchangeRate 
        ? Math.round((localAmount / exchangeRate) * 1e6) / 1e6
        : localAmount);

    // Create recipient JSON string
    const recipientString = JSON.stringify(paymentData.recipient);

    // Check for duplicate transaction
    const lockError = checkAndSetTransactionLock(
      "pay",
      usdAmountToSend,
      recipientString,
      currency
    );
    if (lockError) {
      toast.error(lockError);
      return;
    }

    try {
      const paymentRequest = {
        token: "USDC" as const,
        amount: usdAmountToSend, // Send USD amount WITHOUT fee - backend will deduct fee
        currency: currency as any,
        chain: "base" as const,
        recipient: recipientString,
      };

      const response = await paymentMutation.mutateAsync(paymentRequest);

      
      setPaymentSuccess(true);
      toast.success("Payment initiated successfully!");

      // Reset after 3 seconds and navigate home
      setTimeout(() => {
        resetPayment();
        navigate("/app");
      }, 3000);
    } catch (error) {
      
      toast.error("Failed to process payment. Please try again.");
    }
  };

  const getPaymentTypeLabel = () => {
    if (currency === "KES") {
      switch (paymentData.type) {
        case "MOBILE":
          return "Send Money";
        case "PAYBILL":
          return "Paybill Payment";
        case "BUY_GOODS":
          return "Buy Goods Payment";
        default:
          return "Payment";
      }
    } else {
      const countryNames: Record<SupportedCurrency, string> = {
        KES: "Kenya",
        ETB: "Ethiopia",
        UGX: "Uganda",
        GHS: "Ghana",
        NGN: "Nigeria",
        USD: "International",
      };
      return `Send to ${countryNames[currency]}`;
    }
  };

  const getRecipientDisplay = () => {
    if (!paymentData.recipient) return "";

    const { accountIdentifier, accountNumber, accountName, type } =
      paymentData.recipient;

    if (currency === "KES" && type === "PAYBILL") {
      return `${accountIdentifier} - ${accountNumber}${
        accountName ? ` (${accountName})` : ""
      }`;
    }

    return `${accountIdentifier}${accountName ? ` (${accountName})` : ""}`;
  };

  if (paymentSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col h-full p-4 items-center justify-center"
      >
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <FiCheck className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Payment Initiated!</h2>
        <p className="text-text-subtle text-center mb-4">
          Your payment is being processed. You'll receive a confirmation
          shortly.
        </p>

        <div className="bg-surface-subtle rounded-lg p-4 w-full max-w-sm">
          <div className="text-center">
            <p className="text-sm text-text-subtle">Amount Sent</p>
            <p className="text-xl font-bold">
              {currencySymbol} {(paymentData.amount || 0).toLocaleString()} ({currency})
            </p>
            <p className="text-sm text-text-subtle mt-1">
              To: {getRecipientDisplay()}
            </p>
          </div>
        </div>

        <p className="text-sm text-text-subtle mt-6 text-center">
          Redirecting to home...
        </p>
      </motion.div>
    );
  }

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
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Confirm Payment</h1>
              <p className="text-sm text-gray-600 mt-1">Review and confirm your payment details</p>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            {/* Fee Breakdown Card - Always show prominently */}
            {displayFeeBreakdown && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiInfo className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Transaction Fee</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-subtle">Recipient receives</span>
                    <span className="font-medium">{currencySymbol} {displayFeeBreakdown.localAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-text-subtle">Service fee ({displayFeeBreakdown.feePercentage}%)</span>
                    <span className="font-semibold text-amber-600">+ {currencySymbol} {displayFeeBreakdown.feeLocal.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-amber-500/30 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total deducted</span>
                      <span className="font-bold text-lg">{currencySymbol} {displayFeeBreakdown.totalLocalDeducted.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading fee info */}
            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">Loading fee information...</p>
              </div>
            )}
            
            {/* Error loading fee - show warning but allow to proceed */}
            {feeError && !displayFeeBreakdown && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ Could not load fee information. A 1% service fee will apply.
                </p>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-3">
                {/* Payment Type */}
                <div className="flex justify-between items-center">
                  <span className="text-text-subtle">Payment Type</span>
                  <span className="font-medium">{getPaymentTypeLabel()}</span>
                </div>

                {/* Amount Recipient Gets */}
                <div className="flex justify-between items-center">
                  <span className="text-text-subtle">Recipient Gets</span>
                  <span className="font-bold text-lg">
                    {currencySymbol} {(paymentData.amount || 0).toLocaleString()}
                  </span>
                </div>

                {/* Recipient */}
                <div className="flex justify-between items-start pt-2 border-t border-gray-200">
                  <span className="text-text-subtle">
                    {currency === "KES" && paymentData.type === "MOBILE" && "To"}
                    {currency === "KES" && paymentData.type === "PAYBILL" && "Paybill"}
                    {currency === "KES" && paymentData.type === "BUY_GOODS" && "Till"}
                    {currency !== "KES" && "To"}
                  </span>
                  <div className="text-right max-w-[60%]">
                    <div className="font-medium break-words">{getRecipientDisplay()}</div>
                    <div className="text-sm text-text-subtle">
                      via {paymentData.recipient?.institution}
                    </div>
                  </div>
                </div>

                {/* Balance Information */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle text-sm">Your Balance</span>
                    <span className={`text-sm font-medium ${displayFeeBreakdown && displayFeeBreakdown.usdcNeeded > usdcBalance ? 'text-red-500' : 'text-green-600'}`}>
                      {currencySymbol} {localBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {displayFeeBreakdown && displayFeeBreakdown.usdcNeeded > usdcBalance && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Insufficient balance. You need {currencySymbol} {displayFeeBreakdown.totalLocalDeducted.toLocaleString()}{" "}
                  but only have {currencySymbol} {localBalance.toLocaleString()} available.
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Please verify the recipient details carefully. Payments cannot be
                reversed once processed.
              </p>
            </div>

            {/* Desktop Button */}
            <div className="pt-4">
              <button
                onClick={handleConfirmPayment}
                disabled={
                  isLoading ||
                  !!(displayFeeBreakdown && displayFeeBreakdown.usdcNeeded > usdcBalance) ||
                  paymentMutation.isPending
                }
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(paymentMutation.isPending || isLoading) ? (
                  <>
                    <RiftLoader size="sm" />
                    <span>Processing...</span>
                  </>
                ) : displayFeeBreakdown && displayFeeBreakdown.usdcNeeded > usdcBalance ? (
                  "Insufficient Balance"
                ) : (
                  "Confirm & Send"
                )}
              </button>
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
            <h1 className="text-xl font-semibold">Confirm Payment</h1>
            <div className="w-5 h-5" />
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-medium mb-2">Review Details</h2>
              <p className="text-text-subtle">Please confirm your payment details</p>
            </div>

            {/* Mobile Fee Breakdown */}
            {displayFeeBreakdown && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FiInfo className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Transaction Fee</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-subtle">Recipient receives</span>
                  <span className="font-medium">
                    {currencySymbol} {displayFeeBreakdown.localAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-subtle">
                    Service fee ({displayFeeBreakdown.feePercentage}%)
                  </span>
                  <span className="font-semibold text-amber-600">
                    + {currencySymbol} {displayFeeBreakdown.feeLocal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-amber-500/30 pt-2">
                  <span className="font-medium">Total deducted</span>
                  <span className="font-bold text-lg">
                    {currencySymbol} {displayFeeBreakdown.totalLocalDeducted.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Loading fee info */}
            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">Loading fee information...</p>
              </div>
            )}

            {/* Error loading fee */}
            {feeError && !displayFeeBreakdown && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ Could not load fee information. A 1% service fee will apply.
                </p>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-subtle">Payment Type</span>
                <span className="font-medium">{getPaymentTypeLabel()}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-text-subtle">Recipient Gets</span>
                <span className="font-bold text-lg">
                  {currencySymbol} {(paymentData.amount || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-start text-sm">
                <span className="text-text-subtle">To</span>
                <div className="text-right max-w-[60%]">
                  <div className="font-medium break-words">{getRecipientDisplay()}</div>
                  <div className="text-xs text-text-subtle">
                    via {paymentData.recipient?.institution}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm">
                <span className="text-text-subtle">Your Balance</span>
                <span
                  className={
                    displayFeeBreakdown && displayFeeBreakdown.usdcNeeded > usdcBalance
                      ? "text-red-500 font-medium"
                      : "text-green-600 font-medium"
                  }
                >
                  {currencySymbol} {localBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Mobile Insufficient Balance Warning */}
            {displayFeeBreakdown && displayFeeBreakdown.usdcNeeded > usdcBalance && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Insufficient balance. You need {currencySymbol}{" "}
                  {displayFeeBreakdown.totalLocalDeducted.toLocaleString()} but only have {currencySymbol}{" "}
                  {localBalance.toLocaleString()}.
                </p>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Please verify the recipient details carefully. Payments cannot be reversed once processed.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={handleConfirmPayment}
              disabled={
                isLoading ||
                !!(displayFeeBreakdown && displayFeeBreakdown.usdcNeeded > usdcBalance) ||
                paymentMutation.isPending
              }
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paymentMutation.isPending || isLoading ? (
                <>
                  <RiftLoader size="sm" />
                  <span>Processing...</span>
                </>
              ) : displayFeeBreakdown && displayFeeBreakdown.usdcNeeded > usdcBalance ? (
                "Insufficient Balance"
              ) : (
                "Confirm & Send"
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