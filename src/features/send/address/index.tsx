import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { SendCryptoProvider, useSendContext } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { useDisclosure } from "@/hooks/use-disclosure";
import ActionButton from "@/components/ui/action-button";
import SendToken from "../components/SendToken";
import AddressAmount from "./components/AddressAmount";
import Confirmation from "./components/Confirmation";

function SendToAddressCtr() {
  const navigate = useNavigate();
  const { state, switchCurrentStep } = useSendContext();
  const { userQuery } = useWalletAuth();
  const confirmation_disclosure = useDisclosure();

  const CURRENT_STEP = state?.watch("active");
  const SELECTED_TOKEN = state?.watch("token");
  const SELECTED_TOKEN_CHAIN = state?.watch("chain");
  const ADDRESS = state?.watch("recipient");
  const AMOUNT = state?.watch("amount");

  const AMOUNT_IS_VALID = useMemo(() => {
    const parsed = parseFloat(AMOUNT!);
    if (Number.isNaN(parsed)) return false;
    if (parsed == 0) return false;
    return true;
  }, [AMOUNT]);

  const onCancel = () => {
    navigate("/app");
  };

  const onNext = () => {
    if (
      CURRENT_STEP == "select-token" &&
      SELECTED_TOKEN &&
      SELECTED_TOKEN_CHAIN
    ) {
      switchCurrentStep("address-search");
    }

    if (CURRENT_STEP == "address-search" && ADDRESS && AMOUNT_IS_VALID) {
      confirmation_disclosure.onOpen();
    }
  };

  const _initializeStateValues = useCallback(() => {
    state?.setValue("mode", "send-to-address");

    if (userQuery?.data?.externalId) {
      state?.setValue("authMethod", "external-id-password");
    }
    if (userQuery?.data?.phoneNumber) {
      state?.setValue("authMethod", "phone-otp");
    }
    if (userQuery?.data?.email) {
      state?.setValue("authMethod", "email-otp");
    }
  }, [userQuery?.data]);

  useEffect(() => {
    _initializeStateValues();
  }, [userQuery?.data]);

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4"
    >
      <div className="w-full fixed top-0 pt-2 bg-surface border-b-1 border-accent -mx-4 pb-2 px-2 z-10">
        <h2 className="text-center text-xl font-medium">Send</h2>
        <p className="text-center text-sm">Send to another wallet address</p>
      </div>

      <div className="mt-15">
        {CURRENT_STEP == "select-token" ? <SendToken /> : <AddressAmount />}
        <Confirmation {...confirmation_disclosure} />
      </div>

      <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={onCancel}
          variant="ghost"
          className="p-[0.5rem] font-medium border-0 bg-secondary hover:bg-surface-subtle transition-all"
        >
          Cancel
        </ActionButton>

        <ActionButton
          onClick={onNext}
          variant="secondary"
          className="p-[0.5rem] font-medium border-0"
        >
          {CURRENT_STEP == "select-token" ? "Next" : "Confirm"}
        </ActionButton>
      </div>
    </motion.div>
  );
}

export default function SendToAddress() {
  return (
    <SendCryptoProvider>
      <SendToAddressCtr />
    </SendCryptoProvider>
  );
}
