import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CgSpinner } from "react-icons/cg";
import { FiExternalLink, FiMail } from "react-icons/fi";
import ActionButton from "@/components/ui/action-button";
import { Country } from "../types";
import useUser from "@/hooks/data/use-user";
import useKYCStatus from "@/hooks/data/use-kyc-status";

interface Props {
  country: Country;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  onBack?: () => void;
  apiBaseUrl: string;
}

interface TokenResponse {
  token: string | null;
  verificationUrl?: string;
  provider: "smileid" | "sumsub";
  expires_at: string;
  linkDelivered?: boolean;
  deliveryMethod?: string;
}

type Step = "loading" | "link-sent" | "polling" | "error";

export default function SumsubVerification({
  country,
  onSuccess,
  onError,
  onBack,
  apiBaseUrl,
}: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [linkDelivered, setLinkDelivered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: user } = useUser();
  const { refetch: refetchKYCStatus } = useKYCStatus();
  const [isPolling, setIsPolling] = useState(false);

  // Request the verification token/link from the backend
  const requestVerification = useCallback(async () => {
    try {
      setStep("loading");
      const apiKey = import.meta.env.VITE_SDK_API_KEY;
      const identifier =
        user?.email || user?.phoneNumber || user?.externalId || user?.id;

      const response = await fetch(`${apiBaseUrl}/api/kyc/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          country_code: country.code,
          identifier,
        }),
      });

      const data: TokenResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to start verification. Please try again.");
      }

      if (data.provider !== "sumsub") {
        throw new Error("Unexpected provider response.");
      }

      setVerificationUrl(data.verificationUrl || null);
      setLinkDelivered(data.linkDelivered ?? false);
      setStep("link-sent");

      // Start polling for completion
      startPolling();
    } catch (err: any) {
      const msg = err.message || "Failed to start verification.";
      setErrorMessage(msg);
      setStep("error");
      onError(err);
    }
  }, [apiBaseUrl, country.code, user, onError]);

  // Start on mount
  useState(() => {
    requestVerification();
  });

  // Poll for KYC status completion
  const startPolling = useCallback(() => {
    setIsPolling(true);

    const interval = setInterval(async () => {
      try {
        const result = await refetchKYCStatus();
        if (result.data?.kycVerified) {
          clearInterval(interval);
          setIsPolling(false);
          toast.success("Verification Complete!", {
            description: "Your identity has been verified successfully.",
          });
          onSuccess({ passed: true, kycVerified: true, provider: "sumsub" });
        }
      } catch {
        // Silently retry
      }
    }, 5000); // Poll every 5 seconds

    // Stop after 10 minutes
    setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetchKYCStatus, onSuccess]);

  const handleOpenLink = () => {
    if (verificationUrl) {
      window.open(verificationUrl, "_blank");
      setStep("polling");
    }
  };

  // Loading state — requesting token
  if (step === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center w-full h-full p-5"
      >
        <CgSpinner className="text-accent-primary w-10 h-10 animate-spin mb-4" />
        <p className="text-center font-medium">
          Setting up verification...
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Please wait while we prepare your identity verification
        </p>
      </motion.div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center w-full h-full p-5"
      >
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <span className="text-4xl">!</span>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">
          Something Went Wrong
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          {errorMessage}
        </p>
        <div className="flex gap-3 w-full max-w-sm">
          <ActionButton onClick={requestVerification} className="flex-1">
            Try Again
          </ActionButton>
          <ActionButton onClick={onBack} variant="secondary" className="flex-1">
            Go Back
          </ActionButton>
        </div>
      </motion.div>
    );
  }

  // Link sent / polling state
  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col w-full h-full min-h-0 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-text-default mb-4"
          >
            &larr; Back
          </button>
        )}
        <h1 className="text-2xl font-bold mb-2">Verify Your Identity</h1>
        <p className="text-muted-foreground text-sm">
          Complete verification for {country.flag} {country.name}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 min-h-0">
        <div className="flex flex-col items-center py-6 space-y-6">
          {/* Email sent indicator */}
          {linkDelivered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 rounded-xl p-5 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <FiMail className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Link Sent</p>
                  <p className="text-xs text-green-700">
                    Check your email to complete verification
                  </p>
                </div>
              </div>
              <p className="text-sm text-green-800">
                We've sent a verification link to your registered email. Please
                check your inbox and complete the verification process.
              </p>
            </motion.div>
          )}

          {/* Open link button */}
          {verificationUrl && (
            <div className="w-full max-w-sm space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                {linkDelivered
                  ? "You can also open the verification link directly:"
                  : "Open the link below to complete your identity verification:"}
              </p>
              <ActionButton onClick={handleOpenLink}>
                <FiExternalLink className="w-4 h-4" />
                Open Verification Link
              </ActionButton>
            </div>
          )}

          {/* Polling indicator */}
          {isPolling && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 rounded-xl p-4 w-full max-w-sm"
            >
              <div className="flex items-center gap-3">
                <CgSpinner className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Waiting for verification...
                  </p>
                  <p className="text-xs text-blue-700">
                    We'll automatically detect when you complete the verification. You can close this and come back later.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <div className="bg-surface-secondary rounded-xl p-4 w-full max-w-sm">
            <p className="text-sm font-medium mb-3">How it works:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <p className="text-sm text-muted-foreground">
                  Open the verification link
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <p className="text-sm text-muted-foreground">
                  Upload your ID document and take a selfie
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <p className="text-sm text-muted-foreground">
                  Come back here — we'll detect it automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="flex-shrink-0 p-5 bg-app-background border-t border-muted safe-area-inset-bottom">
        <ActionButton onClick={onBack} variant="secondary">
          Close & Verify Later
        </ActionButton>
      </div>
    </motion.div>
  );
}
