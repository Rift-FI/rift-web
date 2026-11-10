import { useState } from "react";
import { motion } from "motion/react";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
import { FiArrowLeft, FiMail, FiSmartphone } from "react-icons/fi";
import { toast } from "sonner";
import { useFlow } from "../context";
import useWalletRecovery from "@/hooks/wallet/use-wallet-recovery";
import ActionButton from "@/components/ui/action-button";
import { LinkSentConfirmation } from "@/features/recovery/shared";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import RiftLoader from "@/components/ui/rift-loader";

type Step = "enter-identifier" | "choose-method" | "link-sent";

interface RecoveryOptions {
  email: string | null;
  phone: string | null;
}

export default function AccountRecoveryStart() {
  const flow = useFlow();
  const isDesktop = useDesktopDetection();

  const [step, setStep] = useState<Step>("enter-identifier");
  const [identifierType, setIdentifierType] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOptions | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"emailRecovery" | "phoneRecovery">("emailRecovery");
  const [maskedTarget, setMaskedTarget] = useState("");

  const {
    getRecoveryOptionsByIdentifierMutation,
    requestAccountRecoveryLinkMutation,
  } = useWalletRecovery({});

  const handleContinue = async () => {
    if (!identifier.trim()) {
      toast.error(`Please enter your ${identifierType === "email" ? "email address" : "phone number"}`);
      return;
    }

    try {
      const result = await getRecoveryOptionsByIdentifierMutation.mutateAsync({
        identifier,
        identifierType,
      });

      const options = result.recoveryOptions;
      if (!options || (!options.email && !options.phone)) {
        toast.error("No recovery methods found for this account.");
        return;
      }

      setRecoveryOptions(options);
      setStep("choose-method");
    } catch {
      toast.error("Could not find account. Please check and try again.");
    }
  };

  const handleSelectMethod = async (method: "emailRecovery" | "phoneRecovery") => {
    setSelectedMethod(method);
    const target = method === "emailRecovery" ? recoveryOptions?.email : recoveryOptions?.phone;

    try {
      await requestAccountRecoveryLinkMutation.mutateAsync({
        identifier,
        identifierType,
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
      setStep("enter-identifier");
    } else {
      flow.gotBack("start");
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
          onBackToLogin={() => flow.gotBack("start")}
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
              Account Recovery
            </h1>
            <p className="text-sm text-text-subtle">
              {step === "enter-identifier"
                ? "Enter the phone or email you lost access to"
                : "Choose how to receive your recovery link"}
            </p>
          </div>
        </div>

        {step === "enter-identifier" && (
          <div className="flex-1 flex flex-col">
            {/* Type toggle */}
            <div className="flex rounded-2xl bg-surface-subtle p-1 mb-6">
              <button
                onClick={() => {
                  setIdentifierType("email");
                  setIdentifier("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  identifierType === "email"
                    ? "bg-card text-accent-primary shadow-sm"
                    : "text-text-subtle"
                }`}
              >
                <FiMail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => {
                  setIdentifierType("phone");
                  setIdentifier("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  identifierType === "phone"
                    ? "bg-card text-accent-primary shadow-sm"
                    : "text-text-subtle"
                }`}
              >
                <FiSmartphone className="w-4 h-4" />
                Phone
              </button>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="text-sm font-medium text-text-default mb-1.5 block">
                {identifierType === "email" ? "Email Address" : "Phone Number"}
              </label>
              <div className="flex items-center rounded-2xl px-4 py-3.5 bg-card border-2 border-hairline focus-within:border-accent-primary/40 transition-colors">
                {identifierType === "email" ? (
                  <FiMail className="w-4 h-4 text-text-subtle mr-3" />
                ) : (
                  <FiSmartphone className="w-4 h-4 text-text-subtle mr-3" />
                )}
                <input
                  type={identifierType === "email" ? "email" : "tel"}
                  inputMode={identifierType === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    identifierType === "email"
                      ? "your-email@example.com"
                      : "+254712345678"
                  }
                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                />
              </div>
              <p className="text-xs text-text-subtle mt-2">
                Enter the {identifierType} you used to create your account
              </p>
            </div>

            {/* Continue Button */}
            <div className={isDesktop ? "" : "mt-auto"}>
              <ActionButton
                onClick={handleContinue}
                disabled={
                  !identifier.trim() ||
                  getRecoveryOptionsByIdentifierMutation.isPending
                }
                loading={getRecoveryOptionsByIdentifierMutation.isPending}
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
              We'll send a recovery link to your backup contact
            </p>

            <div className="space-y-3">
              {recoveryOptions?.email && (
                <button
                  onClick={() => handleSelectMethod("emailRecovery")}
                  disabled={requestAccountRecoveryLinkMutation.isPending}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border-2 border-hairline hover:border-accent-primary/30 transition-all text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MdAlternateEmail className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-default">Email</p>
                    <p className="text-xs text-text-subtle truncate">
                      {recoveryOptions.email}
                    </p>
                  </div>
                  {requestAccountRecoveryLinkMutation.isPending &&
                    selectedMethod === "emailRecovery" && <RiftLoader size="sm" />}
                </button>
              )}

              {recoveryOptions?.phone && (
                <button
                  onClick={() => handleSelectMethod("phoneRecovery")}
                  disabled={requestAccountRecoveryLinkMutation.isPending}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border-2 border-hairline hover:border-accent-primary/30 transition-all text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HiPhone className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-default">Phone</p>
                    <p className="text-xs text-text-subtle truncate">
                      {recoveryOptions.phone}
                    </p>
                  </div>
                  {requestAccountRecoveryLinkMutation.isPending &&
                    selectedMethod === "phoneRecovery" && <RiftLoader size="sm" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
