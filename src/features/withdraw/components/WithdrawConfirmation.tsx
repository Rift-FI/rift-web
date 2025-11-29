import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useWithdraw } from "../context";
import useUser from "@/hooks/data/use-user";
import useBaseUSDCBalance, { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCreateWithdrawalOrder from "@/hooks/data/use-create-withdrawal-order";
import ActionButton from "@/components/ui/action-button";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";

// Currency symbols map
const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

export default function WithdrawConfirmation() {
  const navigate = useNavigate();
  const { withdrawData, setCurrentStep, setCreatedOrder } = useWithdraw();
  const { data: user } = useUser();
  
  // Get withdrawal currency from withdraw data
  const withdrawCurrency = (withdrawData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[withdrawCurrency];
  
  const { data: balanceData, isLoading: balanceLoading } = useBaseUSDCBalance({
    currency: withdrawCurrency,
  });
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
    const localAmount = withdrawData.amount;
    // Round to 6 decimal places (USDC precision)
    const usdAmount = Math.round((localAmount / balanceData.exchangeRate) * 1e6) / 1e6;
    const availableLocalBalance = balanceData.localAmount || 0;

    if (localAmount > availableLocalBalance) {
      toast.error("Insufficient balance for this withdrawal");
      return;
    }

    // Get user's payment account
    const paymentAccount = user?.paymentAccount || user?.payment_account;
    if (!paymentAccount) {
      toast.error("No withdrawal account configured");
      return;
    }

    // Check for duplicate transaction
    const lockError = checkAndSetTransactionLock(
      "withdraw",
      usdAmount,
      paymentAccount,
      withdrawCurrency
    );
    if (lockError) {
      toast.error(lockError);
      return;
    }

    try {
      const withdrawalRequest = {
        token: "USDC" as const,
        amount: usdAmount, // Send USD amount to API
        currency: withdrawCurrency, // Send actual currency code (KES, ETB, NGN, etc.)
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
      return `${account.institution}${account.type ? ` (${account.type})` : ''}: ${account.accountIdentifier}${
        account.accountNumber ? ` - ${account.accountNumber}` : ""
      }${account.accountName ? ` - ${account.accountName}` : ""}`;
    } catch {
      return "Account configured";
    }
  };

  const localAmount = withdrawData.amount || 0;
  const usdAmount = balanceData?.exchangeRate
    ? Math.round((localAmount / balanceData.exchangeRate) * 1e6) / 1e6
    : 0;
  const availableLocalBalance = balanceData?.localAmount || 0;
  const availableUsdBalance = balanceData?.usdcAmount || 0;
  const hasInsufficientBalance = localAmount > availableLocalBalance;

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
        <p className="text-text-subtle">
          Please confirm your withdrawal details
        </p>
      </div>

      {/* Withdrawal Summary */}
      <div className="bg-surface-subtle rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {/* Amount */}
          <div className="flex justify-between items-center">
            <span className="text-text-subtle">Withdrawal Amount</span>
            <span className="font-bold text-lg">
              {currencySymbol} {localAmount.toLocaleString()}
            </span>
          </div>

          {/* Withdrawal Account */}
          <div className="flex justify-between items-start">
            <span className="text-text-subtle">Withdrawal Account</span>
            <div className="text-right">
              <div className="font-medium text-sm">
                {getPaymentAccountDisplay()}
              </div>
            </div>
          </div>

          {/* Available Balance */}
          {balanceData && (
            <div className="flex justify-between items-center pt-2 border-t border-surface">
              <span className="text-text-subtle text-sm">
                Available Balance
              </span>
              <span className="text-sm">
                {currencySymbol} {availableLocalBalance.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Insufficient Balance Warning */}
      {hasInsufficientBalance && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700 dark:text-red-300">
            ⚠️ Insufficient balance. You need {currencySymbol} {localAmount.toLocaleString()}{" "}
            but only have {currencySymbol} {availableLocalBalance.toLocaleString()} available.
          </p>
        </div>
      )}

      {/* Processing Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          ℹ️ Withdrawal will be processed to your configured withdrawal account ({withdrawCurrency}).
          Processing may take a few minutes.
        </p>
      </div>

      <div className="mt-auto">
        <ActionButton
          onClick={handleConfirmWithdrawal}
          disabled={balanceLoading || hasInsufficientBalance}
          loading={createOrderMutation.isPending || balanceLoading}
          className="w-full"
        >
          {balanceLoading
            ? "Loading..."
            : hasInsufficientBalance
            ? "Insufficient Balance"
            : "Confirm Withdrawal"}
        </ActionButton>
      </div>
    </motion.div>
  );
}
