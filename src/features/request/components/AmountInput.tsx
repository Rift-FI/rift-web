import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useRequest } from "../context";
import ActionButton from "@/components/ui/action-button";

export default function AmountInput() {
  const navigate = useNavigate();
  const { updateRequestData, setCurrentStep } = useRequest();
  const [kesAmount, setKesAmount] = useState("");

  const handleNext = () => {
    if (!kesAmount || parseFloat(kesAmount) <= 0) return;
    
    updateRequestData({
      amount: parseFloat(kesAmount),
    });
    setCurrentStep("description");
  };

  const isValidAmount = kesAmount && parseFloat(kesAmount) > 0;

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate("/app")}
          className="mr-4 p-2 rounded-full hover:bg-surface-subtle transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Request Payment</h1>
      </div>

      {/* Amount Input */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium mb-2">Enter Amount</h2>
          <p className="text-text-subtle">How much do you want to request?</p>
        </div>

        <div className="w-full max-w-sm">
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
            {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
              <button
                key={amount}
                onClick={() => setKesAmount(amount.toString())}
                className="py-2 px-3 text-sm bg-surface-subtle rounded-lg hover:bg-surface transition-colors"
              >
                {amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Next Button */}
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