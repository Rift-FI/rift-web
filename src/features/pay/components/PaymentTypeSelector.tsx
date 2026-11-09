import { motion } from "motion/react";
import {
  FiArrowLeft,
  FiSmartphone,
  FiCreditCard,
  FiShoppingBag,
  FiChevronRight,
} from "react-icons/fi";
import { RiBankLine } from "react-icons/ri";
import { usePay } from "../context";

type PayType = "MOBILE" | "PAYBILL" | "BUY_GOODS" | "BANK";

interface PayOption {
  type: PayType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const OPTIONS: PayOption[] = [
  {
    type: "MOBILE",
    icon: FiSmartphone,
    title: "Send Money",
    description: "To an M-Pesa or Airtel number",
  },
  {
    type: "PAYBILL",
    icon: FiCreditCard,
    title: "Paybill",
    description: "Pay to a business paybill number",
  },
  {
    type: "BUY_GOODS",
    icon: FiShoppingBag,
    title: "Buy Goods",
    description: "Pay to a till number",
  },
  {
    type: "BANK",
    icon: RiBankLine,
    title: "Bank Transfer",
    description: "Send to any Kenyan bank account",
  },
];

export default function PaymentTypeSelector() {
  const { setCurrentStep, updatePaymentData } = usePay();

  const handleTypeSelect = (type: PayType) => {
    updatePaymentData({ type });
    setCurrentStep("source");
  };

  const handleBack = () => setCurrentStep("country");

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full overflow-y-auto overscroll-contain p-4 pb-8 md:p-8"
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5 text-text-default" />
          </button>
          <h1
            className="text-[17px] md:text-[18px] font-semibold text-text-default tracking-[-0.015em] flex items-center gap-2"
            style={{ fontFamily: 'var(--app-font-display)' }}
          >
            Send to Kenya <span className="text-xl">🇰🇪</span>
          </h1>
          <div className="w-9 h-9" />
        </div>

        <div className="mb-6 md:mb-8 text-center md:text-left max-w-xl md:mx-0 mx-auto">
          <h2
            className="text-[24px] md:text-[32px] font-semibold text-text-default mb-2 leading-[1.1] tracking-[-0.02em]"
            style={{ fontFamily: 'var(--app-font-display)' }}
          >
            Choose payment type
          </h2>
          <p className="text-[14px] md:text-[15px] text-text-subtle/90">
            Select how you want to send money.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                onClick={() => handleTypeSelect(opt.type)}
                className="group w-full p-4 rounded-2xl border bg-white border-surface/80 hover:border-accent-primary/40 hover:shadow-md transition-all text-left cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center flex-shrink-0 group-hover:bg-accent-primary group-hover:text-white transition-colors">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px] text-text-default mb-0.5 truncate">
                      {opt.title}
                    </h3>
                    <p className="text-[12px] text-text-subtle/80 truncate">
                      {opt.description}
                    </p>
                  </div>
                  <FiChevronRight className="w-4 h-4 text-text-subtle/40 group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-6 text-center">
          <p className="text-[12px] text-text-subtle/70">
            Pay anywhere M-Pesa is accepted using your Rift balance.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
