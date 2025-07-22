import { useCallback } from "react";
import { motion } from "motion/react";
import { BuyCryptoProvider, useBuyCrypto } from "./context";
import StepsPicker from "./components/StepsPicker";
import CryptoAmount from "./components/CryptoAmount";
import PhoneInput from "./components/PhoneInput";
import Confirmation from "./components/Confirmation";
import CryptoPicker from "./components/TokenPicker";

function BuyCryptoContainer() {
  const { currentStep } = useBuyCrypto();

  const renderCurrentStep = useCallback(() => {
    switch (currentStep) {
      case "CHOOSE-TOKEN": {
        return <CryptoPicker />;
      }
      case "CRYPTO-AMOUNT": {
        return <CryptoAmount />;
      }
      case "PHONE": {
        return <PhoneInput />;
      }
      case "CONFIRM": {
        return <Confirmation />;
      }
      default: {
        return <div></div>;
      }
    }
  }, [currentStep]);

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4"
    >
      {renderCurrentStep()}
      <StepsPicker />
    </motion.div>
  );
}

export default function BuyCrypto() {
  return (
    <BuyCryptoProvider>
      <BuyCryptoContainer />
    </BuyCryptoProvider>
  );
}
