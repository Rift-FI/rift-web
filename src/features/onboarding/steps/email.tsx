import { motion } from "motion/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useFlow } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import ActionButton from "@/components/ui/action-button";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EMAIL_SCHEMA = z.infer<typeof emailSchema>;

interface Props {
  flow?: "onboarding" | "login";
}

export default function Email(props: Props) {
  const { flow: flowType } = props;
  const flow = useFlow();
  const stored = flow.stateControl.getValues();
  const isDesktop = useDesktopDetection();

  const form = useForm<EMAIL_SCHEMA>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: stored?.email ?? "",
    },
  });

  const { sendOTPMutation } = useWalletAuth();

  const EMAIL_VALUE = form.watch("email");
  const ENABLE_CONTINUE =
    EMAIL_VALUE?.trim().length > 0 && form.formState.isValid;

  const handleSubmit = async (values: EMAIL_SCHEMA) => {
    

    flow.stateControl.setValue("email", values.email);
    localStorage.setItem("email", values.email);

    try {
      await sendOTPMutation.mutateAsync({
        email: values.email,
      });

      if (flowType == "login") {
        return flow.goToNext("login-email-code");
      }
      flow.goToNext(); // Goes to email-otp step
    } catch (e) {
      
      toast.custom(() => <RenderErrorToast />, {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const handleError = (error: any) => {
    
    toast.error("Please enter a valid email address");
  };

  const content = (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`w-full h-full ${isDesktop ? "p-8" : "p-4"}`}
    >
      <div className={isDesktop ? "max-w-md mx-auto" : ""}>
        <p className={`font-medium ${isDesktop ? "text-xl mb-2" : "text-md"}`}>Email</p>
        <p className={`${isDesktop ? "text-base mb-6" : "text-sm mb-4"}`}>
          {flowType === "login"
            ? "Enter your email address to login"
            : "Enter your email address to continue"}
        </p>

        <div className={`flex flex-row w-full ${isDesktop ? "mt-6" : "mt-4"}`}>
          <Controller
            control={form.control}
            name="email"
            render={({ field }) => {
              return (
                <div className={`w-full rounded-2xl ${isDesktop ? "px-4 py-4" : "px-3 py-4"} bg-white border-2 border-accent-primary/20 mt-2`}>
                  <input
                    {...field}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="your-email@example.com"
                    className={`flex bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 ${isDesktop ? "text-base" : "text-sm"}`}
                  />
                </div>
              );
            }}
          />
        </div>

        <div className={`flex flex-row flex-nowrap gap-3 ${isDesktop ? "mt-8" : "fixed bottom-0 left-0 right-0"} p-4 py-2 ${isDesktop ? "" : "border-t-1 border-border bg-app-background"}`}>
          <ActionButton
            onClick={() => flow.gotBack()}
            variant="ghost"
            className={`border-0 bg-accent ${isDesktop ? "flex-1" : "w-[48%]"} rounded-2xl`}
          >
            Go Back
          </ActionButton>

          <ActionButton
            disabled={!ENABLE_CONTINUE}
            loading={sendOTPMutation.isPending}
            variant="secondary"
            onClick={form.handleSubmit(handleSubmit, handleError)}
            className={`${isDesktop ? "flex-1" : ""} rounded-2xl`}
          >
            Continue
          </ActionButton>
        </div>
      </div>
    </motion.div>
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
