import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useSearchParams, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "sonner";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import ActionButton from "@/components/ui/action-button";
import { TokenValidating, TokenExpired, RecoverySuccess } from "../shared";
import {
  validateToken,
  resetPasswordWithToken,
} from "@/services/recovery-api";

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

type Step = "validating" | "set-password" | "success" | "error";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesktop = useDesktopDetection();
  const token = searchParams.get("token");

  const [step, setStep] = useState<Step>("validating");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPassword = form.watch("newPassword");
  const confirmPassword = form.watch("confirmPassword");

  useEffect(() => {
    if (!token) {
      setErrorMessage("No recovery token found.");
      setStep("error");
      return;
    }

    validateToken(token)
      .then((res) => {
        if (res.valid && res.type === "PASSWORD_RESET") {
          setStep("set-password");
        } else {
          setErrorMessage(res.message || "This link is no longer valid.");
          setStep("error");
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || "This link has expired or is invalid.");
        setStep("error");
      });
  }, [token]);

  const onSubmit = async (data: PasswordFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await resetPasswordWithToken(token, data.newPassword);
      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "validating") return <TokenValidating />;
  if (step === "error") return <TokenExpired message={errorMessage} />;
  if (step === "success") {
    return (
      <RecoverySuccess
        title="Password Reset"
        description="Your password has been reset successfully. Sign in with your new password."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-screen flex flex-col bg-app-background"
    >
      <div
        className={`flex-1 flex flex-col items-center ${
          isDesktop ? "justify-center" : "justify-start pt-16"
        } px-6`}
      >
        <div className={`w-full ${isDesktop ? "max-w-md" : "max-w-sm"}`}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-accent-primary/10 rounded-full flex items-center justify-center">
              <FiLock className="w-7 h-7 text-accent-primary" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1
              className={`${
                isDesktop ? "text-2xl" : "text-xl"
              } font-semibold text-text-default mb-2`}
            >
              Reset Your Password
            </h1>
            <p className="text-sm text-text-subtle">
              Create a new secure password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="text-sm font-medium text-text-default mb-1.5 block">
                New Password
              </label>
              <Controller
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <div
                    className={`flex items-center rounded-2xl px-4 py-3.5 bg-card border-2 transition-colors ${
                      fieldState.error
                        ? "border-danger/30"
                        : "border-hairline focus-within:border-accent-primary/40"
                    }`}
                  >
                    <input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-2 text-text-subtle"
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              />
              {form.formState.errors.newPassword && (
                <p className="text-xs text-danger mt-1">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-text-default mb-1.5 block">
                Confirm Password
              </label>
              <Controller
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <div
                    className={`flex items-center rounded-2xl px-4 py-3.5 bg-card border-2 transition-colors ${
                      fieldState.error
                        ? "border-danger/30"
                        : "border-hairline focus-within:border-accent-primary/40"
                    }`}
                  >
                    <input
                      {...field}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Retype your password"
                      className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="ml-2 text-text-subtle"
                    >
                      {showConfirm ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-danger mt-1">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Password strength hint */}
            {newPassword.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-surface-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      newPassword.length >= 12
                        ? "bg-green-500 w-full"
                        : newPassword.length >= 8
                        ? "bg-yellow-500 w-2/3"
                        : "bg-red-400 w-1/3"
                    }`}
                  />
                </div>
                <span className="text-2xs text-text-subtle">
                  {newPassword.length >= 12
                    ? "Strong"
                    : newPassword.length >= 8
                    ? "Good"
                    : "Too short"}
                </span>
              </div>
            )}

            {/* Submit */}
            <div className="pt-4">
              <ActionButton
                onClick={form.handleSubmit(onSubmit)}
                disabled={
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 8 ||
                  isSubmitting
                }
                loading={isSubmitting}
                variant="secondary"
                className="w-full rounded-2xl"
              >
                Reset Password
              </ActionButton>
            </div>
          </form>

          {/* Back link */}
          <button
            onClick={() => navigate("/auth")}
            className="w-full text-center text-sm text-text-subtle mt-4 hover:text-accent-primary transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </motion.div>
  );
}
