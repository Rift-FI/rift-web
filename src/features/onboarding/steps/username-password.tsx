import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useFlow } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import ActionButton from "@/components/ui/action-button";
import { toast } from "sonner";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import { useNavigate } from "react-router";

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
  const flow = useFlow();
  const navigate = useNavigate();
  const stored = flow.stateControl.getValues();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<USERNAME_PASSWORD_SCHEMA>({
    resolver: zodResolver(usernamePasswordSchema),
    defaultValues: {
      externalId: stored?.externalId ?? "",
      password: stored?.password ?? "",
    },
  });

  const { signUpMutation, signInMutation } = useWalletAuth();

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
      // For login, just call signIn directly
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

    // For signup flow
    try {
      try {
        // First try to signup the user
        await signUpMutation.mutateAsync({
          externalId: values.externalId,
          password: values.password,
        });
      } catch (signupError: any) {
        // Check if it's a 409 (user already exists) error
        const is409Error =
          signupError?.status === 409 ||
          signupError?.response?.status === 409 ||
          signupError?.message?.includes("409") ||
          signupError?.message?.toLowerCase()?.includes("already exists");

        if (is409Error) {
          console.log("User already exists, proceeding with login");
          // Reset the signup mutation error state since 409 is expected
          signUpMutation.reset();
          // Don't throw, just continue to login step
        } else {
          // Re-throw if it's a different error
          throw signupError;
        }
      }

      // Then sign them in (this runs regardless of signup success/409)
      await signInMutation.mutateAsync({
        externalId: values.externalId,
        password: values.password,
      });

      // Only navigate after both operations succeed
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
    <div className="flex flex-col w-full h-full items-center justify-between p-5 pb-10">
      <div />

      <div className="flex flex-col gap-5 w-full h-4/5">
        <div
          className="flex flex-row items-center gap-4 cursor-pointer"
          onClick={() => flow.gotBack()}
        >
          <ArrowLeft />
          <p className="font-semibold text-2xl">
            {flowType === "login" ? "Login" : "Create Account"}
          </p>
        </div>
        <p>
          {flowType === "login"
            ? "Enter your username and password to login."
            : "Choose a username and password for your account."}
        </p>

        <div className="flex flex-col w-full gap-4">
          <Controller
            control={form.control}
            name="externalId"
            render={({ field, fieldState }) => {
              return (
                <div className="w-full">
                  <input
                    className="w-full flex flex-row items-center placeholder:font-semibold placeholder:text-lg outline-none bg-accent rounded-md px-2 py-3"
                    placeholder="Username"
                    type="text"
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

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => {
              return (
                <div className="w-full">
                  <div className="relative">
                    <input
                      className="w-full flex flex-row items-center placeholder:font-semibold placeholder:text-lg outline-none bg-accent rounded-md px-2 py-3 pr-10"
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
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
          {flowType === "login"
            ? "Use the credentials you created when signing up."
            : "Your username and password will be used to secure your wallet."}
        </p>
      </div>

      <div className="w-full flex flex-row items-center">
        <ActionButton
          disabled={!ENABLE_CONTINUE}
          loading={isLoading}
          variant={"secondary"}
          onClick={form.handleSubmit(handleSubmit, handleError)}
        >
          <p className=" text-white text-xl">
            {flowType === "login" ? "Login" : "Continue"}
          </p>
        </ActionButton>
      </div>
    </div>
  );
}
