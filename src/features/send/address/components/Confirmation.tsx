import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CgSpinner } from "react-icons/cg";
import {
  ChainName,
  TokenSymbol,
  TransactionRequest,
} from "@stratosphere-network/wallet";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useSendContext } from "../../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import useOTP from "@/hooks/data/use-otp";
import useEmailOTP from "@/hooks/data/use-email-otp";
import useSendTranaction from "@/hooks/wallet/use-send-transaction";
import useAnalaytics from "@/hooks/use-analytics";
import useToken from "@/hooks/data/use-token";
import useChain from "@/hooks/data/use-chain";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import ActionButton from "@/components/ui/action-button";
import { formatFloatNumber, shortenString } from "@/lib/utils";
import { Check, CircleX } from "lucide-react";

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
  const { logEvent } = useAnalaytics();
  const { userQuery, signInMutation } = useWalletAuth();
  const { requestOTPMutation, verifyOTPMutation } = useOTP();
  const { requestEmailOTPMutation, verifyEmailOTPMutation } = useEmailOTP();
  const { sendBaseTransactionMutation } = useSendTranaction();

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
  const RECEIVER_ADDRESS = state?.getValues("recipient");
  const AMOUNT = state?.getValues("amount");

  const OTP_IS_VALID = otp_form.watch("code")?.trim()?.length == 4;
  const PASSWORD_IS_VALID = password_form.formState.isValid;

  const { data: TOKEN_INFO } = useToken({ id: TOKEN, chain: CHAIN });
  const { data: CHAIN_INFO } = useChain({ id: CHAIN! });

  const on_verify_to_send = () => {
    const TX_ARGS: TransactionRequest = {
      token: TOKEN_INFO?.name as TokenSymbol,
      chain: CHAIN_INFO?.backend_id as ChainName,
      to: RECEIVER_ADDRESS!,
      value: AMOUNT!,
      type: "gasless",
    };

    if (AUTH_METHOD == "external-id-password") {
      signInMutation
        .mutateAsync({
          externalId: userQuery?.data?.externalId,
          password: PASSWORD,
        })
        .then(() => {
          toast.success("Password confirmed successfully");
          steps_form.setValue("currentstep", "processing");
          sendBaseTransactionMutation
            .mutateAsync(TX_ARGS)
            .then(() => {
              steps_form.setValue("currentstep", "success");
            })
            .catch(() => {
              steps_form.setValue("currentstep", "failed");
            });
        })
        .catch(() => {
          toast.error("Sorry, we couldn't verify it's you, please try again");
          password_form.reset();
        });
    } else if (AUTH_METHOD == "phone-otp") {
      verifyOTPMutation
        .mutateAsync({ otp: OTP })
        .then(() => {
          toast.success("OTP verified successfully");
          steps_form.setValue("currentstep", "processing");
          sendBaseTransactionMutation
            .mutateAsync(TX_ARGS)
            .then(() => {
              steps_form.setValue("currentstep", "success");
            })
            .catch(() => {
              steps_form.setValue("currentstep", "failed");
            });
        })
        .catch(() => {
          toast.error("Sorry, we couldn't verify it's you, please try again");
          onClose();
        });
    } else {
      verifyEmailOTPMutation
        .mutateAsync({ otp: OTP })
        .then(() => {
          toast.success("OTP verified successfully");
          steps_form.setValue("currentstep", "processing");
          sendBaseTransactionMutation
            .mutateAsync(TX_ARGS)
            .then(() => {
              steps_form.setValue("currentstep", "success");
            })
            .catch(() => {
              steps_form.setValue("currentstep", "failed");
            });
        })
        .catch(() => {
          toast.error("Sorry, we couldn't verify it's you, please try again");
          onClose();
        });
    }
  };

  const requires_send_otp = useCallback(() => {
    if (AUTH_METHOD == "email-otp") {
      requestEmailOTPMutation
        .mutateAsync()
        .then(() => {
          toast.success("We sent an OTP to your email address");
        })
        .catch(() => {
          toast.error("We could't send you an OTP, please try again later");
          logEvent("REQUEST_EMAIL_OTP_FAILED");
        });
    }

    if (AUTH_METHOD == "phone-otp") {
      requestOTPMutation
        .mutateAsync()
        .then(() => {
          toast.success("We sent an OTP to your phone number");
        })
        .catch(() => {
          toast.error("We could't send you an OTP, please try again later");
          logEvent("REQUEST_PHONE_OTP_FAILED");
        });
    }
  }, [AUTH_METHOD, isOpen]);

  useEffect(() => {
    if (isOpen) {
      requires_send_otp();
    }
  }, [AUTH_METHOD, isOpen]);

  return (
    <Drawer
      modal
      open={isOpen}
      onClose={() => {
        onClose();
        password_form.reset();
        otp_form.reset();
        steps_form.reset();
      }}
      onOpenChange={(open) => {
        if (open) {
          onOpen();
        } else {
          onClose();
        }
      }}
    >
      <DrawerContent className="min-h-fit h-[60vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Send Crypto</DrawerTitle>
          <DrawerDescription>
            Send crypto to an address or create a Sphere link
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto h-[60vh] p-4 mb-4">
          {CURRENT_SEND_STEP == "auth" ? (
            <motion.div
              key={CURRENT_SEND_STEP}
              initial={{ x: -6, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <p className="text-md font-semibold">Verify Transaction</p>
              <p className="text-sm">
                {AUTH_METHOD == "email-otp"
                  ? "We sent an OTP to your registered Email address"
                  : AUTH_METHOD == "phone-otp"
                  ? "We sent an OTP to your registered Email address"
                  : "Use your password to confirm the transaction"}
              </p>

              <div className="w-full mt-8">
                <p className="text-sm">
                  {AUTH_METHOD == "external-id-password"
                    ? "Enter your password"
                    : "Enter the OTP we sent you"}
                </p>

                {AUTH_METHOD == "external-id-password" ? (
                  <Controller
                    control={password_form.control}
                    name="password"
                    render={({ field }) => {
                      return (
                        <div className="w-full mt-2 rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border">
                          <input
                            {...field}
                            className="w-full flex bg-transparent border-none outline-none h-full text-md text-foreground placeholder:text-muted-foreground flex-1 font-bold"
                            placeholder="* * * * * *"
                            type="password"
                          />
                        </div>
                      );
                    }}
                  />
                ) : (
                  <Controller
                    control={otp_form.control}
                    name="code"
                    render={({ field }) => {
                      return (
                        <div className="w-full mt-2">
                          <InputOTP
                            value={field.value}
                            onChange={field.onChange}
                            maxLength={6}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      );
                    }}
                  />
                )}
              </div>

              <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
                <ActionButton
                  disabled={
                    AUTH_METHOD == "external-id-password"
                      ? !PASSWORD_IS_VALID || signInMutation.isPending
                      : !OTP_IS_VALID
                  }
                  loading={
                    signInMutation.isPending ||
                    verifyOTPMutation.isPending ||
                    verifyEmailOTPMutation.isPending
                  }
                  onClick={on_verify_to_send}
                  variant="secondary"
                  className="p-[0.625rem]"
                >
                  Confirm
                </ActionButton>
              </div>
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
                Sending
              </p>

              <p className="font-semibold text-sm text-center w-full">
                {formatFloatNumber(parseFloat(AMOUNT!))} {TOKEN_INFO?.name}
                <span className="text-muted-foreground mx-2">to</span>
                {shortenString(RECEIVER_ADDRESS ?? "")}
              </p>

              <p className="text-sm text-center w-full mt-3 font-semibold">
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
              <div className="flex flex-col px-6 py-6 rounded-full bg-success/10">
                <Check className="text-success w-10 h-10 " />
              </div>

              <p className="mt-6 font-semibold text-tint-success text-md text-center w-full">
                Sent
              </p>

              <p className="font-semibold text-sm text-center text-muted-foreground w-full">
                The transaction was completed successfully
              </p>

              <p
                onClick={() => {
                  onClose();
                  password_form.reset();
                  otp_form.reset();
                  steps_form.reset();
                }}
                className="font-semibold text-sm text-accent-primary cursor-pointer text-center w-full mt-6"
              >
                Ok, Close
              </p>
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

              <p className="mt-6 font-semibold text-danger text-md text-center w-full">
                Failed
              </p>

              <p className="text-sm text-text-subtle">
                We couldn't process the transaction
              </p>

              <p
                onClick={() => {
                  onClose();
                  password_form.reset();
                  otp_form.reset();
                  steps_form.reset();
                }}
                className="font-semibold text-sm text-accent-primary cursor-pointer text-center w-full mt-4"
              >
                Try a different amount
              </p>
            </motion.div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
