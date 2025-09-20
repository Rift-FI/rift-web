import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useWithdraw } from "../context";
import useUser from "@/hooks/data/use-user";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import ActionButton from "@/components/ui/action-button";

export default function WithdrawAmountInput() {
  const navigate = useNavigate();
  const { updateWithdrawData, setCurrentStep } = useWithdraw();
  const { data: user } = useUser();
  const { data: balanceData, isLoading: balanceLoading } = useBaseUSDCBalance();
  const [kesAmount, setKesAmount] = useState("");

  // Check if user has payment account configured
  const hasPaymentAccount = !!(user?.paymentAccount || user?.payment_account);

  // Get KES balance directly from useBaseUSDCBalance (same as homepage)
  const kesBalance = balanceData?.kesAmount || 0;

  const handleAmountChange = (value: string) => {
    const numericValue = parseFloat(value);
    
    // Allow empty input or valid numbers
    if (value === "" || !isNaN(numericValue)) {
      // If there's a balance limit, don't allow typing beyond it
      if (kesBalance && numericValue > kesBalance) {
        toast.error(`Maximum withdrawal amount is KSh ${kesBalance.toLocaleString()}`);
        return;
      }
      setKesAmount(value);
    }
  };

  const handleNext = () => {
    const amount = parseFloat(kesAmount);
    
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (amount < 50) {
      toast.error("Minimum withdrawal amount is KSh 50");
      return;
    }
    
    // Check if user has sufficient KES balance
    if (kesBalance && amount > kesBalance) {
      toast.error(`Insufficient balance. You have KSh ${kesBalance.toLocaleString()} available.`);
      return;
    }
    
    updateWithdrawData({ amount });
    setCurrentStep("confirmation");
  };

  const handleSetupPaymentAccount = () => {
    navigate("/app/profile");
    toast.info("Please setup your withdrawal account in profile settings");
  };

  const isValidAmount = kesAmount && parseFloat(kesAmount) >= 50;

  if (!hasPaymentAccount) {
    return (
      <motion.div
        initial={{ x: -4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex flex-col h-full p-4 items-center justify-center"
      >
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
          <FiAlertCircle className="w-8 h-8 text-yellow-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-center">Setup Required</h2>
        <p className="text-text-subtle text-center mb-8 max-w-sm">
          You need to setup a withdrawal account before you can withdraw funds.
        </p>
        
        <div className="w-full max-w-sm space-y-3">
          <ActionButton
            onClick={handleSetupPaymentAccount}
            className="w-full"
          >
            Setup Withdrawal Account
          </ActionButton>
          
          <ActionButton
            onClick={() => navigate("/app")}
            className="w-full bg-surface-subtle text-text-subtle"
          >
            Go Back
          </ActionButton>
        </div>
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
        <button onClick={() => navigate("/app")} className="p-2">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Withdraw Funds</h1>
        <div className="w-5 h-5" /> {/* Placeholder for alignment */}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium mb-2">Enter Amount</h2>
        <p className="text-text-subtle">How much do you want to withdraw?</p>
      </div>

      {/* Balance Display */}
      {!balanceLoading && kesBalance > 0 && (
        <div className="bg-surface-subtle rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-text-subtle text-sm">Available Balance</p>
            <p className="text-xl font-bold">KSh {kesBalance.toLocaleString()}</p>
          </div>
        </div>
      )}

      {balanceLoading && (
        <div className="bg-surface-subtle rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-text-subtle text-sm">Available Balance</p>
            <p className="text-xl font-bold">Loading...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <span className="text-lg font-medium mr-2">KSh</span>
            <input
              type="number"
              value={kesAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="text-4xl font-bold bg-transparent border-none outline-none text-center w-full"
              autoFocus
              max={kesBalance || undefined}
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[50, 100, 500, 1000, 2000, 5000]
            .filter(amount => !kesBalance || amount <= kesBalance) // Only show amounts within balance
            .map((amount) => (
            <button
              key={amount}
              onClick={() => setKesAmount(amount.toString())}
              className="p-3 bg-surface-subtle rounded-lg hover:bg-surface transition-colors text-sm font-medium"
            >
              KSh {amount.toLocaleString()}
            </button>
          ))}
          
          {/* Add "Max" button if balance is available and not already in the list */}
          {kesBalance && kesBalance > 50 && ![50, 100, 500, 1000, 2000, 5000].includes(Math.floor(kesBalance)) && (
            <button
              onClick={() => setKesAmount(Math.floor(kesBalance).toString())}
              className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg hover:bg-accent-primary/20 transition-colors text-sm font-medium text-accent-primary"
            >
              Max: KSh {Math.floor(kesBalance).toLocaleString()}
            </button>
          )}
        </div>

        {/* Minimum Amount Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ℹ️ Minimum withdrawal amount is KSh 50
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <ActionButton
          onClick={handleNext}
          disabled={!isValidAmount}
          className="w-full"
        >
          Continue
        </ActionButton>
      </div>
    </motion.div>
  );
}