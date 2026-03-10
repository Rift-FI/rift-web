import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import useOnRamp from "@/hooks/wallet/use-on-ramp";
import { useBuyCrypto } from "../context";
import useAnalytics from "@/hooks/use-analytics";

export default function Confirmation() {
  const { state, switchCurrentStep } = useBuyCrypto();
  const [shouldPoll, setShouldPoll] = useState<boolean>(true);
  const currentStep = state?.watch("currentStep");
  const transactionId = state?.watch("checkoutRequestId");
  const { logEvent, updatePersonProperties } = useAnalytics();
  const queryClient = useQueryClient();

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
      const transactionData: any = onRampStatusQuery?.data?.data;
      logEvent("ONRAMP_COMPLETED", {
        checkout_request_id: transactionId,
        amount: transactionData?.amount || null,
        currency: transactionData?.currency || null,
        payment_method: transactionData?.paymentMethod || null,
        status: "success",
      });
      
      // Also track as deposit
      logEvent("DEPOSIT", {
        source: "onramp",
        checkout_request_id: transactionId,
        amount: transactionData?.amount || null,
        currency: transactionData?.currency || null,
      });
      
      // Update person property
      updatePersonProperties({ has_deposited: true });

      // Refresh balance
      queryClient.invalidateQueries({ queryKey: ["base-usdc-balance"] });
      queryClient.invalidateQueries({ queryKey: ["sailr-balances"] });
      queryClient.invalidateQueries({ queryKey: ["chains-balances"] });

      toast.success("The transaction was completed successfully");
      switchCurrentStep("CRYPTO-AMOUNT");
    }

    if (status === "failed") {
      setShouldPoll(false);
      
      // Track failed onramp
      const transactionData: any = onRampStatusQuery?.data?.data;
      logEvent("ONRAMP_FAILED", {
        checkout_request_id: transactionId,
        amount: transactionData?.amount || null,
        currency: transactionData?.currency || null,
        payment_method: transactionData?.paymentMethod || null,
        status: "failed",
        error: transactionData?.error || "Unknown error",
      });
      
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
