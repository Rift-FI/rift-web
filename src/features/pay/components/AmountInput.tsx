import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";

export default function AmountInput() {
  const { paymentData, updatePaymentData, setCurrentStep } = usePay();
  const [kesAmount, setKesAmount] = useState("");

  const handleBack = () => {
    setCurrentStep("type");
  };

  const handleNext = () => {
    if (!kesAmount || parseFloat(kesAmount) <= 0) return;
    
    updatePaymentData({
      amount: parseFloat(kesAmount),
    });
    setCurrentStep("recipient");
  };

  const isValidAmount = kesAmount && parseFloat(kesAmount) > 0;

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
        <p className="text-text-subtle">How much do you want to pay?</p>
      </div>

      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <span className="text-lg font-medium mr-2">KSh</span>
            <input
              type="number"
              value={kesAmount}
              onChange={(e) => setKesAmount(e.target.value)}
              placeholder="0"
              className="text-4xl font-bold bg-transparent border-none outline-none text-center w-full"
              autoFocus
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[50, 100, 200, 500, 1000, 2000].map((amount) => (
            <button
              key={amount}
              onClick={() => setKesAmount(amount.toString())}
              className="p-3 bg-surface-subtle rounded-lg hover:bg-surface transition-colors text-sm font-medium"
            >
              KSh {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <ActionButton
          onClick={handleNext}
          disabled={!isValidAmount}
          className="w-full"
        >
          Next
        </ActionButton>
      </div>
    </motion.div>
  );
}