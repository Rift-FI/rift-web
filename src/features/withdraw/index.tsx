import { WithdrawProvider, useWithdraw } from "./context";
import WithdrawSourceSelect from "./components/WithdrawSourceSelect";
import WithdrawAmountInput from "./components/WithdrawAmountInput";
import WithdrawConfirmation from "./components/WithdrawConfirmation";
import WithdrawSuccess from "./components/WithdrawSuccess";

function WithdrawContainer() {
  const { currentStep } = useWithdraw();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "source":
        return <WithdrawSourceSelect />;
      case "amount":
        return <WithdrawAmountInput />;
      case "confirmation":
        return <WithdrawConfirmation />;
      case "success":
        return <WithdrawSuccess />;
      default:
        return <WithdrawSourceSelect />;
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
