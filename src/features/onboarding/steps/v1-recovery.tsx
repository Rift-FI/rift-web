import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, User } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useFlow } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import ActionButton from "@/components/ui/action-button";
import { toast } from "sonner";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import { useNavigate } from "react-router";
import { usePlatformDetection } from "@/utils/platform";

const v1RecoverySchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type V1_RECOVERY_SCHEMA = z.infer<typeof v1RecoverySchema>;

export default function V1Recovery() {
  const flow = useFlow();
  const navigate = useNavigate();
  const { telegramUser } = usePlatformDetection();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<V1_RECOVERY_SCHEMA>({
    resolver: zodResolver(v1RecoverySchema),
    defaultValues: {
      password: "",
    },
  });

  const { signUpMutation, signInMutation } = useWalletAuth();

  const PASSWORD = form.watch("password");
  const ENABLE_CONTINUE = PASSWORD?.trim().length > 0 && form.formState.isValid;

  const telegramId = telegramUser?.id?.toString();

  const handleSubmit = async (values: V1_RECOVERY_SCHEMA) => {
    if (!telegramId) {
      toast.custom(() => <RenderErrorToast message="Telegram ID not found" />, {
        duration: 2000,
        position: "top-center",
      });
      return;
    }

    console.log("V1 Recovery submitted:", values);

    flow.stateControl.setValue("externalId", telegramId);
    flow.stateControl.setValue("password", values.password);

    try {
      try {
        // First try to signup the user with Telegram ID
        await signUpMutation.mutateAsync({
          externalId: telegramId,
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
        externalId: telegramId,
        password: values.password,
      });

      // Set the isNewVersion flag after successful auth
      localStorage.setItem("isNewVersion", "true");

      // Only navigate after both operations succeed
      flow.goToNext();
    } catch (e) {
      console.log("Error:", e);
      toast.custom(
        () => <RenderErrorToast message="Invalid password for this account" />,
        {
          duration: 2000,
          position: "top-center",
        }
      );
    }
  };

  const handleError = (error: any) => {
    console.log("Form validation error:", error);
    toast.custom(
      () => <RenderErrorToast message="Please enter a valid password" />,
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
          <p className="font-semibold text-2xl">Recover Version 1 Account</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <User className="text-blue-600 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-blue-800 mb-1">Your Username</p>
              <p className="text-blue-700 font-mono bg-white px-2 py-1 rounded border">
                {telegramId || "Loading..."}
              </p>
              <p className="text-blue-600 text-sm mt-1">
                This is your Telegram ID and cannot be changed
              </p>
            </div>
          </div>
        </div>

        <p>Enter the password you used for your Version 1 account.</p>

        <div className="flex flex-col w-full gap-4">
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
          This will recover your existing wallet with all your funds from Sphere
          v1.
        </p>
      </div>

      <div className="w-full flex flex-row items-center">
        <ActionButton
          disabled={!ENABLE_CONTINUE}
          loading={isLoading}
          variant={"secondary"}
          onClick={form.handleSubmit(handleSubmit, handleError)}
        >
          <p className="text-white text-xl">Recover Account</p>
        </ActionButton>
      </div>
    </div>
  );
}
