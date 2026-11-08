import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CgSpinner } from "react-icons/cg";
import { useDisclosure } from "@/hooks/use-disclosure";
import { CircleX } from "lucide-react";
import { useSendContext } from "../../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import useAnalytics from "@/hooks/use-analytics";
import useToken from "@/hooks/data/use-token";
import useChain from "@/hooks/data/use-chain";
import { markAccountDeployed } from "@/hooks/wallet/use-account-deployed";
import usePaymentLinks, {
  CreatePaymentLinkArgs,
} from "@/hooks/data/use-payment-link";
import ActionButton from "@/components/ui/action-button";
import SendCollectLink from "./SendCollectLink";
import { shortenString } from "@/lib/utils";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";

const otpSchema = z.object({
  code: z.string().length(4),
});

const passwordSchema = z.object({
  password: z.string().min(4, "Password is required"),
});

const stepsSchema = z.object({
  currentstep: z.enum(["auth", "processing", "success", "failed"]),
});

type OTP_SCHEMA_TYPE = z.infer<typeof otpSchema>;
type PASSWORD_SCHEMA_TYPE = z.infer<typeof passwordSchema>;
type STEPS_SCHEMA_TYPE = z.infer<typeof stepsSchema>;

export default function Confirmation(
  props: {} & ReturnType<typeof useDisclosure>
) {
  const { isOpen, onOpen, onClose } = props;
  const { state } = useSendContext();
  const { logEvent } = useAnalytics();
  const { userQuery } = useWalletAuth();
  const { createPaymentLinkMutation } = usePaymentLinks();

  const AUTH_METHOD = state?.getValues("authMethod");

  const steps_form = useForm<STEPS_SCHEMA_TYPE>({
    resolver: zodResolver(stepsSchema),
    defaultValues: {
      currentstep: "auth",
    },
  });

  const otp_form = useForm<OTP_SCHEMA_TYPE>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
    },
  });

  const password_form = useForm<PASSWORD_SCHEMA_TYPE>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  const CURRENT_SEND_STEP = steps_form.watch("currentstep");
  const OTP = otp_form.watch("code");
  const PASSWORD = password_form.watch("password");
  const TOKEN = state?.getValues("token");
  const CHAIN = state?.getValues("chain");
  const RECEIPIENT = state?.getValues("recipient");
  const AMOUNT = state?.getValues("amount");
  const RECIPIENT_CONTACT_METHOD = state?.getValues("contactmethod");
  const DURATION = state?.getValues("linkduration");

  const OTP_IS_VALID = otp_form.watch("code")?.trim()?.length == 4;
  const PASSWORD_IS_VALID = password_form.formState.isValid;

  const { data: TOKEN_INFO } = useToken({ id: TOKEN, chain: CHAIN });
  const { data: CHAIN_INFO } = useChain({ id: CHAIN! });

  const on_create_link = () => {
    // Check for duplicate transaction
    const lockError = checkAndSetTransactionLock(
      "send",
      parseFloat(AMOUNT || "0"),
      RECEIPIENT || "",
      TOKEN_INFO?.name || "USDC"
    );
    if (lockError) {
      toast.error(lockError);
      return;
    }

    let TX_ARGS: CreatePaymentLinkArgs = {
      chain: CHAIN_INFO?.backend_id!,
      token: TOKEN_INFO?.name!,
      amount: AMOUNT!,
      duration: DURATION || "30m",
      type: "specific",
      recipient: RECEIPIENT!,
    };

    if (RECIPIENT_CONTACT_METHOD == "email") {
      TX_ARGS.recipientEmail = RECEIPIENT;
    }
    if (RECIPIENT_CONTACT_METHOD == "externalId") {
      TX_ARGS.recipientExternalId = RECEIPIENT;
    }
    if (RECIPIENT_CONTACT_METHOD == "telegram-username") {
      TX_ARGS.recipientPhoneNumber = RECEIPIENT;
    }
    if (AUTH_METHOD == "email-otp") {
      TX_ARGS.email = userQuery?.data?.email;
      TX_ARGS.otpCode = OTP;
    }
    if (AUTH_METHOD == "phone-otp") {
      TX_ARGS.phoneNumber = userQuery?.data?.phoneNumber;
      TX_ARGS.otpCode = OTP;
    }
    if (AUTH_METHOD == "external-id-password") {
      TX_ARGS.externalId = userQuery?.data?.externalId;
      TX_ARGS.password = PASSWORD;
    }

    steps_form.setValue("currentstep", "processing");
    createPaymentLinkMutation
      .mutateAsync(TX_ARGS)
      .then(() => {
        logEvent("SEND_COMPLETED", { method: "specific_link" });
        markAccountDeployed(CHAIN);
        steps_form.setValue("currentstep", "success");
      })
      .catch(() => {
        logEvent("SEND_FAILED", { method: "specific_link" });
        steps_form.setValue("currentstep", "failed");
      });
  };

  // Guard against the useEffect double-firing on unrelated
  // re-renders. Without this the create-link mutation fires twice back
  // to back and the second call trips the "similar transaction" lock.
  // Same pattern as the address send Confirmation drawer.
  const triggeredThisSessionRef = useRef(false);
  useEffect(() => {
    if (!isOpen) triggeredThisSessionRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (triggeredThisSessionRef.current) return;
    triggeredThisSessionRef.current = true;
    on_create_link();
  }, [AUTH_METHOD, isOpen]);

  const handleCloseAll = () => {
    onClose();
    password_form.reset();
    otp_form.reset();
    steps_form.reset();
  };

  const bodyContent = (
    <div className="overflow-y-auto h-[60vh] p-4 mb-4">
      {CURRENT_SEND_STEP == "auth" ? (
            <motion.div
              key={CURRENT_SEND_STEP}
              initial={{ x: -6, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <CgSpinner className="text-accent-primary w-8 h-8 animate-spin" />
              <p className="mt-3 text-sm text-muted-foreground">Creating your link…</p>
            </motion.div>
          ) : CURRENT_SEND_STEP == "processing" ? (
            <motion.div
              key={CURRENT_SEND_STEP}
              initial={{ x: 6, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <div className="flex items-center justify-center p-6 rounded-full bg-accent-primary/5">
                <CgSpinner className="text-accent-primary w-10 h-10 animate-spin" />
              </div>

              <p className="text-white text-sm text-center mt-6 w-full ">
                Creating
              </p>

              <p className="font-medium text-sm text-center w-full">
                Creating {TOKEN_INFO?.name} link for{" "}
                {shortenString(RECEIPIENT!)}
              </p>

              <p className="text-sm text-center w-full mt-3 font-medium">
                Please wait
              </p>
            </motion.div>
          ) : CURRENT_SEND_STEP == "success" ? (
            <motion.div
              key={CURRENT_SEND_STEP}
              initial={{ x: 6, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <SendCollectLink
                link={createPaymentLinkMutation?.data?.link ?? ""}
              />

              <div className="sticky bottom-0 -mx-4 md:-mx-6 -mb-4 mt-8 px-4 md:px-6 pt-3 pb-4 border-t border-border bg-app-background">
                <ActionButton
                  onClick={() => {
                    onClose();
                    password_form.reset();
                    otp_form.reset();
                    steps_form.reset();
                  }}
                  variant="ghost"
                  className="p-[0.5rem] text-md font-medium border-0 bg-secondary hover:bg-surface-subtle transition-all"
                >
                  Close
                </ActionButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={CURRENT_SEND_STEP}
              initial={{ x: 6, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <div className="flex flex-col px-6 py-6 rounded-full bg-danger/10">
                <CircleX className="text-danger w-10 h-10" />
              </div>

              <p className="mt-6 font-medium text-danger text-md text-center w-full">
                Failed
              </p>

              <p className="text-sm text-text-subtle">
                We couldn't create the link for you
              </p>

              <p
                onClick={handleCloseAll}
                className="font-medium text-sm text-accent-primary cursor-pointer text-center w-full mt-4"
              >
                Try again
              </p>
            </motion.div>
          )}
    </div>
  );

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-end md:items-center justify-center pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[#0F2A38]/55 backdrop-blur-[2px]"
        onClick={handleCloseAll}
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full min-h-fit h-[60vh] md:w-[560px] md:max-w-[560px] bg-app-background rounded-t-3xl md:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {bodyContent}
      </motion.div>
    </div>
  );
}
