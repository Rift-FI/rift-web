import { RequestProvider, useRequest } from "./context";
import AmountInput from "./components/AmountInput";
import DescriptionInput from "./components/DescriptionInput";
import SharingOptions from "./components/SharingOptions";

function RequestContainer() {
  const { currentStep } = useRequest();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "amount":
        return <AmountInput />;
      case "description":
        return <DescriptionInput />;
      case "sharing":
        return <SharingOptions />;
      default:
        return <AmountInput />;
    }
  };

  return (
    <div className="w-full h-full">
      {renderCurrentStep()}
    </div>
  );
}

export default function Request() {
  return (
    <RequestProvider>
      <RequestContainer />
    </RequestProvider>
  );
}