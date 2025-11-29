import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useUtility } from "../context";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import ActionButton from "@/components/ui/action-button";
import rift from "@/lib/rift";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";

export default function Confirmation() {
  const navigate = useNavigate();
  const { utilityData, setCurrentStep, resetUtility } = useUtility();
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [transactionCode, setTransactionCode] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>("");

  // Get user's balance
  const { data: balanceData } = useBaseUSDCBalance({ currency: "KES" });
  const kesBalance = balanceData?.localAmount || 0;

  // Fetch exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) {
          throw new Error("No authentication token found");
        }

        rift.setBearerToken(authToken);

        const response = await rift.offramp.previewExchangeRate({
          currency: "KES" as any,
        });

        setExchangeRate(response.rate);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        setExchangeRate(136);
        toast.warning("Using approximate exchange rate");
      } finally {
        setLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, []);

  const handleBack = () => {
    setCurrentStep("amount");
  };

  const handleConfirm = async () => {
    if (!exchangeRate || !utilityData.amount || !utilityData.phoneNumber || !utilityData.network) {
      toast.error("Missing purchase information");
      return;
    }

    // Check sufficient balance
    const kesAmount = utilityData.amount;
    if (kesAmount > kesBalance) {
      toast.error(
        `Insufficient balance. You have KSh ${kesBalance.toLocaleString()}.`
      );
      return;
    }

    // Convert KES to USD and round to 6 decimal places (USDC precision)
    const usdAmount = Math.round((kesAmount / exchangeRate) * 1e6) / 1e6;

    // Check for duplicate transaction
    const lockError = checkAndSetTransactionLock(
      "airtime",
      usdAmount,
      utilityData.phoneNumber,
      "KES"
    );
    if (lockError) {
      toast.error(lockError);
      return;
    }

    setProcessing(true);
    setPollingStatus("Initiating purchase...");

    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("No authentication token found");
      }

      rift.setBearerToken(authToken);

      // Get service code
      const serviceCode = `SP-${utilityData.network}`;

      // Create utility order
      const result = await rift.offramp.createOrder({
        token: "USDC" as any,
        amount: usdAmount,
        currency: "KES" as any,
        chain: "base" as any,
        recipient: JSON.stringify({
          accountIdentifier: utilityData.phoneNumber,
          institution: utilityData.network,
        }),
        utilities: true,
        service_code: serviceCode,
        contact_number: utilityData.phoneNumber,
        shortcode: utilityData.network,
      } as any);

      const txCode = result.order.transactionCode;
      setTransactionCode(txCode);
      
      // Check initial order status
      const initialStatus = result.order.status;
      console.log("Initial order status:", initialStatus);

      // For utilities, "initiated" or "pending" means it will be settled
      if (initialStatus === "initiated" || initialStatus === "pending") {
        setProcessing(false);
        setPurchaseSuccess(true);
        setPollingStatus("Airtime purchase initiated! It will be settled shortly.");
        toast.success("✅ Airtime purchase initiated successfully!");

        // Reset after 3 seconds and navigate home
        setTimeout(() => {
          resetUtility();
          navigate("/app");
        }, 3000);
        return;
      }

      // If status is already completed (unlikely for utilities)
      if (initialStatus === "completed") {
        setProcessing(false);
        setPurchaseSuccess(true);
        setPollingStatus("Airtime sent successfully!");
        toast.success("✅ Airtime sent successfully!");

        setTimeout(() => {
          resetUtility();
          navigate("/app");
        }, 3000);
        return;
      }

      // If status is failed immediately
      if (initialStatus === "failed") {
        setProcessing(false);
        setPurchaseError("Airtime purchase failed. Please try again.");
        toast.error("Airtime purchase failed");
        return;
      }

      // Fallback: Poll status if needed (shouldn't reach here normally)
      setPollingStatus("Processing airtime purchase...");
      let attempts = 0;
      const maxAttempts = 10; // 30 seconds total

      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const status = await rift.offramp.pollOrderStatus({
            transactionCode: txCode,
            currency: "KES" as any,
          });

          console.log(`[Attempt ${attempts}] Status:`, status.status);

          if (status.status === "completed" || status.status === "initiated" || status.status === "pending") {
            clearInterval(pollInterval);
            setProcessing(false);
            setPurchaseSuccess(true);
            setPollingStatus("Airtime purchase initiated successfully!");
            toast.success("✅ Airtime purchase initiated!");

            setTimeout(() => {
              resetUtility();
              navigate("/app");
            }, 3000);
          } else if (status.status === "failed") {
            clearInterval(pollInterval);
            setProcessing(false);
            setPurchaseError("Airtime purchase failed. Please try again.");
            toast.error("Airtime purchase failed");
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setProcessing(false);
            setPurchaseSuccess(true);
            setPollingStatus("Airtime purchase submitted successfully!");
            toast.success("✅ Airtime purchase submitted!");
            
            setTimeout(() => {
              resetUtility();
              navigate("/app");
            }, 3000);
          }
        } catch (error) {
          console.error("Error polling status:", error);
        }
      }, 3000);
    } catch (error: any) {
      console.error("Error purchasing airtime:", error);
      setProcessing(false);

      // Handle specific errors
      if (error.error === "Insufficient float balance" || error.message?.includes("float")) {
        setPurchaseError(
          "Platform low on funds. Please try a smaller amount or try again later."
        );
        toast.error("Platform low on funds");
      } else if (error.message?.includes("timeout")) {
        setPurchaseError("Request timeout. Please try again.");
        toast.error("Request timeout");
      } else {
        setPurchaseError("Failed to purchase airtime. Please try again.");
        toast.error("Purchase failed");
      }
    }
  };

  // Success State
  if (purchaseSuccess) {
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

        <h2 className="text-2xl font-bold mb-2">Airtime Purchase Initiated!</h2>
        <p className="text-text-subtle text-center mb-4">
          KSh {utilityData.amount?.toLocaleString()} airtime will be sent to{" "}
          {utilityData.phoneNumber} shortly
        </p>

        <div className="bg-surface-subtle rounded-lg p-4 w-full max-w-sm">
          <div className="text-center">
            <p className="text-sm text-text-subtle">Network</p>
            <p className="text-xl font-bold">{utilityData.network}</p>
          </div>
        </div>

        <p className="text-sm text-text-subtle mt-6 text-center">
          Redirecting to home...
        </p>
      </motion.div>
    );
  }

  // Error State
  if (purchaseError) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col h-full p-4 items-center justify-center"
      >
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
          <FiX className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Purchase Failed</h2>
        <p className="text-text-subtle text-center mb-6">{purchaseError}</p>

        <ActionButton
          onClick={() => {
            resetUtility();
            navigate("/app");
          }}
          className="w-full max-w-sm"
        >
          Back to Home
        </ActionButton>
      </motion.div>
    );
  }

  // Confirmation State
  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col h-full p-4"
    >
      <div className="flex items-center justify-between mb-8">
        <button onClick={handleBack} className="p-2" disabled={processing}>
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Confirm Purchase</h1>
        <div className="w-5 h-5" /> {/* Placeholder */}
      </div>

      <div className="flex-1">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium mb-2">Review Details</h2>
          <p className="text-text-subtle">Please confirm your airtime purchase</p>
        </div>

        {/* Purchase Summary */}
        <div className="bg-surface-subtle rounded-lg p-6 mb-6 max-w-sm mx-auto">
          <div className="space-y-4">
            {/* Network */}
            <div className="flex justify-between items-center">
              <span className="text-text-subtle">Network</span>
              <span className="font-medium">{utilityData.network}</span>
            </div>

            {/* Phone Number */}
            <div className="flex justify-between items-center">
              <span className="text-text-subtle">Phone Number</span>
              <span className="font-medium">{utilityData.phoneNumber}</span>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center">
              <span className="text-text-subtle">Amount</span>
              <span className="font-bold text-lg">
                KSh {utilityData.amount?.toLocaleString()}
              </span>
            </div>

            {/* USDC Equivalent */}
            {exchangeRate && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-subtle">≈ USDC</span>
                <span className="text-text-subtle">
                  {((utilityData.amount || 0) / exchangeRate).toFixed(2)} USDC
                </span>
              </div>
            )}

            {/* Balance */}
            <div className="pt-4 border-t border-surface">
              <div className="flex justify-between items-center">
                <span className="text-text-subtle text-sm">Your Balance</span>
                <span className="text-sm font-medium">
                  KSh {kesBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {utilityData.amount && utilityData.amount > kesBalance && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 max-w-sm mx-auto">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ Insufficient balance. You need KSh {utilityData.amount.toLocaleString()}{" "}
              but only have KSh {kesBalance.toLocaleString()}.
            </p>
          </div>
        )}

        {/* Processing Status */}
        {processing && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 max-w-sm mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-blue-700 dark:text-blue-300">{pollingStatus}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-sm mx-auto">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            ℹ️ Airtime will be delivered to the number instantly upon confirmation.
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <ActionButton
          onClick={handleConfirm}
          disabled={
            loadingRate ||
            processing ||
            !!(utilityData.amount && utilityData.amount > kesBalance)
          }
          loading={processing || loadingRate}
          className="w-full"
        >
          {loadingRate
            ? "Loading..."
            : processing
            ? "Processing..."
            : utilityData.amount && utilityData.amount > kesBalance
            ? "Insufficient Balance"
            : "Confirm & Buy Airtime"}
        </ActionButton>
      </div>
    </motion.div>
  );
}

