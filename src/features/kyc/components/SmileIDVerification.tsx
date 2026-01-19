import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import ActionButton from "@/components/ui/action-button";
import { Country } from "../types";
import { CgSpinner } from "react-icons/cg";
import useUser from "@/hooks/data/use-user";
import { ID_TYPES_BY_COUNTRY } from "../constants";
import useKYCJobPolling from "@/hooks/data/use-kyc-job-polling";
import useKYCStatus from "@/hooks/data/use-kyc-status";

// Import Smile ID web component
import "@smileid/web-components/smart-camera-web";

interface Props {
  country: Country;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  onBack?: () => void;
  apiBaseUrl: string; // Your backend API URL
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "smart-camera-web": any;
    }
  }
}

// Human-readable labels for ID types
const ID_TYPE_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  DRIVERS_LICENSE: "Driver's License",
  VOTER_ID: "Voter ID",
  BVN: "Bank Verification Number (BVN)",
  NIN: "National Identification Number (NIN)",
  SSNIT: "SSNIT",
  ALIEN_CARD: "Alien Card",
};

type Step = "id-details" | "capture" | "result";

interface VerificationResult {
  passed: boolean;
  pending: boolean;
  reason: string;
  jobId?: string;
  isSystemError?: boolean;
  underReview?: boolean;
  isDuplicate?: boolean;
  errorCode?: string;
}

// Helper to detect if an error is a system error vs user error
const isSystemErrorMessage = (reason: string): boolean => {
  const systemErrorKeywords = [
    "temporarily unavailable",
    "service unavailable",
    "try again later",
    "network error",
    "server error",
    "timeout",
    "connection",
    "credits",
    "production not enabled",
  ];
  const lowerReason = reason.toLowerCase();
  return systemErrorKeywords.some((keyword) => lowerReason.includes(keyword));
};

