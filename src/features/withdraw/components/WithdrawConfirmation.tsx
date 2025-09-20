import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useWithdraw } from "../context";
import useUser from "@/hooks/data/use-user";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import useCreateWithdrawalOrder from "@/hooks/data/use-create-withdrawal-order";
import ActionButton from "@/components/ui/action-button";

export default function WithdrawConfirmation() {
  const navigate = useNavigate();
  const { withdrawData, setCurrentStep, setCreatedOrder } = useWithdraw();
  const { data: user } = useUser();
  const { data: balanceData, isLoading: balanceLoading } = useBaseUSDCBalance();
  const createOrderMutation = useCreateWithdrawalOrder();

  const handleBack = () => {
    setCurrentStep("amount");
  };

  const handleConfirmWithdrawal = async () => {
    if (!balanceData?.exchangeRate || !withdrawData.amount) {
      toast.error("Missing withdrawal information");
      return;
    }

    // Check if user has sufficient balance
    const kesAmount = withdrawData.amount;
    const usdAmount = kesAmount / balanceData.exchangeRate;
    const availableKesBalance = balanceData.kesAmount || 0;
    
    if (kesAmount > availableKesBalance) {
      toast.error("Insufficient balance for this withdrawal");
      return;
    }

    try {
      // Get user's payment account
      const paymentAccount = user?.paymentAccount || user?.payment_account;
      if (!paymentAccount) {
        toast.error("No withdrawal account configured");
        return;
      }

      const withdrawalRequest = {
        token: "USDC" as const,
        amount: usdAmount, // Send USD amount to API
        currency: "KES" as const,
        chain: "base" as const,
        recipient: paymentAccount, // Use user's configured payment account
      };

      console.log("Creating withdrawal order:", withdrawalRequest);
      const response = await createOrderMutation.mutateAsync(withdrawalRequest);
      
      console.log("Withdrawal order response:", response);
      setCreatedOrder(response.order);
      setCurrentStep("success");
      toast.success("Withdrawal order created successfully!");
      
    } catch (error) {
      console.error("Error creating withdrawal order:", error);
      toast.error("Failed to create withdrawal order. Please try again.");
    }
  };

  // Parse payment account for display
  const getPaymentAccountDisplay = () => {
    const paymentAccount = user?.paymentAccount || user?.payment_account;
    if (!paymentAccount) return "Not configured";
    
    try {
      const account = JSON.parse(paymentAccount);
      return `${account.type}: ${account.accountIdentifier}${account.accountNumber ? ` - ${account.accountNumber}` : ''}${account.accountName ? ` (${account.accountName})` : ''}`;
    } catch {
      return "Account configured";
    }
  };

  const kesAmount = withdrawData.amount || 0;
  const usdAmount = balanceData?.exchangeRate ? kesAmount / balanceData.exchangeRate : 0;
  const availableKesBalance = balanceData?.kesAmount || 0;
  const availableUsdBalance = balanceData?.usdcAmount || 0;
  const hasInsufficientBalance = kesAmount > availableKesBalance;

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
        <h1 className="text-xl font-semibold">Confirm Withdrawal</h1>
        <div className="w-5 h-5" /> {/* Placeholder for alignment */}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium mb-2">Review Details</h2>
        <p className="text-text-subtle">Please confirm your withdrawal details</p>
      </div>

      {/* Withdrawal Summary */}
      <div className="bg-surface-subtle rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {/* Amount */}
          <div className="flex justify-between items-center">
            <span className="text-text-subtle">Withdrawal Amount</span>
            <span className="font-bold text-lg">KSh {kesAmount.toLocaleString()}</span>
          </div>


          {/* Withdrawal Account */}
          <div className="flex justify-between items-start">
            <span className="text-text-subtle">Withdrawal Account</span>
            <div className="text-right">
              <div className="font-medium text-sm">{getPaymentAccountDisplay()}</div>
              <div className="text-xs text-text-subtle">via Safaricom</div>
            </div>
          </div>

          {/* Available Balance */}
          {balanceData && (
            <div className="flex justify-between items-center pt-2 border-t border-surface">
              <span className="text-text-subtle text-sm">Available Balance</span>
              <span className="text-sm">KSh {availableKesBalance.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Insufficient Balance Warning */}
      {hasInsufficientBalance && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700 dark:text-red-300">
            ⚠️ Insufficient balance. You need KSh {kesAmount.toLocaleString()} but only have KSh {availableKesBalance.toLocaleString()} available.
          </p>
        </div>
      )}

      {/* Processing Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          ℹ️ Withdrawal will be processed to your configured M-Pesa account. Processing may take a few minutes.
        </p>
      </div>

      <div className="mt-auto">
        <ActionButton
          onClick={handleConfirmWithdrawal}
          disabled={balanceLoading || hasInsufficientBalance}
          loading={createOrderMutation.isPending || balanceLoading}
          className="w-full"
        >
          {balanceLoading ? "Loading..." : hasInsufficientBalance ? "Insufficient Balance" : "Confirm Withdrawal"}
        </ActionButton>
      </div>
    </motion.div>
  );
}