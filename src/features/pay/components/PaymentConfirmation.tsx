import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import usePayment from "@/hooks/data/use-payment";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import ActionButton from "@/components/ui/action-button";
import rift from "@/lib/rift";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";

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
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const paymentMutation = usePayment();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Get user's balance in the payment currency
  const { data: balanceData } = useBaseUSDCBalance({ currency });
  const localBalance = balanceData?.localAmount || 0;

  // Fetch exchange rate on component mount (use .rate for offramp/payment)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) {
          throw new Error("No authentication token found");
        }

        rift.setBearerToken(authToken);

        if (currency === "USD") {
          setExchangeRate(1);
          setLoadingRate(false);
          return;
        }

        const response = await rift.offramp.previewExchangeRate({
          currency: currency as any,
        });

        setExchangeRate(response.rate); // Use .rate for offramp
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        // Fallback to approximate rates if API fails
        const fallbackRates: Record<SupportedCurrency, number> = {
          KES: 136,
          ETB: 62.5,
          UGX: 3700,
          GHS: 15.8,
          NGN: 1580,
          USD: 1,
        };
        setExchangeRate(fallbackRates[currency]);
        toast.warning("Using approximate exchange rate");
      } finally {
        setLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, [currency]);

  const handleBack = () => {
    setCurrentStep("recipient");
  };

  const handleConfirmPayment = async () => {
    if (!exchangeRate || !paymentData.amount || !paymentData.recipient) {
      toast.error("Missing payment information");
      return;
    }

    // Check if user has sufficient balance
    const paymentAmount = paymentData.amount;
    if (paymentAmount > localBalance) {
      toast.error(
        `Insufficient balance. You can send up to ${currencySymbol} ${localBalance.toLocaleString()} (${currency}).`
      );
      return;
    }

    // Convert local currency amount to USD using the fetched exchange rate
    // Round to 6 decimal places (USDC precision)
    const localAmount = paymentData.amount;
    const usdAmount = currency === "USD" 
      ? localAmount 
      : Math.round((localAmount / exchangeRate) * 1e6) / 1e6;

    // Create recipient JSON string
    const recipientString = JSON.stringify(paymentData.recipient);

    // Check for duplicate transaction
    const lockError = checkAndSetTransactionLock(
      "pay",
      usdAmount,
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
        amount: usdAmount, // Send USD amount to API
        currency: currency as any,
        chain: "base" as const,
        recipient: recipientString,
      };

      console.log("Making payment:", paymentRequest);
      const response = await paymentMutation.mutateAsync(paymentRequest);

      console.log("Payment response:", response);
      setPaymentSuccess(true);
      toast.success("Payment initiated successfully!");

      // Reset after 3 seconds and navigate home
      setTimeout(() => {
        resetPayment();
        navigate("/app");
      }, 3000);
    } catch (error) {
      console.error("Error making payment:", error);
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
        <h1 className="text-xl font-semibold">Confirm Payment</h1>
        <div className="w-5 h-5" /> {/* Placeholder for alignment */}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium mb-2">Review Details</h2>
        <p className="text-text-subtle">Please confirm your payment details</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-surface-subtle rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {/* Payment Type */}
          <div className="flex justify-between items-center">
            <span className="text-text-subtle">Payment Type</span>
            <span className="font-medium">{getPaymentTypeLabel()}</span>
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center">
            <span className="text-text-subtle">Amount</span>
            <span className="font-bold text-lg">
              {currencySymbol} {(paymentData.amount || 0).toLocaleString()} ({currency})
            </span>
          </div>

          {/* Recipient */}
          <div className="flex justify-between items-start">
            <span className="text-text-subtle">
              {currency === "KES" && paymentData.type === "MOBILE" && "To"}
              {currency === "KES" && paymentData.type === "PAYBILL" && "Paybill"}
              {currency === "KES" && paymentData.type === "BUY_GOODS" && "Till"}
              {currency !== "KES" && "To"}
            </span>
            <div className="text-right">
              <div className="font-medium">{getRecipientDisplay()}</div>
              <div className="text-sm text-text-subtle">
                via {paymentData.recipient?.institution}
              </div>
            </div>
          </div>

          {/* Balance Information */}
          <div className="pt-4 border-t border-surface">
            <div className="flex justify-between items-center">
              <span className="text-text-subtle text-sm">Your Balance</span>
              <span className="text-sm font-medium">
                {currencySymbol} {localBalance.toLocaleString()} ({currency})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Insufficient Balance Warning */}
      {paymentData.amount && paymentData.amount > localBalance && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700 dark:text-red-300">
            ⚠️ Insufficient balance. You need {currencySymbol}{" "}
            {paymentData.amount.toLocaleString()} but only have {currencySymbol}{" "}
            {localBalance.toLocaleString()} available.
          </p>
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ Please verify the recipient details carefully. Payments cannot be
          reversed once processed.
        </p>
      </div>

      <div className="mt-auto">
        <ActionButton
          onClick={handleConfirmPayment}
          disabled={
            loadingRate ||
            !!(paymentData.amount && paymentData.amount > localBalance)
          }
          loading={paymentMutation.isPending || loadingRate}
          className="w-full"
        >
          {loadingRate
            ? "Loading..."
            : paymentData.amount && paymentData.amount > localBalance
            ? "Insufficient Balance"
            : "Confirm & Send"}
        </ActionButton>
      </div>
    </motion.div>
  );
}
