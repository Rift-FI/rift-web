import { useNavigate } from "react-router";
import { useEffect, useRef } from "react";
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

export default function EmailCode(props: Props) {
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
  const autoSubmitTriggered = useRef(false);
  const submitRef = useRef<() => void>();

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
        // Telegram mode but no telegram user id - might be browser mode

        try {
          const signupParams = {
            email: userEmail!,
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
          email: userEmail!,
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

  // Auto-submit when all 4 digits are entered
  submitRef.current = () => form.handleSubmit(handleSubmit, handleError)();
  useEffect(() => {
    if (CODE.length === 4 && !autoSubmitTriggered.current) {
      autoSubmitTriggered.current = true;
      submitRef.current?.();
    }
    if (CODE.length < 4) {
      autoSubmitTriggered.current = false;
    }
  }, [CODE]);

  const handleSendOTP = async () => {
    if (sendOTPMutation.isPending) return;

    if (!userEmail) return;

    try {
      await sendOTPMutation.mutateAsync({ email: userEmail });
      toast.success("Code sent!", {
        description: `Check your email at ${userEmail}`,
        duration: 3000,
      });
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
            className={`w-full h-full ${isDesktop ? "p-8" : "p-4 pb-0 flex flex-col"}`}
          >
            <div className={isDesktop ? "max-w-md mx-auto" : "flex-1 flex flex-col min-h-0 overflow-y-auto"}>
              <h1 className={`font-semibold ${isDesktop ? "text-2xl mb-2" : "text-md"}`}>
                Verification Code
              </h1>
              <p className={`${isDesktop ? "text-base mb-8" : "text-sm mb-6"} text-gray-600`}>
                We've sent a verification code to{" "}
                <span className="font-medium text-accent-primary">{userEmail}</span>
              </p>

              <div className={`flex flex-row items-center justify-center w-full ${isDesktop ? "mb-8" : "mb-6"}`}>
                <InputOTP
                  value={field.value}
                  onChange={field.onChange}
                  maxLength={6}
                  inputMode="text"
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
                  Didn't receive a code?
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

              <div className={`flex flex-row flex-nowrap gap-3 ${isDesktop ? "max-w-md mx-auto" : "sticky bottom-0 -mx-4 px-4 py-3 border-t border-border bg-app-background pb-[max(0.75rem,env(safe-area-inset-bottom))]"}`}>
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
