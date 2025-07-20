import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
  MpesaSTKInitiateRequest,
  MpesaSTKInitiateResponse,
} from "@stratosphere-network/wallet";
import { useBuyCrypto, buyTokens } from "../context";
import useOnRamp from "@/hooks/wallet/use-on-ramp";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import ActionButton from "@/components/ui/action-button";

export default function StepsPicker() {
  const navigate = useNavigate();
  const { state, switchCurrentStep } = useBuyCrypto();
  const { userQuery } = useWalletAuth();
  const { data: USER_INFO } = userQuery;

  const formaValues = state?.getValues();
  const cryptoAmount = Number(formaValues?.cryptoAmount);
  const kesAmount = Number(state?.watch("kesAmount"));
  const mpesaNumber = formaValues?.mpesaNumber as string;
  const purchaseToken = formaValues?.purchaseToken as string as buyTokens;
  const currentStep = state?.watch("currentStep");

  const { onRampMutation } = useOnRamp({
    onSuccess: (ONRAMP_RES: MpesaSTKInitiateResponse) => {
      switchCurrentStep("CONFIRM");
      state?.setValue("checkoutRequestId", ONRAMP_RES?.data?.checkoutRequestID);
    },
    onError: () => {
      toast.error("Sorry, we coulndn't process the transaction");
    },
  });

  const address = localStorage.getItem("address");
  const tx_args: MpesaSTKInitiateRequest = {
    amount: kesAmount,
    cryptoAsset: purchaseToken,
    cryptoWalletAddress: String(address),
    externalReference: USER_INFO?.externalId as string,
    phone: mpesaNumber,
  };

  const onCancel = () => {
    navigate("/app");
  };

  const onNextStep = () => {
    if (currentStep == "CHOOSE-TOKEN") {
      switchCurrentStep("CRYPTO-AMOUNT");
    }

    if (currentStep == "CRYPTO-AMOUNT" && cryptoAmount !== 0) {
      switchCurrentStep("PHONE");
    }

    if (currentStep == "PHONE" && mpesaNumber !== "" && cryptoAmount !== 0) {
      toast.success("Please confirm the transaction on your phone");
      onRampMutation.mutate(tx_args);
    }
  };

  return (
    <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
      <ActionButton
        onClick={onCancel}
        variant="ghost"
        className="font-medium border-0 bg-secondary hover:bg-surface-subtle transition-all"
      >
        Cancel
      </ActionButton>

      <ActionButton
        variant="secondary"
        onClick={onNextStep}
        disabled={
          (currentStep == "CRYPTO-AMOUNT" && cryptoAmount == 0) ||
          isNaN(cryptoAmount) ||
          (currentStep == "PHONE" && mpesaNumber == "")
        }
        className="font-medium border-0"
      >
        {currentStep == "CHOOSE-TOKEN" || currentStep == "CRYPTO-AMOUNT"
          ? "Next"
          : "Buy"}
      </ActionButton>
    </div>
  );
}
