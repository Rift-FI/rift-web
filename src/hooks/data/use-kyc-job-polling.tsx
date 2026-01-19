import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface KYCJobStatusResponse {
  success: boolean;
  jobId: string;
  status: "pending" | "provisional" | "verified" | "failed";
  complete: boolean;
  passed: boolean;
  underReview: boolean;
  message: string;
  reason?: string;
  resultCode?: string;
  resultText?: string;
  category?: string;
  completedAt?: string;
}

interface UseKYCJobPollingOptions {
  jobId: string | null;
  enabled: boolean;
  onComplete?: (result: KYCJobStatusResponse) => void;
  onError?: (error: Error) => void;
  pollingInterval?: number; // in milliseconds, default 3 seconds (matches backend)
  maxPollingTime?: number; // in milliseconds, default 5 minutes (matches backend)
  backgroundMode?: boolean; // If true, continues polling even when component unmounts
  showToasts?: boolean; // Show toast notifications on status changes
}

interface UseKYCJobPollingResult {
  status: KYCJobStatusResponse | null;
  isPolling: boolean;
  error: Error | null;
  elapsedTime: number; // in seconds
  stopPolling: () => void;
  startPolling: () => void;
}

async function fetchJobStatus(jobId: string): Promise<KYCJobStatusResponse> {
  const authToken = localStorage.getItem("token");
  const apiKey = import.meta.env.VITE_SDK_API_KEY;
  const apiUrl =
    import.meta.env.VITE_API_URL || "https://70f763cc5e5e.ngrok-free.app";

  if (!authToken) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${apiUrl}/api/kyc/job/${jobId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to fetch job status: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Hook for polling KYC job status when verification is under review.
 * Use this when the initial verification request returns `pending: true`.
 *
 * Polling Strategy:
 * - Polls every 3 seconds by default (matches backend polling interval)
 * - Stops when `complete: true` is returned
 * - Max polling time: 5 minutes (matches backend timeout)
 * - Supports background mode for continuous polling
 */
export default function useKYCJobPolling({
  jobId,
  enabled,
  onComplete,
  onError,
  pollingInterval = 3000, // 3 seconds (matches backend)
  maxPollingTime = 5 * 60 * 1000, // 5 minutes (matches backend)
  backgroundMode = false,
  showToasts = false,
}: UseKYCJobPollingOptions): UseKYCJobPollingResult {
  const [status, setStatus] = useState<KYCJobStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const previousStatusRef = useRef<KYCJobStatusResponse | null>(null);
  const backgroundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Keep refs updated
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    setIsPolling(false);
    startTimeRef.current = null;
  }, []);

  const poll = useCallback(async () => {
    if (!jobId) return;

    // Check if max polling time exceeded
    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= maxPollingTime) {
        
        stopPolling();
        const timeoutError = new Error(
          "Verification is taking longer than expected. Please check back later or contact support."
        );
        setError(timeoutError);
        onErrorRef.current?.(timeoutError);
        return;
      }
    }

    try {
      
      const result = await fetchJobStatus(jobId);
      setStatus(result);
      setError(null);

      

      // Check for status changes and show toasts if enabled
      if (showToasts && previousStatusRef.current) {
        const prevStatus = previousStatusRef.current;
        
        // Status changed from pending to complete
        if (!prevStatus.complete && result.complete) {
          if (result.passed) {
            toast.success("✅ Verification Approved!", {
              description: result.message || "Your identity has been verified successfully.",
              duration: 5000,
            });
          } else if (result.status === "failed") {
            toast.error("❌ Verification Failed", {
              description: result.message || "Identity verification failed. Please try again.",
              duration: 5000,
            });
          } else if (result.underReview) {
            toast.info("⏳ Still Under Review", {
              description: result.message || "Your verification is still being reviewed. We'll notify you when it's complete.",
              duration: 5000,
            });
          }
        }
      }

      previousStatusRef.current = result;

      // Check if verification is complete
      if (result.complete) {
        
        stopPolling();
        onCompleteRef.current?.(result);
      } else if (result.status === "pending" && result.underReview) {
        // Still pending - continue polling
        console.log("⏳ KYC still pending, continuing to poll...");
      }
    } catch (err) {
      
      const pollError =
        err instanceof Error ? err : new Error("Failed to check status");
      setError(pollError);
      // Don't stop polling on transient errors, just log them
      // Only stop on persistent errors after a few retries
    }
  }, [jobId, maxPollingTime, stopPolling]);

  const startPolling = useCallback(() => {
    if (!jobId || isPolling) return;

    
    setIsPolling(true);
    setError(null);
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    // Do an immediate poll
    poll();

    // Set up polling interval
    intervalRef.current = setInterval(poll, pollingInterval);

    // Set up elapsed time counter (updates every second)
    elapsedIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  }, [jobId, isPolling, poll, pollingInterval]);

  // Auto-start polling when enabled and jobId is available
  useEffect(() => {
    if (enabled && jobId && !isPolling) {
      startPolling();
    }

    // Cleanup on unmount or when disabled
    return () => {
      if (!enabled) {
        stopPolling();
      }
    };
  }, [enabled, jobId, startPolling, stopPolling, isPolling]);

  // Background polling mode - continues even when component unmounts
  useEffect(() => {
    if (backgroundMode && jobId && enabled) {
      // Store jobId in localStorage for background polling
      localStorage.setItem("kyc_background_polling", jobId);
      
      // Set up background polling interval
      const backgroundPoll = async () => {
        try {
          const result = await fetchJobStatus(jobId);
          
          if (result.complete) {
            // Complete - show toast and clear background polling
            localStorage.removeItem("kyc_background_polling");
            
            if (showToasts) {
              if (result.passed) {
                toast.success("✅ Verification Approved!", {
                  description: result.message || "Your identity has been verified successfully.",
                  duration: 5000,
                });
              } else {
                toast.error("❌ Verification Failed", {
                  description: result.message || "Identity verification failed.",
                  duration: 5000,
                });
              }
            }
            
            if (backgroundIntervalRef.current) {
              clearInterval(backgroundIntervalRef.current);
              backgroundIntervalRef.current = null;
            }
          } else if (result.underReview && showToasts) {
            // Still pending - could show periodic updates
            console.log("⏳ Background polling: Still under review");
          }
        } catch (err) {
          console.error("❌ Background polling error:", err);
        }
      };
      
      // Start background polling
      backgroundIntervalRef.current = setInterval(backgroundPoll, pollingInterval);
      
      return () => {
        if (backgroundIntervalRef.current) {
          clearInterval(backgroundIntervalRef.current);
          backgroundIntervalRef.current = null;
        }
      };
    }
  }, [backgroundMode, jobId, enabled, pollingInterval, showToasts]);

  // Cleanup on unmount (unless in background mode)
  useEffect(() => {
    return () => {
      if (!backgroundMode) {
        stopPolling();
      }
    };
  }, [stopPolling, backgroundMode]);

  return {
    status,
    isPolling,
    error,
    elapsedTime,
    stopPolling,
    startPolling,
  };
}

