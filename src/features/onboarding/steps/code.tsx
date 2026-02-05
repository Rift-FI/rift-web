import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useFlow } from "../context";
import RiftLoader from "@/components/ui/rift-loader";
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
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

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
  const isDesktop = useDesktopDetection();
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

          if (auth_token) {
            try {
              const apiUrl = import.meta.env.VITE_API_URL;
              const apiKey = import.meta.env.VITE_SDK_API_KEY;

              const response = await fetch(`${apiUrl}/api/kyc/verified`, {
                method: "GET",
                mode: "cors",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${auth_token}`,
                  "x-api-key": apiKey,
                },
              });

              const text = await response.text();

              let data;
              try {
                data = JSON.parse(text);
              } catch {
                navigate("/kyc");
                return;
              }

              if (data.kycVerified === true) {
                navigate("/app");
              } else if (data.underReview === true) {
                navigate("/app");
              } else {
                navigate("/kyc");
              }
            } catch {
              navigate("/kyc");
            }
          } else {
            console.error("❌ [Login] No auth token found after login!");
            navigate("/app");
          }
        } catch {
          toast.custom(() => <RenderErrorToast />, {
            duration: 2000,
            position: "top-center",
          });
        }

        return;
      }

      try {
        // Only check for telegram user if we're actually in telegram platform
        // Don't block browser/web signups
        if (isTelegram && !telegramUser?.id) {
          // Don't throw - allow signup to proceed for browser mode
        }

        try {
          const signupParams = {
            phoneNumber: stored.identifier!?.replace("-", ""),
          };

          await flow.signUpMutation.mutateAsync(signupParams);
        } catch (signupError: any) {
          const is409Error =
            signupError?.status === 409 ||
            signupError?.response?.status === 409 ||
            signupError?.message?.includes("409") ||
            signupError?.message?.toLowerCase()?.includes("already exists");

          if (is409Error) {
            flow.signUpMutation.reset();
          } else {
            throw signupError;
          }
        }

        const loginParams = {
          otpCode: values.code,
          phoneNumber: stored.identifier!?.replace("-", ""),
        };

        await flow.signInMutation.mutateAsync(loginParams);

        flow.goToNext();
      } catch {
        toast.custom(() => <RenderErrorToast />, {
          duration: 2000,
          position: "top-center",
        });
      }
    }
  };

  const handleError = () => {
    // Form validation error
  };

  const handleSendOTP = async () => {
    const stored = flow.stateControl.getValues();

    if (sendOTPMutation.isPending) return;

    const hasIdentifier = !!stored.identifier;
    if (!hasIdentifier) return;

    try {
      const otpParams = { phoneNumber: stored.identifier!?.replace("-", "") };

      await sendOTPMutation.mutateAsync(otpParams);
    } catch {
      toast.custom(() => <RenderErrorToast />, {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const content = (
    <Controller
      control={form.control}
      name="code"
      render={({ field }) => {
        return (
          <motion.div
            initial={{ x: 4, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`w-full h-full ${isDesktop ? "p-8" : "p-4"}`}
          >
            <div className={isDesktop ? "max-w-md mx-auto" : ""}>
              <h1 className={`font-semibold ${isDesktop ? "text-2xl mb-2" : "text-md"}`}>
                Verification Code
              </h1>
              <p className={`${isDesktop ? "text-base mb-8" : "text-sm mb-6"} text-gray-600`}>
                We&apos;ve sent you a verification code.
              </p>

              <div className={`flex flex-row items-center justify-center w-full ${isDesktop ? "mb-8" : "mb-6"}`}>
                <InputOTP
                  value={field.value}
                  onChange={field.onChange}
                  maxLength={6}
                >
                  <InputOTPGroup className={isDesktop ? "gap-4" : "gap-2"}>
                    <InputOTPSlot index={0} className={isDesktop ? "!h-20 !w-20 !text-3xl !rounded-2xl" : ""} />
                    <InputOTPSlot index={1} className={isDesktop ? "!h-20 !w-20 !text-3xl !rounded-2xl" : ""} />
                    <InputOTPSlot index={2} className={isDesktop ? "!h-20 !w-20 !text-3xl !rounded-2xl" : ""} />
                    <InputOTPSlot index={3} className={isDesktop ? "!h-20 !w-20 !text-3xl !rounded-2xl" : ""} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className={`flex flex-row items-center justify-center gap-1 ${isDesktop ? "mb-8" : "mb-4"}`}>
                <p className={`${isDesktop ? "text-base" : "text-sm"} text-gray-500`}>
                  Didn&apos;t receive a code?
                </p>

                <button
                  onClick={handleSendOTP}
                  disabled={sendOTPMutation?.isPending}
                  className={`${isDesktop ? "text-base" : "text-sm"} font-medium text-accent-secondary cursor-pointer hover:opacity-80 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Resend
                </button>
                {sendOTPMutation?.isPending && (
                  <RiftLoader message="Sending code..." size="sm" />
                )}
              </div>

              <div className={`flex flex-row flex-nowrap gap-3 ${isDesktop ? "max-w-md mx-auto" : "fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background"}`}>
                <button
                  disabled={!ENABLED || (flowType == "login" && flow.signInMutation?.isPending) || (flowType != "login" && (flow.signUpMutation?.isPending || flow.signInMutation?.isPending))}
                  onClick={form.handleSubmit(handleSubmit, handleError)}
                  className={`flex items-center justify-center w-full ${isDesktop ? "py-3 px-4" : "py-2.5 px-3"} rounded-2xl text-sm font-medium bg-accent-secondary text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {(flowType == "login" && flow.signInMutation?.isPending) ||
                  (flowType != "login" &&
                    (flow.signUpMutation?.isPending ||
                      flow.signInMutation?.isPending)) ? (
                    <span className="opacity-70">Verifying...</span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        );
      }}
    />
  );

  return (
    <div className="h-full flex flex-col">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="md" className="h-full flex items-center justify-center">
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}
