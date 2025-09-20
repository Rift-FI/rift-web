import { motion } from "motion/react";
import { FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useWithdraw } from "../context";
import ActionButton from "@/components/ui/action-button";

export default function WithdrawSuccess() {
  const navigate = useNavigate();
  const { createdOrder, withdrawData, resetWithdraw } = useWithdraw();

  const handleGoHome = () => {
    resetWithdraw();
    navigate("/app");
  };

  const handleViewHistory = () => {
    resetWithdraw();
    navigate("/app/history");
  };

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
      
      <h2 className="text-2xl font-bold mb-2">Withdrawal Initiated!</h2>
      <p className="text-text-subtle text-center mb-6">
        Your withdrawal request has been submitted successfully.
      </p>
      
      <div className="bg-surface-subtle rounded-lg p-6 w-full max-w-sm mb-8">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-subtle">Amount</span>
            <span className="font-bold">KSh {(withdrawData.amount || 0).toLocaleString()}</span>
          </div>
          
          {createdOrder && (
            <>
              <div className="flex justify-between">
                <span className="text-text-subtle">Order ID</span>
                <span className="text-sm font-mono">{createdOrder.id.slice(0, 8)}...</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-text-subtle">Status</span>
                <span className="text-sm capitalize">{createdOrder.status}</span>
              </div>
              
              {createdOrder.transactionCode && (
                <div className="flex justify-between">
                  <span className="text-text-subtle">Transaction Code</span>
                  <span className="text-sm font-mono">{createdOrder.transactionCode}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-8 w-full max-w-sm">
        <p className="text-sm text-green-700 dark:text-green-300 text-center">
          ✅ You'll receive the funds in your M-Pesa account shortly. Check your phone for confirmation.
        </p>
      </div>
      
      <div className="w-full max-w-sm space-y-3">
        <ActionButton
          onClick={handleGoHome}
          className="w-full"
        >
          Go to Home
        </ActionButton>
        
        <ActionButton
          onClick={handleViewHistory}
          className="w-full bg-surface-subtle text-text-subtle"
        >
          View Transaction History
        </ActionButton>
      </div>
    </motion.div>
  );
}