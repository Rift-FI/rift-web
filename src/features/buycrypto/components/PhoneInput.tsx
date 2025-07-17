import { motion } from "motion/react";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { useBuyCrypto } from "../context";

export default function PhoneInput() {
  const { state, switchCurrentStep } = useBuyCrypto();

  const mpesaNumber = state?.watch("mpesaNumber");

  const goBack = () => {
    switchCurrentStep("CRYPTO-AMOUNT");
  };

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full mb-10"
    >
      <button
        onClick={goBack}
        className="w-8 h-8 flex flex-row items-center justify-center mb-2 rounded-full bg-secondary cursor-pointer"
      >
        <MdKeyboardArrowLeft className="text-2xl text-text-default" />
      </button>

      <p className="text-center font-semibold flex flex-col mt-8">
        Phone Number
        <span className="font-light text-sm">
          Enter your M-pesa phone number
        </span>
      </p>

      <div className="w-full flex flex-row items-center rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-2">
        <input
          type="text"
          inputMode="tel"
          placeholder="0700-000-000"
          value={mpesaNumber}
          className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1 font-semibold"
          onChange={(e) => state?.setValue("mpesaNumber", e.target.value)}
        />
      </div>
    </motion.div>
  );
}
