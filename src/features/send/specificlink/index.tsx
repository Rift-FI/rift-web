import { useCallback, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { SendCryptoProvider, useSendContext } from "../context";
import { useDisclosure } from "@/hooks/use-disclosure";
import ActionButton from "@/components/ui/action-button";
import SendToken from "../components/SendToken";
import SendAmount from "./components/SendAmount";
import Confirmation from "./components/Confirmation";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import UserSearch from "./components/UserSearch";

function SendSpecificLinkCtr() {
  const navigate = useNavigate();
  const { state, switchCurrentStep } = useSendContext();
  const { userQuery } = useWalletAuth();
  const confirmation_disclosure = useDisclosure();

  const SEND_STEP = state?.watch("active");
  const SEND_TOKEN = state?.watch("token");
  const SEND_TOKEN_CHAIN = state?.watch("chain");
  const RECIPIENT = state?.watch("recipient");
  const SEND_AMOUNT = state?.watch("amount");

  const AMOUNT_IS_VALID = useMemo(() => {
    const parsed = parseFloat(SEND_AMOUNT!);

    if (Number.isNaN(parsed)) return false;
    if (parsed == 0) return false;
    return true;
  }, [SEND_AMOUNT]);

  const onNext = () => {
    if (SEND_STEP == "select-token" && SEND_TOKEN && SEND_TOKEN_CHAIN) {
      switchCurrentStep("amount-input");
    }

    if (SEND_STEP == "user-search" && RECIPIENT) {
      switchCurrentStep("amount-input");
    }

    if (SEND_STEP == "amount-input" && AMOUNT_IS_VALID) {
      confirmation_disclosure.onOpen();
    }
  };

  const onClose = () => {
    navigate("/app");
  };

  const _initializeStateValues = useCallback(() => {
    state?.setValue("mode", "send-specific-link");
    state?.setValue("active", "user-search");

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
    <motion.div className="w-full h-full p-4">
      <div className="w-full fixed top-0 pt-2 bg-surface border-b-1 border-accent -mx-4 pb-2 px-3 z-20">
        <h2 className="text-center text-xl font-medium">Sphere Link</h2>
        <p className="text-center text-sm">
          Create a link that lets others collect crypto to your wallet
        </p>
      </div>

      <div className="mt-16 mb-8">
        {SEND_STEP == "select-token" ? (
          <SendToken />
        ) : SEND_STEP == "user-search" ? (
          <UserSearch />
        ) : (
          <SendAmount />
        )}
        <Confirmation {...confirmation_disclosure} />
      </div>

      <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={onClose}
          variant="ghost"
          className="p-[0.5rem] text-md font-medium border-0 bg-secondary hover:bg-surface-subtle transition-all"
        >
          Cancel
        </ActionButton>

        <ActionButton
          onClick={onNext}
          variant="secondary"
          className="p-[0.5rem] text-sm font-medium border-0"
        >
          {SEND_STEP == "select-token" ? "Next" : "Create Link"}
        </ActionButton>
      </div>
    </motion.div>
  );
}

export default function SendSpecificLink() {
  return (
    <SendCryptoProvider>
      <SendSpecificLinkCtr />
    </SendCryptoProvider>
  );
}
