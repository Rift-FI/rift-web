import { toast } from "sonner";
import {
  MpesaSTKInitiateRequest,
  MpesaSTKInitiateResponse,
} from "@stratosphere-network/wallet";
import { useBuyCrypto, buyTokens } from "../context";
import useOnRamp from "@/hooks/wallet/use-on-ramp";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { Button } from "@/components/ui/button";

export default function StepsPicker() {
  const { state, switchCurrentStep, closeAndReset } = useBuyCrypto();
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
    closeAndReset();
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
    <div className="absolute bottom-0 left-0 right-0 bg-app-background flex flex-row flex-nowrap items-center justify-between gap-2 px-4 py-2">
      <Button
        variant="ghost"
        onClick={onCancel}
        className="bg-secondary w-1/2 capitalize cursor-pointer p-5 rounded-xl text-md font-bold"
      >
        Cancel
      </Button>
      <Button
        variant="secondary"
        onClick={onNextStep}
        disabled={
          (currentStep == "CRYPTO-AMOUNT" && cryptoAmount == 0) ||
          isNaN(cryptoAmount) ||
          (currentStep == "PHONE" && mpesaNumber == "")
        }
        className="bg-accent-secondary w-1/2 capitalize cursor-pointer p-5 rounded-xl text-md font-bold"
      >
        {currentStep == "CHOOSE-TOKEN" || currentStep == "CRYPTO-AMOUNT"
          ? "Next"
          : "Buy"}
      </Button>
    </div>
  );
}
