import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useFlow } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import ActionButton from "@/components/ui/action-button";
import { toast } from "sonner";
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
    // Store email in localStorage for later retrieval
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
    toast.custom(
      () => <RenderErrorToast message="Please enter a valid email address" />,
      {
        duration: 2000,
        position: "top-center",
      }
    );
  };

  return (
    <div className="flex flex-col w-full h-full items-center justify-between p-5 pb-10">
      <div />

      <div className="flex flex-col gap-5 w-full h-4/5">
        <div
          className="flex flex-row items-center gap-4 cursor-pointer"
          onClick={() => flow.gotBack()}
        >
          <ArrowLeft />
          <p className="font-semibold text-2xl">Email</p>
        </div>
        <p>Enter your email address to continue.</p>

        <div className="flex flex-row w-full">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => {
              return (
                <div className="w-full">
                  <input
                    className="w-full flex flex-row items-center placeholder:font-semibold placeholder:text-lg outline-none bg-accent rounded-md px-2 py-3"
                    placeholder="Email Address"
                    type="email"
                    {...field}
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              );
            }}
          />
        </div>

        <p className="text-muted-foreground">
          We'll use your email address for authentication.
        </p>
      </div>

      <div className="w-full flex flex-row items-center">
        <ActionButton
          disabled={!ENABLE_CONTINUE}
          loading={sendOTPMutation.isPending}
          variant={"secondary"}
          onClick={form.handleSubmit(handleSubmit, handleError)}
        >
          <p className=" text-white text-xl">Continue</p>
        </ActionButton>
      </div>
    </div>
  );
}
