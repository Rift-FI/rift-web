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
          const loginParams = {
            otpCode: values.code,
            phoneNumber: stored.identifier!?.replace("-", ""),
          };

          await flow.signInMutation.mutateAsync(loginParams);

          // Small delay to ensure token is saved
          await new Promise((resolve) => setTimeout(resolve, 100));

          // After successful login, check KYC status
          const auth_token = localStorage.getItem("token");
          console.log("🔍 [Login] Auth token exists:", !!auth_token);

          if (auth_token) {
            try {
              const apiUrl = import.meta.env.VITE_API_URL;
              const apiKey = import.meta.env.VITE_SDK_API_KEY;

              console.log("🔍 [Login] Checking KYC status at:", `${apiUrl}/api/kyc/verified`);

              const response = await fetch(`${apiUrl}/api/kyc/verified`, {
                method: "GET",
                mode: "cors",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${auth_token}`,
                  "x-api-key": apiKey,
                },
              });

              console.log("🔍 [Login] KYC response status:", response.status);

              // Get raw text first to handle non-JSON responses
              const text = await response.text();
              console.log("🔍 [Login] KYC raw response:", text.substring(0, 200));

              let data;
              try {
                data = JSON.parse(text);
              } catch (parseError) {
                console.error("❌ [Login] KYC response is not JSON:", parseError);
                // If we can't parse the response, go to KYC to be safe
                navigate("/kyc");
                return;
              }

              console.log("🔍 [Login] KYC status:", data);

              if (data.kycVerified === true) {
                console.log("✅ [Login] User is KYC verified, going to /app");
                navigate("/app");
              } else if (data.underReview === true) {
                console.log("⏳ [Login] User KYC is under review, going to /app");
                navigate("/app");
              } else {
                console.log("⚠️ [Login] User not KYC verified, going to /kyc");
                navigate("/kyc");
              }
            } catch (kycError) {
              console.error("❌ [Login] KYC check failed:", kycError);
              // On error, go to KYC to be safe
              navigate("/kyc");
            }
          } else {
            console.error("❌ [Login] No auth token found after login!");
            navigate("/app");
          }
        } catch (e) {
          toast.custom(() => <RenderErrorToast />, {
            duration: 2000,
            position: "top-center",
          });
        }

        return;
      }

      try {
        console.log("🔍 [Code] Starting signup flow...");
        console.log("🔍 [Code] Stored data:", stored);
        console.log("🔍 [Code] isTelegram:", isTelegram);
        console.log("🔍 [Code] telegramUser:", telegramUser);

        // Only check for telegram user if we're actually in telegram platform
        // Don't block browser/web signups
        if (isTelegram && !telegramUser?.id) {
          console.warn(
            "⚠️ [Code] Telegram mode but no telegram user id - might be browser mode"
          );
          // Don't throw - allow signup to proceed for browser mode
        }

        try {
          const signupParams = {
            phoneNumber: stored.identifier!?.replace("-", ""),
          };
          console.log("📝 [Code] Signup params:", signupParams);

          await flow.signUpMutation.mutateAsync(signupParams);
          console.log("✅ [Code] Signup successful");
        } catch (signupError: any) {
          console.log("⚠️ [Code] Signup error:", signupError);

          const is409Error =
            signupError?.status === 409 ||
            signupError?.response?.status === 409 ||
            signupError?.message?.includes("409") ||
            signupError?.message?.toLowerCase()?.includes("already exists");

          if (is409Error) {
            console.log("ℹ️ [Code] User already exists, proceeding with login");
            flow.signUpMutation.reset();
          } else {
            console.error("❌ [Code] Signup failed with error:", signupError);
            throw signupError;
          }
        }

        const loginParams = {
          otpCode: values.code,
          phoneNumber: stored.identifier!?.replace("-", ""),
        };
        console.log("🔑 [Code] Login params:", loginParams);

        await flow.signInMutation.mutateAsync(loginParams);
        console.log("✅ [Code] Login successful");

        flow.goToNext();
      } catch (e) {
        console.error("❌ [Code] Final error:", e);
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

    const hasIdentifier = !!stored.identifier;
    if (!hasIdentifier) return;

    try {
      const otpParams = { phoneNumber: stored.identifier!?.replace("-", "") };

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
