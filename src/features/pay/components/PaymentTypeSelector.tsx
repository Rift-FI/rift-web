import { motion } from "motion/react";
import { FiArrowLeft, FiSmartphone, FiCreditCard, FiShoppingBag } from "react-icons/fi";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";

export default function PaymentTypeSelector() {
  const navigate = useNavigate();
  const { updatePaymentData, setCurrentStep } = usePay();

  const handleTypeSelect = (type: "MOBILE" | "PAYBILL" | "BUY_GOODS") => {
    updatePaymentData({ type });
    setCurrentStep("amount");
  };

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
        <h1 className="text-xl font-semibold">Pay with Rift</h1>
        <div className="w-5 h-5" /> {/* Placeholder for alignment */}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium mb-2">Choose Payment Type</h2>
        <p className="text-text-subtle">Select how you want to pay</p>
      </div>

      <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
        {/* Send Money (Mobile) */}
        <ActionButton
          onClick={() => handleTypeSelect("MOBILE")}
          className="w-full h-16 flex items-center justify-start px-6 bg-surface-subtle hover:bg-surface transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
              <FiSmartphone className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Send Money</h3>
              <p className="text-sm text-text-subtle">Send to mobile number</p>
            </div>
          </div>
        </ActionButton>

        {/* Paybill */}
        <ActionButton
          onClick={() => handleTypeSelect("PAYBILL")}
          className="w-full h-16 flex items-center justify-start px-6 bg-surface-subtle hover:bg-surface transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Paybill</h3>
              <p className="text-sm text-text-subtle">Pay to business number</p>
            </div>
          </div>
        </ActionButton>

        {/* Buy Goods */}
        <ActionButton
          onClick={() => handleTypeSelect("BUY_GOODS")}
          className="w-full h-16 flex items-center justify-start px-6 bg-surface-subtle hover:bg-surface transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
              <FiShoppingBag className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Buy Goods</h3>
              <p className="text-sm text-text-subtle">Pay to till number</p>
            </div>
          </div>
        </ActionButton>
      </div>

      <div className="mt-auto text-center">
        <p className="text-sm text-text-subtle">
          Pay anywhere M-Pesa is accepted using your Rift balance
        </p>
      </div>
    </motion.div>
  );
}