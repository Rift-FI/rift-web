import { motion } from "motion/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useFlow } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import ActionButton from "@/components/ui/action-button";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";

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
    console.log("Email submitted:", values);

    flow.stateControl.setValue("email", values.email);
    localStorage.setItem("email", values.email);

    try {
      await sendOTPMutation.mutateAsync({
        email: values.email,
      });

      if (flowType == "login") {
        return flow.goToNext("login-code");
      }
      flow.goToNext();
    } catch (e) {
      console.log("something went wrong::", e);
      toast.custom(() => <RenderErrorToast />, {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const handleError = (error: any) => {
    console.log("Something went wrong ::", error);
    toast.error("Please enter a valid email address");
  };

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4"
    >
      <p className="font-medium text-md">Email</p>
      <p className="text-sm">Enter your email address to continue</p>

      <div className="flex flex-row w-full mt-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => {
            return (
              <div className="w-full rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-2">
                <input
                  {...field}
                  type="text"
                  inputMode="email"
                  placeholder="your-email-address@email.com"
                  className="flex bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 text-sm"
                />
              </div>
            );
          }}
        />
      </div>

      <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={() => flow.gotBack()}
          variant="ghost"
          className="border-0 bg-accent w-[48%]"
        >
          Go Back
        </ActionButton>

        <ActionButton
          disabled={!ENABLE_CONTINUE}
          loading={sendOTPMutation.isPending}
          variant="secondary"
          onClick={form.handleSubmit(handleSubmit, handleError)}
        >
          Continue
        </ActionButton>
      </div>
    </motion.div>
  );
}