export default function SmileIDVerification({
  country,
  onSuccess,
  onError,
  onBack,
  apiBaseUrl,
}: Props) {
  const [step, setStep] = useState<Step>("id-details");
  const [idType, setIdType] = useState<string>("");
  const [idNumber, setIdNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [isCheckingRealStatus, setIsCheckingRealStatus] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const { refetch: refetchKYCStatus } = useKYCStatus();

  const [backgroundPolling, setBackgroundPolling] = useState(false);

  // KYC job polling for pending verification
  const {
    status: pollingStatus,
    isPolling,
    elapsedTime,
    error: pollingError,
    stopPolling,
  } = useKYCJobPolling({
    jobId: verificationResult?.jobId || null,
    enabled: (shouldPoll || backgroundPolling) && !!verificationResult?.jobId,
    backgroundMode: backgroundPolling,
    showToasts: backgroundPolling, // Show toasts when in background mode
    onComplete: (result) => {
      if (result.passed && result.complete) {
        toast.success("✅ Verification Approved!", {
          description:
            result.message || "Your identity has been verified successfully.",
          duration: 5000,
        });
        setVerificationResult({
          passed: true,
          pending: false,
          reason: result.message || "Identity verified successfully",
          jobId: result.jobId,
          underReview: false,
        });
        setShouldPoll(false);
        setBackgroundPolling(false);
        // Notify parent of success
        setTimeout(() => {
          onSuccess({ ...result, passed: true });
        }, 2000);
      } else if (
        result.complete &&
        !result.passed &&
        result.status === "failed"
      ) {
        toast.error("❌ Verification Failed", {
          description: result.message || "Identity verification failed",
          duration: 5000,
        });
        setVerificationResult({
          passed: false,
          pending: false,
          reason: result.message || "Identity verification failed",
          jobId: result.jobId,
          underReview: false,
        });
        setShouldPoll(false);
        setBackgroundPolling(false);
      } else if (result.underReview && !result.complete) {
        // Still pending after timeout
        toast.info("⏳ Still Under Review", {
          description:
            result.message ||
            "Your verification is still being reviewed. We'll notify you when it's complete.",
          duration: 5000,
        });
      }
    },
    onError: (err) => {
      console.error("❌ Polling error:", err);
      if (!backgroundPolling) {
        toast.error("Status check failed", {
          description: err.message,
        });
      }
    },
  });

  // Get available ID types for the selected country
  const availableIdTypes = ID_TYPES_BY_COUNTRY[country.code] || [
    "NATIONAL_ID",
    "PASSPORT",
  ];

  // Handle proceeding from ID details to capture
  const handleProceedToCapture = () => {
    if (!idType) {
      toast.error("Please select your ID type");
      return;
    }
    if (!idNumber.trim()) {
      toast.error("Please enter your ID number");
      return;
    }
    setStep("capture");
  };

  // Submit captured images to backend for verification
  const submitForVerification = useCallback(
    async (capturedData: any) => {
      try {
        setSubmitting(true);

        // Prepare user identifier
        const identifier =
          user?.email || user?.phoneNumber || user?.externalId || user?.id;

        if (!identifier) {
          throw new Error(
            "No user identifier found. Please complete your profile first."
          );
        }

        // Send images to backend for Smile ID verification
        const apiKey = import.meta.env.VITE_SDK_API_KEY;
        const response = await fetch(`${apiBaseUrl}/api/kyc/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            images: capturedData.images,
            partner_params: {
              user_id: user?.id || localStorage.getItem("userId") || "",
              job_id: `job-${Date.now()}`,
              job_type: 1, // biometric_kyc
              country_code: country.code,
              id_type: idType,
              id_number: idNumber.trim(),
              identifier: identifier,
              libraryVersion: capturedData.meta?.version || "unknown",
            },
            country_code: country.code,
            id_type: idType,
            id_number: idNumber.trim(),
            user_id: user?.id,
            email: user?.email,
            phone_number: user?.phoneNumber,
            external_id: user?.externalId,
          }),
        });

        const data = await response.json();
        

        // Log debug info if present (for developers only)
        if (data._debug) {
          
        }

        // New API response structure:
        // - success: true, jobId, status: "pending", message (immediate response)
        // - Or error responses with code (DUPLICATE_ID, DUPLICATE_BIOMETRICS, etc.)

        if (data.success && data.jobId && data.status === "pending") {
        // ⏳ PENDING - Verification submitted, waiting for approval
          toast.info("Verification Submitted", {
            description:
              data.message ||
              "Your verification is being processed. We'll notify you when it's complete.",
          });

          setVerificationResult({
            passed: false,
            pending: true,
            reason:
              data.message ||
              "Verification submitted successfully. Waiting for approval.",
            jobId: data.jobId,
            underReview: true,
          });
          setStep("result");

          // Start polling for the result
          if (data.jobId) {
            
            setShouldPoll(true);
          }
        } else if (data.success && data.passed) {
          // ✅ PASSED - Verification successful (shouldn't happen immediately, but handle it)
          toast.success("Verification Complete!", {
            description: data.message || "Identity verified successfully",
          });

          setVerificationResult({
            passed: true,
            pending: false,
            reason: data.message || "Identity verified successfully",
            jobId: data.jobId,
          });
          setStep("result");

          // Call onSuccess after short delay to show result screen
          setTimeout(() => {
            onSuccess(data);
          }, 2000);
        } else {
          // ❌ FAILED - Verification failed (includes success: false errors)
          const userMessage =
            data.message || data.reason || "Verification failed";
          // Check for duplicate errors (ID or biometrics already registered)
          const isDuplicateError =
            data.code === "DUPLICATE_ID" ||
            data.code === "DUPLICATE_BIOMETRICS" ||
            userMessage.toLowerCase().includes("already") ||
            userMessage.toLowerCase().includes("duplicate") ||
            userMessage.toLowerCase().includes("registered");

          // If it's a duplicate error, the user might actually be verified already
          // Let's check the real status from the backend
          if (isDuplicateError) {
            toast.info("Checking your verification status...", {
              description: "Please wait while we verify your account status.",
            });
            
            setIsCheckingRealStatus(true);
            
            // Check real KYC status multiple times with delays
            const checkRealStatus = async () => {
              for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                
                // Invalidate and refetch KYC status
                await queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
                const result = await refetchKYCStatus();
                
                if (result.data?.kycVerified) {
                  // User is actually verified!
                  toast.success("Verification Complete!", {
                    description: "Your identity has been verified successfully.",
                  });
                  setVerificationResult({
                    passed: true,
                    pending: false,
                    reason: "Your identity has been verified successfully.",
                    jobId: data.jobId,
                  });
                  setStep("result");
                  setIsCheckingRealStatus(false);
                  setTimeout(() => {
                    onSuccess({ passed: true, kycVerified: true });
                  }, 2000);
                  return;
                }
                
                if (result.data?.underReview) {
                  // User is under review
                  toast.info("Verification Under Review", {
                    description: "Your verification is being processed. Please check back shortly.",
                  });
                  setVerificationResult({
                    passed: false,
                    pending: true,
                    reason: "Your verification is being processed. Please check back shortly.",
                    jobId: data.jobId,
                    underReview: true,
                  });
                  setStep("result");
                  setIsCheckingRealStatus(false);
                  setShouldPoll(true);
                  return;
                }
              }
              
              // After all retries, show the original error
              setIsCheckingRealStatus(false);
              toast.error("Already Registered", {
                description: "This ID or face has been used before. If this is your account, please contact support.",
              });
              setVerificationResult({
                passed: false,
                pending: false,
                reason: "This ID or face has been used before. If this is your account, please contact support.",
                jobId: data.jobId,
                isDuplicate: true,
                errorCode: data.code,
              });
              setStep("result");
            };
            
            checkRealStatus();
            return;
          }

          toast.error("Verification Failed", {
            description: userMessage,
          });

          // Check if this is a system error or user error
          // Use _debug.isSystemError if available, otherwise detect from message
          const systemError =
            data._debug?.isSystemError || isSystemErrorMessage(userMessage);

          setVerificationResult({
            passed: false,
            pending: false,
            reason: userMessage,
            jobId: data.jobId,
            isSystemError: systemError,
            isDuplicate: isDuplicateError,
            errorCode: data.code,
          });
          setStep("result");
        }
      } catch (err: any) {
        // Network or unexpected error - check if user might actually be verified
        const errorMessage = err.message || "Network error. Please try again.";
        
        // Check if the error might indicate the user is already processed
        const mightBeAlreadyProcessed = 
          errorMessage.toLowerCase().includes("already") ||
          errorMessage.toLowerCase().includes("duplicate") ||
          errorMessage.toLowerCase().includes("exists");
        
        if (mightBeAlreadyProcessed) {
          toast.info("Checking your verification status...");
          setIsCheckingRealStatus(true);
          
          // Check real status
          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
            const result = await refetchKYCStatus();
            
            if (result.data?.kycVerified) {
              toast.success("Verification Complete!");
              setVerificationResult({
                passed: true,
                pending: false,
                reason: "Your identity has been verified successfully.",
              });
              setStep("result");
              setIsCheckingRealStatus(false);
              setTimeout(() => onSuccess({ passed: true }), 2000);
              return;
            }
            
            if (result.data?.underReview) {
              toast.info("Verification Under Review");
              setVerificationResult({
                passed: false,
                pending: true,
                reason: "Your verification is being processed.",
                underReview: true,
              });
              setStep("result");
              setIsCheckingRealStatus(false);
              return;
            }
          }
          setIsCheckingRealStatus(false);
        }

        toast.error("Verification Failed", {
          description: errorMessage,
        });

        setVerificationResult({
          passed: false,
          pending: false,
          reason: errorMessage,
          isSystemError: true,
        });
        setStep("result");

        onError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [apiBaseUrl, country, idType, idNumber, user, onSuccess, onError]
  );

  // Use a ref to hold the latest submit function to avoid stale closures
  const submitRef = useRef(submitForVerification);
  submitRef.current = submitForVerification;

  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  // Set up event listeners for the smart-camera-web component
  // Only run when on capture step
  useEffect(() => {
    // Don't attach listeners if not on capture step
    if (step !== "capture") {
      
      return;
    }

    

    // Handler for when images are captured and confirmed by user
    const handlePublish = (event: Event) => {
      const customEvent = event as CustomEvent;
      submitRef.current(customEvent.detail);
    };

    // Handler for when user cancels the capture
    const handleCancel = () => {
      toast.info("Verification cancelled");
      if (onBackRef.current) {
        onBackRef.current();
      }
    };

    // Handler for when user clicks back
    const handleBack = () => {
      // Back button clicked
    };

    // Listen at DOCUMENT level - this catches events that bubble up from anywhere
    // SmileID's modal might be rendered outside our container, so document-level is more reliable
    document.addEventListener("smart-camera-web.publish", handlePublish);
    document.addEventListener("smart-camera-web.cancelled", handleCancel);
    document.addEventListener("smart-camera-web.back", handleBack);

    

    // Also try to attach directly to the element as backup
    let retryCount = 0;
    const maxRetries = 10;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let smartCameraElement: Element | null = null;

    const attachToElement = () => {
      const element = containerRef.current?.querySelector("smart-camera-web");

      if (!element) {
        if (retryCount < maxRetries) {
          retryCount++;
          retryTimeout = setTimeout(attachToElement, 300);
        }
        return;
      }

      smartCameraElement = element;

      // Add element-level listeners as backup
      element.addEventListener("smart-camera-web.publish", handlePublish);
      element.addEventListener("smart-camera-web.cancelled", handleCancel);
      element.addEventListener("smart-camera-web.back", handleBack);

      
    };

    // Small delay to ensure DOM is ready
    setTimeout(attachToElement, 100);

    // Cleanup
    return () => {
      clearTimeout(retryTimeout);

      // Remove document-level listeners
      document.removeEventListener("smart-camera-web.publish", handlePublish);
      document.removeEventListener("smart-camera-web.cancelled", handleCancel);
      document.removeEventListener("smart-camera-web.back", handleBack);

      // Remove element-level listeners if attached
      if (smartCameraElement) {
        smartCameraElement.removeEventListener(
          "smart-camera-web.publish",
          handlePublish
        );
        smartCameraElement.removeEventListener(
          "smart-camera-web.cancelled",
          handleCancel
        );
        smartCameraElement.removeEventListener(
          "smart-camera-web.back",
          handleBack
        );
      }

      
    };
  }, [step]); // Only depend on step - use refs for functions

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center w-full h-full p-5"
      >
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold">Verification Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <ActionButton onClick={onBack} variant="secondary">
            Go Back
          </ActionButton>
        </div>
      </motion.div>
    );
  }

  // Show loading overlay when submitting images or checking real status
  if (submitting || isCheckingRealStatus) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center w-full h-full p-5"
      >
        <CgSpinner className="text-accent-primary w-10 h-10 animate-spin mb-4" />
        <p className="text-center font-medium">
          {isCheckingRealStatus ? "Checking your verification status..." : "Verifying your identity..."}
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {isCheckingRealStatus 
            ? "Please wait while we confirm your account status" 
            : "Please wait while we process your documents"}
        </p>
      </motion.div>
    );
  }

  // Show result screen after verification
  if (step === "result" && verificationResult) {
    // ✅ PASSED
    if (verificationResult.passed) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center justify-center w-full h-full p-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6"
          >
            <span className="text-4xl">✅</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-center mb-2">
            Verification Complete!
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            {verificationResult.reason}
          </p>
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 w-full max-w-sm">
            <p className="text-sm text-green-800 dark:text-green-200 text-center">
              Your identity has been verified. You now have full access to all
              features.
            </p>
          </div>
          {verificationResult.jobId && (
            <p className="text-xs text-muted-foreground mt-4">
              Reference: {verificationResult.jobId}
            </p>
          )}
        </motion.div>
      );
    }

    // ⏳ PENDING - with automatic polling
    if (verificationResult.pending) {
      const formatElapsedTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      };

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center justify-center w-full h-full p-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-6"
          >
            {isPolling ? (
              <CgSpinner className="text-amber-600 dark:text-amber-400 w-10 h-10 animate-spin" />
            ) : (
              <span className="text-4xl">⏳</span>
            )}
          </motion.div>
          <h2 className="text-2xl font-bold text-center mb-2">Under Review</h2>
          <p className="text-muted-foreground text-center mb-4">
            {verificationResult.reason}
          </p>

          {/* Polling Status Indicator */}
          {isPolling && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 w-full max-w-sm mb-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <CgSpinner className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Checking verification status...
                </p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Time elapsed: {formatElapsedTime(elapsedTime)}
              </p>
              {pollingStatus && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Status: {pollingStatus.status}
                </p>
              )}
            </motion.div>
          )}

          {/* Polling Error */}
          {pollingError && !isPolling && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-950 rounded-lg p-4 w-full max-w-sm mb-4"
            >
              <p className="text-sm text-red-800 dark:text-red-200 text-center">
                {pollingError.message}
              </p>
            </motion.div>
          )}

          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 w-full max-w-sm mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
              {isPolling
                ? "We're automatically checking your verification status. Please wait..."
                : backgroundPolling
                ? "We'll check your verification status in the background and notify you when it's complete."
                : "Our team is reviewing your documents. This usually takes a few minutes. You can close this and we'll notify you when it's complete."}
            </p>
          </div>
          {verificationResult.jobId && (
            <p className="text-xs text-muted-foreground mb-4">
              Reference: {verificationResult.jobId}
            </p>
          )}
          <div className="flex gap-3 w-full max-w-sm">
            {isPolling ? (
              <ActionButton
                onClick={() => {
                  // Enable background polling and close
                  setBackgroundPolling(true);
                  setShouldPoll(false);
                  stopPolling();
                  // Restart polling in background mode
                  setTimeout(() => {
                    setShouldPoll(true);
                  }, 100);
                  // Close the modal
                  if (onBack) {
                    onBack();
                  }
                }}
                variant="secondary"
                className="flex-1"
              >
                Close & Wait for Approval
              </ActionButton>
            ) : backgroundPolling ? (
              <ActionButton
                onClick={onBack}
                variant="secondary"
                className="flex-1"
              >
                Close
              </ActionButton>
            ) : (
              <>
                {verificationResult.jobId && (
                  <ActionButton
                    onClick={() => setShouldPoll(true)}
                    className="flex-1"
                  >
                    Check Status
                  </ActionButton>
                )}
                <ActionButton
                  onClick={() => {
                    // Enable background polling
                    setBackgroundPolling(true);
                    setShouldPoll(true);
                    // Close the modal
                    if (onBack) {
                      onBack();
                    }
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Close & Wait for Approval
                </ActionButton>
              </>
            )}
          </div>
        </motion.div>
      );
    }

    // ❌ FAILED
    // Check if this is a duplicate error (ID or biometrics already registered)
    if (verificationResult.isDuplicate) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center justify-center w-full h-full p-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-6"
          >
            <span className="text-4xl">🚫</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-center mb-2">
            Already Registered
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            {verificationResult.reason}
          </p>
          <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 w-full max-w-sm mb-6">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
              {verificationResult.errorCode === "DUPLICATE_BIOMETRICS"
                ? "Your face is already linked to another account"
                : "This ID is already linked to another account"}
            </p>
            <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
              <li>• Each person can only verify one account</li>
              <li>• If you believe this is an error, please contact support</li>
              <li>• Provide your details for manual review</li>
            </ul>
          </div>
          {verificationResult.jobId && (
            <p className="text-xs text-muted-foreground mb-4">
              Reference: {verificationResult.jobId}
            </p>
          )}
          <ActionButton onClick={onBack} className="w-full max-w-sm">
            Go Back
          </ActionButton>
        </motion.div>
      );
    }

    // Regular failure
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center justify-center w-full h-full p-5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-6"
        >
          <span className="text-4xl">❌</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-center mb-2">
          Verification Failed
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          {verificationResult.reason}
        </p>
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 w-full max-w-sm mb-6">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            What you can do:
          </p>
          {verificationResult.isSystemError ? (
            // System error tips
            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
              <li>• Wait a few minutes and try again</li>
              <li>• Check your internet connection</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          ) : (
            // User error tips
            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
              <li>• Ensure your ID is valid and not expired</li>
              <li>• Take photos in good lighting without glare</li>
              <li>• Make sure your face is clearly visible in the selfie</li>
              <li>• Double-check your ID number is correct</li>
            </ul>
          )}
        </div>
        {verificationResult.jobId && (
          <p className="text-xs text-muted-foreground mb-4">
            Reference: {verificationResult.jobId}
          </p>
        )}
        <div className="flex gap-3 w-full max-w-sm">
          <ActionButton
            onClick={() => {
              setVerificationResult(null);
              setStep("id-details");
            }}
            className="flex-1"
          >
            Try Again
          </ActionButton>
          <ActionButton onClick={onBack} variant="secondary" className="flex-1">
            Cancel
          </ActionButton>
        </div>
      </motion.div>
    );
  }

  // Step 1: ID Details Form
  if (step === "id-details") {
    return (
      <motion.div
        initial={{ x: 4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex flex-col w-full h-full"
      >
        {/* Header */}
        <div className="p-5 pb-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-text-default mb-4"
            >
              ← Back
            </button>
          )}
          <h1 className="text-2xl font-bold mb-2">Enter ID Details</h1>
          <p className="text-muted-foreground text-sm">
            Please provide your ID information for {country.flag} {country.name}
          </p>
        </div>

        {/* ID Details Form */}
        <div className="flex-1 px-5 space-y-4">
          {/* ID Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ID Type <span className="text-red-500">*</span>
            </label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-default bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary appearance-none"
            >
              <option value="">Select ID type...</option>
              {availableIdTypes.map((type) => (
                <option key={type} value={type}>
                  {ID_TYPE_LABELS[type] || type}
                </option>
              ))}
            </select>
          </div>

          {/* ID Number Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Enter your ID number"
              className="w-full px-4 py-3 rounded-xl border border-border-default bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be verified against government records
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
              🔒 Why do we need this?
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Your ID number allows us to verify your identity against official
              government records, providing enhanced security and faster
              verification.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-5">
          <ActionButton
            onClick={handleProceedToCapture}
            disabled={!idType || !idNumber.trim()}
          >
            Continue to Photo Capture
          </ActionButton>
        </div>
      </motion.div>
    );
  }

  // Step 2: Camera Capture
  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col w-full h-full"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <button
          onClick={() => setStep("id-details")}
          className="text-sm text-muted-foreground hover:text-text-default mb-4"
        >
          ← Back to ID Details
        </button>
        <h1 className="text-2xl font-bold mb-2">Identity Verification</h1>
        <p className="text-muted-foreground text-sm">
          Follow the instructions to capture your selfie and ID document
        </p>
      </div>

      {/* Selected ID Info */}
      <div className="px-5 pb-2">
        <div className="bg-surface-secondary rounded-lg p-3 flex items-center gap-3">
          <div className="text-2xl">{country.flag}</div>
          <div>
            <p className="text-sm font-medium">
              {ID_TYPE_LABELS[idType] || idType}
            </p>
            <p className="text-xs text-muted-foreground">ID: {idNumber}</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-5 pb-4">
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            📸 What you'll need:
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Your face clearly visible</li>
            <li>• Your {ID_TYPE_LABELS[idType] || "ID"} document</li>
            <li>• Good lighting</li>
            <li>• A steady hand</li>
          </ul>
        </div>
      </div>

      {/* Smile ID Component Container */}
      <div className="flex-1 px-5">
        <div
          ref={containerRef}
          id="smile-id-container"
          className="w-full h-full"
        >
          <smart-camera-web capture-id theme-color="#000" />
        </div>
      </div>
    </motion.div>
  );
}
