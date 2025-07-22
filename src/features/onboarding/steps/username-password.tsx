import { motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useFlow } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import ActionButton from "@/components/ui/action-button";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import { usePlatformDetection } from "@/utils/platform";
import { shortenString } from "@/lib/utils";

const usernamePasswordSchema = z.object({
  externalId: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type USERNAME_PASSWORD_SCHEMA = z.infer<typeof usernamePasswordSchema>;

interface Props {
  flow?: "onboarding" | "login";
}

export default function UsernamePassword(props: Props) {
  const { flow: flowType } = props;
  const navigate = useNavigate();
  const flow = useFlow();
  const { isTelegram, telegramUser } = usePlatformDetection();
  const stored = flow.stateControl.getValues();
  const { signUpMutation, signInMutation } = useWalletAuth();

  const form = useForm<USERNAME_PASSWORD_SCHEMA>({
    resolver: zodResolver(usernamePasswordSchema),
    defaultValues: {
      externalId: stored?.externalId ?? "",
      password: stored?.password ?? "",
    },
  });

  const EXTERNAL_ID = form.watch("externalId");
  const PASSWORD = form.watch("password");
  const ENABLE_CONTINUE =
    EXTERNAL_ID?.trim().length > 0 &&
    PASSWORD?.trim().length > 0 &&
    form.formState.isValid;

  const handleSubmit = async (values: USERNAME_PASSWORD_SCHEMA) => {
    console.log("Username/Password submitted:", values);

    flow.stateControl.setValue("externalId", values.externalId);
    flow.stateControl.setValue("password", values.password);

    if (flowType === "login") {
      try {
        await signInMutation.mutateAsync({
          externalId: values.externalId,
          password: values.password,
        });

        navigate("/app");
      } catch (e) {
        console.log("Login failed:", e);
        toast.custom(
          () => <RenderErrorToast message="Invalid username or password" />,
          {
            duration: 2000,
            position: "top-center",
          }
        );
      }
      return;
    }

    try {
      try {
        await signUpMutation.mutateAsync({
          externalId: values.externalId,
          password: values.password,
        });
      } catch (signupError: any) {
        const is409Error =
          signupError?.status === 409 ||
          signupError?.response?.status === 409 ||
          signupError?.message?.includes("409") ||
          signupError?.message?.toLowerCase()?.includes("already exists");

        if (is409Error) {
          console.log("User already exists, proceeding with login");
          signUpMutation.reset();
        } else {
          throw signupError;
        }
      }

      await signInMutation.mutateAsync({
        externalId: values.externalId,
        password: values.password,
      });

      flow.goToNext();
    } catch (e) {
      console.log("Error:", e);
      toast.custom(() => <RenderErrorToast />, {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const handleError = (error: any) => {
    console.log("Form validation error:", error);
    toast.custom(
      () => <RenderErrorToast message="Please fill all fields correctly" />,
      {
        duration: 2000,
        position: "top-center",
      }
    );
  };

  const isLoading = signUpMutation.isPending || signInMutation.isPending;

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4"
    >
      <p className="font-medium text-md">Username & Password</p>
      <p className="text-sm">
        {flowType === "login"
          ? "Enter your username and password to login"
          : "Choose a username and password for your account"}
      </p>

      <div className="flex flex-col w-full gap-2 mt-4">
        <Controller
          control={form.control}
          name="externalId"
          render={({ field }) => {
            return (
              <div className="w-full rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-2">
                <input
                  {...field}
                  type="text"
                  inputMode="text"
                  placeholder="Username"
                  className="flex bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 text-sm"
                />
              </div>
            );
          }}
        />

        {isTelegram && (
          <div>
            <p
              className="w-full text-sm text-accent-primary cursor-pointer active:scale-95"
              onClick={() =>
                form.setValue("externalId", telegramUser?.username ?? "")
              }
            >
              Use my telegram username @
              {shortenString(telegramUser?.username ?? "")}
            </p>

            <p
              className="w-full text-sm text-accent-primary cursor-pointer active:scale-95 mt-2"
              onClick={() =>
                form.setValue("externalId", telegramUser?.id.toString() ?? "")
              }
            >
              Use my telegram id&nbsp;
              {shortenString(telegramUser?.id.toString() ?? "")}
            </p>
          </div>
        )}

        <Controller
          control={form.control}
          name="password"
          render={({ field }) => {
            return (
              <div className="w-full rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-2">
                <input
                  {...field}
                  type="password"
                  inputMode="text"
                  placeholder="Password"
                  className="flex bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 text-sm"
                />
              </div>
            );
          }}
        />
      </div>

      {flowType == "login" && (
        <p
          className="w-full mt-4 text-right text-sm font-medium text-accent-primary cursor-pointer active:scale-95"
          onClick={() => flow.goToNext("forgot-password")}
        >
          Forgot Password ?
        </p>
      )}

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
          loading={isLoading}
          variant={"secondary"}
          onClick={form.handleSubmit(handleSubmit, handleError)}
        >
          {flowType === "login" ? "Login" : "Continue"}
        </ActionButton>
      </div>
    </motion.div>
  );
}
