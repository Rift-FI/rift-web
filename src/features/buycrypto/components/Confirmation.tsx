import { useEffect, useState } from "react";
import { toast } from "sonner";
import useOnRamp from "@/hooks/wallet/use-on-ramp";
import { useBuyCrypto } from "../context";
import useAnalaytics from "@/hooks/use-analytics";

export default function Confirmation() {
  const { state, switchCurrentStep } = useBuyCrypto();
  const [shouldPoll, setShouldPoll] = useState<boolean>(true);
  const currentStep = state?.watch("currentStep");
  const transactionId = state?.watch("checkoutRequestId");
  const { logEvent } = useAnalaytics();

  const { onRampStatusQuery } = useOnRamp({
    checkoutRequestId: transactionId,
    enableStatusPolling: shouldPoll,
  });

  useEffect(() => {
    const status = onRampStatusQuery?.data?.data?.status;

    if (status === "pending") {
      // wait for status failed/success
      switchCurrentStep("CONFIRM");
    }

    if (status === "success") {
      setShouldPoll(false);

      // Track successful crypto purchase (deposit)
      logEvent("DEPOSIT");

      toast.success("The transaction was completed successfully");
      switchCurrentStep("CRYPTO-AMOUNT");
    }

    if (status === "failed") {
      setShouldPoll(false);
      toast.error("Sorry, we couldn't process the transaction");
      switchCurrentStep("CRYPTO-AMOUNT");
    }
  }, [onRampStatusQuery?.data?.status, transactionId, currentStep]);

  return (
    <div className="z-50 flex flex-col items-center justify-center w-full h-full bg-secondary/500 p-4">
      <div className="h-30 w-full bg-secondary flex flex-col items-center justify-center border-1 border-border rounded-md shadow-xl px-3">
        <span className="font-medium text-center">Please Verify</span>
        <span className="text-center">
          We are waiting for you to confirm the transaction on your phone...
        </span>
      </div>
    </div>
  );
}
