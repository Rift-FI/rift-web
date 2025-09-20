import { WithdrawProvider, useWithdraw } from "./context";
import WithdrawAmountInput from "./components/WithdrawAmountInput";
import WithdrawConfirmation from "./components/WithdrawConfirmation";
import WithdrawSuccess from "./components/WithdrawSuccess";

function WithdrawContainer() {
  const { currentStep } = useWithdraw();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "amount":
        return <WithdrawAmountInput />;
      case "confirmation":
        return <WithdrawConfirmation />;
      case "success":
        return <WithdrawSuccess />;
      default:
        return <WithdrawAmountInput />;
    }
  };

  return (
    <div className="w-full h-full">
      {renderCurrentStep()}
    </div>
  );
}

export default function Withdraw() {
  return (
    <WithdrawProvider>
      <WithdrawContainer />
    </WithdrawProvider>
  );
}