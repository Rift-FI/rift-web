import { useState } from "react";
import { motion } from "motion/react";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";
import { useFlow } from "../context";
import useWalletRecovery from "@/hooks/wallet/use-wallet-recovery";
import ActionButton from "@/components/ui/action-button";
import { LinkSentConfirmation } from "@/features/recovery/shared";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import RiftLoader from "@/components/ui/rift-loader";

type Step = "enter-username" | "choose-method" | "link-sent";

interface RecoveryOptions {
  email: string | null;
  phone: string | null;
}

export default function ForgotPassword() {
  const flow = useFlow();
  const isDesktop = useDesktopDetection();

  const [step, setStep] = useState<Step>("enter-username");
  const [username, setUsername] = useState("");
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOptions | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"emailRecovery" | "phoneRecovery">("emailRecovery");
  const [maskedTarget, setMaskedTarget] = useState("");

  const { recoveryMethodsQuery, requestRecoveryMutation } = useWalletRecovery({
    externalId: username || undefined,
  });

  const handleContinue = async () => {
    if (!username.trim()) {
      toast.error("Please enter your username");
      return;
    }

    setIsLoadingOptions(true);
    try {
      const result = await recoveryMethodsQuery.refetch();
      const options = result.data?.recoveryOptions;

      if (!options || (!options.email && !options.phone)) {
        toast.error("No recovery methods found for this account. Please contact support.");
        setIsLoadingOptions(false);
        return;
      }

      setRecoveryOptions({
        email: options.email ?? null,
        phone: options.phone ?? null,
      });
      setStep("choose-method");
    } catch {
      toast.error("Could not find account. Please check your username.");
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleSelectMethod = async (method: "emailRecovery" | "phoneRecovery") => {
    setSelectedMethod(method);
    const target = method === "emailRecovery" ? recoveryOptions?.email : recoveryOptions?.phone;

    try {
      await requestRecoveryMutation.mutateAsync({
        externalId: username,
        method,
      });
      setMaskedTarget(target || "");
      setStep("link-sent");
    } catch {
      toast.error("Failed to send recovery link. Please try again.");
    }
  };

  const handleBack = () => {
    if (step === "choose-method") {
      setStep("enter-username");
    } else {
      flow.gotBack("login-username-password");
    }
  };

  if (step === "link-sent") {
    return (
      <motion.div
        initial={{ x: 4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full h-full bg-app-background"
      >
        <LinkSentConfirmation
          method={selectedMethod}
          maskedTarget={maskedTarget}
          onBackToLogin={() => flow.gotBack("login-username-password")}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full bg-app-background"
    >
      <div
        className={`h-full overflow-y-auto overscroll-contain flex flex-col ${
          isDesktop ? "max-w-md mx-auto justify-center px-6 py-8" : "p-4 pb-8"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl hover:bg-surface-subtle transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-text-default" />
          </button>
          <div>
            <h1 className={`${isDesktop ? "text-2xl" : "text-lg"} font-semibold text-text-default`}>
              Forgot Password
            </h1>
            <p className="text-sm text-text-subtle">
              {step === "enter-username"
                ? "Enter your username to get started"
                : "Choose how to receive your reset link"}
            </p>
          </div>
        </div>

        {step === "enter-username" && (
          <div className="flex-1 flex flex-col">
            {/* Username Input */}
            <div className="mb-6">
              <label className="text-sm font-medium text-text-default mb-1.5 block">
                Username
              </label>
              <div className="flex items-center rounded-2xl px-4 py-3.5 bg-card border-2 border-hairline focus-within:border-accent-primary/40 transition-colors">
                <input
                  type="text"
                  inputMode="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                />
              </div>
            </div>

            {/* Continue Button */}
            <div className={isDesktop ? "" : "mt-auto"}>
              <ActionButton
                onClick={handleContinue}
                disabled={!username.trim() || isLoadingOptions}
                loading={isLoadingOptions}
                variant="secondary"
                className="w-full rounded-2xl"
              >
                Continue
              </ActionButton>
            </div>
          </div>
        )}

        {step === "choose-method" && (
          <div className="flex-1 flex flex-col">
            <p className="text-sm text-text-subtle mb-4">
              We'll send a password reset link to your recovery contact
            </p>

            {/* Recovery method options */}
            <div className="space-y-3">
              {recoveryOptions?.email && (
                <button
                  onClick={() => handleSelectMethod("emailRecovery")}
                  disabled={requestRecoveryMutation.isPending}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border-2 border-hairline hover:border-accent-primary/30 transition-all text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MdAlternateEmail className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-default">
                      Email
                    </p>
                    <p className="text-xs text-text-subtle truncate">
                      {recoveryOptions.email}
                    </p>
                  </div>
                  {requestRecoveryMutation.isPending && selectedMethod === "emailRecovery" && (
                    <RiftLoader size="sm" />
                  )}
                </button>
              )}

              {recoveryOptions?.phone && (
                <button
                  onClick={() => handleSelectMethod("phoneRecovery")}
                  disabled={requestRecoveryMutation.isPending}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border-2 border-hairline hover:border-accent-primary/30 transition-all text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HiPhone className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-default">
                      Phone
                    </p>
                    <p className="text-xs text-text-subtle truncate">
                      {recoveryOptions.phone}
                    </p>
                  </div>
                  {requestRecoveryMutation.isPending && selectedMethod === "phoneRecovery" && (
                    <RiftLoader size="sm" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
