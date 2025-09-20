import { PayProvider, usePay } from "./context";
import PaymentTypeSelector from "./components/PaymentTypeSelector";
import AmountInput from "./components/AmountInput";
import RecipientInput from "./components/RecipientInput";
import PaymentConfirmation from "./components/PaymentConfirmation";

function PayContainer() {
  const { currentStep } = usePay();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "type":
        return <PaymentTypeSelector />;
      case "amount":
        return <AmountInput />;
      case "recipient":
        return <RecipientInput />;
      case "confirmation":
        return <PaymentConfirmation />;
      default:
        return <PaymentTypeSelector />;
    }
  };

  return (
    <div className="w-full h-full">
      {renderCurrentStep()}
    </div>
  );
}

export default function Pay() {
  return (
    <PayProvider>
      <PayContainer />
    </PayProvider>
  );
}