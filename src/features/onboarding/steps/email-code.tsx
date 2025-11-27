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

export default function EmailCode(props: Props) {
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

  const userEmail = stored.email || localStorage.getItem("email");

  const handleSubmit = async (values: CODE_SCHEMA) => {
    flow.stateControl.setValue("code", values.code);

    if (values.code) {
      if (!flow.signInMutation || !flow.signUpMutation) {
        return;
      }

      if (flowType == "login") {
        try {
          const loginParams = {
            otpCode: values.code,
            email: userEmail!,
          };

          await flow.signInMutation.mutateAsync(loginParams);
          navigate("/app");
        } catch (e) {
          toast.custom(() => <RenderErrorToast />, {
            duration: 2000,
            position: "top-center",
          });
        }

        return;
      }

      try {
        console.log("🔍 [EmailCode] Starting signup flow...");
        console.log("🔍 [EmailCode] Stored data:", stored);

        // Only check for telegram user if we're actually in telegram platform
        if (isTelegram && !telegramUser?.id) {
          console.warn(
            "⚠️ [EmailCode] Telegram mode but no telegram user id - might be browser mode"
          );
        }

        try {
          const signupParams = {
            email: userEmail!,
          };
          console.log("📝 [EmailCode] Signup params:", signupParams);

          await flow.signUpMutation.mutateAsync(signupParams);
          console.log("✅ [EmailCode] Signup successful");
        } catch (signupError: any) {
          console.log("⚠️ [EmailCode] Signup error:", signupError);

          const is409Error =
            signupError?.status === 409 ||
            signupError?.response?.status === 409 ||
            signupError?.message?.includes("409") ||
            signupError?.message?.toLowerCase()?.includes("already exists");

          if (is409Error) {
            console.log("ℹ️ [EmailCode] User already exists, proceeding with login");
            flow.signUpMutation.reset();
          } else {
            console.error("❌ [EmailCode] Signup failed with error:", signupError);
            throw signupError;
          }
        }

        const loginParams = {
          otpCode: values.code,
          email: userEmail!,
        };
        console.log("🔑 [EmailCode] Login params:", loginParams);

        await flow.signInMutation.mutateAsync(loginParams);
        console.log("✅ [EmailCode] Login successful");

        flow.goToNext();
      } catch (e) {
        console.error("❌ [EmailCode] Final error:", e);
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
    if (sendOTPMutation.isPending) return;

    if (!userEmail) return;

    try {
      await sendOTPMutation.mutateAsync({ email: userEmail });
      toast.success("Code sent!", {
        description: `Check your email at ${userEmail}`,
        duration: 3000,
      });
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
            <p className="text-sm">
              We've sent a verification code to{" "}
              <span className="font-medium text-accent-primary">{userEmail}</span>
            </p>

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
                Didn't receive a code?
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

