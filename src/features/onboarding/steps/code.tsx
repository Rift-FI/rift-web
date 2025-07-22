import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useFlow } from "../context";
import { CgSpinner } from "react-icons/cg";
import { toast } from "sonner";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { usePlatformDetection } from "@/utils/platform";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import ActionButton from "@/components/ui/action-button";

const codeSchema = z.object({
  code: z.string().max(4),
});

type CODE_SCHEMA = z.infer<typeof codeSchema>;

interface Props {
  flow?: "onboarding" | "login";
}

export default function Code(props: Props) {
  const { flow: flowType } = props;
  const navigate = useNavigate();
  const flow = useFlow();
  const { isTelegram, telegramUser } = usePlatformDetection();
  const { sendOTPMutation } = useWalletAuth();
  const stored = flow.stateControl.getValues();

  const form = useForm<CODE_SCHEMA>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: stored?.code ?? "",
    },
  });

  const CODE = form.watch("code");
  const ENABLED = CODE.length == 4;

  const handleSubmit = async (values: CODE_SCHEMA) => {
    const stored = flow.stateControl.getValues();
    const authMethod = stored.authMethod;
    flow.stateControl.setValue("code", values.code);

    if (values.code) {
      if (!flow.signInMutation || !flow.signUpMutation) {
        return;
      }

      if (flowType == "login") {
        try {
          const loginParams =
            authMethod === "email"
              ? {
                  otpCode: values.code,
                  email: stored.email!,
                }
              : {
                  otpCode: values.code,
                  phoneNumber: stored.identifier!?.replace("-", ""),
                };

          await flow.signInMutation.mutateAsync(loginParams);
          navigate("/app");
        } catch (e) {
          console.log("Something went wrong::", e);
          toast.custom(() => <RenderErrorToast />, {
            duration: 2000,
            position: "top-center",
          });
        }

        return;
      }

      try {
        if (isTelegram && !telegramUser?.id) {
          throw new Error("No telegram user id found");
        }

        try {
          const signupParams =
            authMethod === "email"
              ? { email: stored.email! }
              : { phoneNumber: stored.identifier!?.replace("-", "") };

          await flow.signUpMutation.mutateAsync(signupParams);
        } catch (signupError: any) {
          const is409Error =
            signupError?.status === 409 ||
            signupError?.response?.status === 409 ||
            signupError?.message?.includes("409") ||
            signupError?.message?.toLowerCase()?.includes("already exists");

          if (is409Error) {
            console.log("User already exists, proceeding with login");
            flow.signUpMutation.reset();
          } else {
            throw signupError;
          }
        }

        const loginParams =
          authMethod === "email"
            ? {
                otpCode: values.code,
                email: stored.email!,
              }
            : {
                otpCode: values.code,
                phoneNumber: stored.identifier!?.replace("-", ""),
              };

        await flow.signInMutation.mutateAsync(loginParams);

        flow.goToNext();
      } catch (e) {
        console.log("Error::", e);
        toast.custom(() => <RenderErrorToast />, {
          duration: 2000,
          position: "top-center",
        });
      }
    }
  };

  const handleError = (error: any) => {
    console.log("Something went wrong ::", error);
  };

  const handleSendOTP = async () => {
    const stored = flow.stateControl.getValues();
    const authMethod = stored.authMethod;

    if (sendOTPMutation.isPending) return;

    const hasIdentifier =
      authMethod === "email" ? !!stored.email : !!stored.identifier;
    if (!hasIdentifier) return;

    try {
      const otpParams =
        authMethod === "email"
          ? { email: stored.email! }
          : { phoneNumber: stored.identifier!?.replace("-", "") };

      await sendOTPMutation.mutateAsync(otpParams);
    } catch (e) {
      console.log("Something went wrong ::", e);
      toast.custom(() => <RenderErrorToast />, {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  return (
    <Controller
      control={form.control}
      name="code"
      render={({ field }) => {
        return (
          <motion.div
            initial={{ x: 4, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full h-full p-4"
          >
            <p className="font-medium text-md">Verification Code</p>
            <p className="text-sm">We&apos;ve sent you a verification code.</p>

            <div className="flex flex-row items-center w-full mt-4">
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

            <div className="flex flex-row items-center gap-1 mt-2">
              <p className="text-muted-foreground text-sm">
                Didn&apos;t receive a code?
              </p>

              <span
                onClick={handleSendOTP}
                className="font-medium text-accent-secondary cursor-pointer active:scale-95"
              >
                Resend
              </span>
              {sendOTPMutation?.isPending && (
                <CgSpinner className="text-sm text-accent-secondary animate-spin" />
              )}
            </div>

            <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
              <ActionButton
                disabled={!ENABLED}
                variant="secondary"
                loading={
                  (flowType == "login" && flow.signInMutation?.isPending) ||
                  (flowType != "login" &&
                    (flow.signUpMutation?.isPending ||
                      flow.signInMutation?.isPending))
                }
                onClick={form.handleSubmit(handleSubmit, handleError)}
              >
                Continue
              </ActionButton>
            </div>
          </motion.div>
        );
      }}
    />
  );
}
