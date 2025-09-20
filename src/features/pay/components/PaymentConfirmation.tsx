import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import usePayment from "@/hooks/data/use-payment";
import ActionButton from "@/components/ui/action-button";
import rift from "@/lib/rift";

export default function PaymentConfirmation() {
  const navigate = useNavigate();
  const { paymentData, setCurrentStep, resetPayment } = usePay();
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const paymentMutation = usePayment();

  // Fetch exchange rate on component mount
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) {
          throw new Error("No authentication token found");
        }
        
        rift.setBearerToken(authToken);
        
        const response = await rift.offramp.previewExchangeRate({
          currency: "KES" as any
        });
        
        setExchangeRate(response.rate);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        // Fallback to approximate rate if API fails
        setExchangeRate(136); // Approximate 136 KES = 1 USD
        toast.warning("Using approximate exchange rate");
      } finally {
        setLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, []);

  const handleBack = () => {
    setCurrentStep("recipient");
  };

  const handleConfirmPayment = async () => {
    if (!exchangeRate || !paymentData.amount || !paymentData.recipient) {
      toast.error("Missing payment information");
      return;
    }

    try {
      // Convert KES amount to USD using the fetched exchange rate
      const kesAmount = paymentData.amount;
      const usdAmount = kesAmount / exchangeRate;

      // Create recipient JSON string
      const recipientString = JSON.stringify(paymentData.recipient);

      const paymentRequest = {
        token: "USDC" as const,
        amount: usdAmount, // Send USD amount to API
        currency: "KES" as const,
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
  };

  const getRecipientDisplay = () => {
    if (!paymentData.recipient) return "";
    
    const { accountIdentifier, accountNumber, accountName, type } = paymentData.recipient;
    
    if (type === "PAYBILL") {
      return `${accountIdentifier} - ${accountNumber}${accountName ? ` (${accountName})` : ""}`;
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
          Your payment is being processed. You'll receive a confirmation shortly.
        </p>
        
        <div className="bg-surface-subtle rounded-lg p-4 w-full max-w-sm">
          <div className="text-center">
            <p className="text-sm text-text-subtle">Amount Paid</p>
            <p className="text-xl font-bold">KSh {(paymentData.amount || 0).toLocaleString()}</p>
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
            <span className="font-bold text-lg">KSh {(paymentData.amount || 0).toLocaleString()}</span>
          </div>

          {/* Recipient */}
          <div className="flex justify-between items-start">
            <span className="text-text-subtle">
              {paymentData.type === "MOBILE" && "To"}
              {paymentData.type === "PAYBILL" && "Paybill"}
              {paymentData.type === "BUY_GOODS" && "Till"}
            </span>
            <div className="text-right">
              <div className="font-medium">{getRecipientDisplay()}</div>
              <div className="text-sm text-text-subtle">via Safaricom</div>
            </div>
          </div>

        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ Please verify the recipient details carefully. Payments cannot be reversed once processed.
        </p>
      </div>

      <div className="mt-auto">
        <ActionButton
          onClick={handleConfirmPayment}
          disabled={loadingRate}
          loading={paymentMutation.isPending || loadingRate}
          className="w-full"
        >
          {loadingRate ? "Loading..." : "Confirm & Pay"}
        </ActionButton>
      </div>
    </motion.div>
  );
}