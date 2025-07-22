import { useMemo } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { PaymentRequestProvider, usePaymentRequest } from "./context";
import ActionButton from "@/components/ui/action-button";
import RequestToken from "./components/RequestToken";
import RequestAmount from "./components/RequestAmount";
import SendRequestLink from "./components/SendRequestLink";

function ReceiveFromLinkCtr() {
  const navigate = useNavigate();
  const { requestStep, state, switchPaymentRequestStep } = usePaymentRequest();

  const REQUEST_TOKEN = state?.watch("requestToken");
  const REQUEST_TOKEN_CHAIN = state?.watch("requestTokenChain");
  const REQUEST_AMOUNT = state?.watch("requestAmount");

  const AMOUNT_IS_VALID = useMemo(() => {
    const parsed = parseFloat(REQUEST_AMOUNT!);

    if (Number.isNaN(parsed)) return false;
    if (parsed == 0) return false;
    return true;
  }, [REQUEST_AMOUNT]);

  const onNext = () => {
    if (REQUEST_TOKEN && REQUEST_TOKEN_CHAIN) {
      switchPaymentRequestStep("amount-input");
    }
  };

  const onNextDisabled = () => {
    if (requestStep == "token-select" && !REQUEST_TOKEN && !REQUEST_TOKEN_CHAIN)
      return true;
    if (
      (requestStep == "amount-input" && !REQUEST_AMOUNT && AMOUNT_IS_VALID) ||
      Number(REQUEST_AMOUNT) == 0
    )
      return true;
    return false;
  };

  const onClose = () => {
    navigate("/app");
  };

  return (
    <motion.div className="w-full h-full p-4">
      <div className="w-full fixed top-0 pt-2 bg-surface border-b-1 border-accent -mx-4 pb-2 px-3 z-10">
        <h2 className="text-center text-xl font-medium">Sphere Link</h2>
        <p className="text-center text-sm">
          Create a link that lets others send crypto to your wallet
        </p>
      </div>

      <div className="mt-15 mb-8">
        {requestStep == "token-select" ? <RequestToken /> : <RequestAmount />}
      </div>

      <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={onClose}
          variant="ghost"
          className="p-[0.5rem] text-md font-medium border-0 bg-secondary hover:bg-surface-subtle transition-all"
        >
          Cancel
        </ActionButton>

        {requestStep == "amount-input" &&
        REQUEST_TOKEN &&
        REQUEST_TOKEN_CHAIN &&
        AMOUNT_IS_VALID ? (
          <SendRequestLink
            renderSendReqLink={() => (
              <ActionButton
                onClick={onNext}
                disabled={onNextDisabled()}
                variant="secondary"
                className="p-[0.5rem] text-sm font-medium border-0"
              >
                Create Link
              </ActionButton>
            )}
          />
        ) : (
          <ActionButton
            onClick={onNext}
            disabled={onNextDisabled()}
            variant="secondary"
            className="p-[0.5rem] text-sm font-medium border-0"
          >
            {requestStep == "token-select" ? "Next" : "Create Link"}
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

export default function ReceiveFromLink() {
  return (
    <PaymentRequestProvider>
      <ReceiveFromLinkCtr />
    </PaymentRequestProvider>
  );
}
