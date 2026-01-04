import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import ActionButton from "@/components/ui/action-button";
import { Country } from "../types";
import { CgSpinner } from "react-icons/cg";
import useUser from "@/hooks/data/use-user";

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

export default function SmileIDVerification({
  country,
  onSuccess,
  onError,
  onBack,
  apiBaseUrl,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smileIdToken, setSmileIdToken] = useState<string | null>(null);
  const smileIdRef = useRef<any>(null);
  const { data: user } = useUser();

  // Fetch web token from your backend
  useEffect(() => {
    const fetchWebToken = async () => {
      try {
        setLoading(true);
        setError(null);

        // Prepare user identifier - use email, phone, or externalId
        const identifier =
          user?.email || user?.phoneNumber || user?.externalId || user?.id;

        if (!identifier) {
          throw new Error(
            "No user identifier found. Please complete your profile first."
          );
        }

        const response = await fetch(`${apiBaseUrl}/api/kyc/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            country_code: country.code,
            identifier: identifier,
            user_id: user?.id,
            email: user?.email,
            phone_number: user?.phoneNumber,
            external_id: user?.externalId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get verification token");
        }

        const data = await response.json();
        setSmileIdToken(data.token);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching web token:", err);
        setError(err.message || "Failed to initialize verification");
        setLoading(false);
        toast.error("Verification Error", {
          description: "Could not start verification process",
        });
      }
    };

    fetchWebToken();
  }, [country, apiBaseUrl, user]);

  // Initialize Smile ID when token is ready
  useEffect(() => {
    if (!smileIdToken || !smileIdRef.current) return;

    try {
      // Configure Smile ID
      const config = {
        token: smileIdToken,
        product: "biometric_kyc",
        callback_url: `${apiBaseUrl}/api/kyc/callback`,
        environment: import.meta.env.VITE_SMILE_ID_ENV || "sandbox",
        partner_details: {
          partner_id: import.meta.env.VITE_SMILE_ID_PARTNER_ID || "",
          name: import.meta.env.VITE_APP_NAME || "Rift",
          logo_url: import.meta.env.VITE_APP_LOGO_URL || "",
          policy_url: import.meta.env.VITE_PRIVACY_POLICY_URL || "",
          theme_color: "#000",
        },
        partner_params: {
          user_id: user?.id || localStorage.getItem("userId") || "",
          country_code: country.code,
          identifier:
            user?.email || user?.phoneNumber || user?.externalId || "",
        },
        onSuccess: (data: any) => {
          console.log("✅ KYC Success:", data);
          toast.success("Verification Complete!", {
            description: "Your identity has been verified successfully",
          });
          onSuccess(data);
        },
        onClose: () => {
          console.log("❌ KYC Closed by user");
        },
        onError: (err: any) => {
          console.error("❌ KYC Error:", err);
          toast.error("Verification Failed", {
            description: err.message || "Please try again",
          });
          onError(err);
        },
      };

      // Initialize SmileIdentity
      if (typeof (window as any).SmileIdentity === "function") {
        (window as any).SmileIdentity(config);
      }
    } catch (err: any) {
      console.error("Error initializing Smile ID:", err);
      setError(err.message);
    }
  }, [smileIdToken, country, apiBaseUrl, onSuccess, onError]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center w-full h-full p-5"
      >
        <CgSpinner className="text-accent-primary w-10 h-10 animate-spin mb-4" />
        <p className="text-center font-medium">Initializing verification...</p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Please wait while we prepare the verification process
        </p>
      </motion.div>
    );
  }

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
        <h1 className="text-2xl font-bold mb-2">Identity Verification</h1>
        <p className="text-muted-foreground text-sm">
          Follow the instructions to capture your selfie and ID document
        </p>
      </div>

      {/* Instructions */}
      <div className="px-5 pb-4">
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            📸 What you'll need:
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Your face clearly visible</li>
            <li>
              • A valid government-issued ID ({country.flag} {country.name})
            </li>
            <li>• Good lighting</li>
            <li>• A steady hand</li>
          </ul>
        </div>
      </div>

      {/* Smile ID Component Container */}
      <div className="flex-1 px-5">
        <div ref={smileIdRef} id="smile-id-container" className="w-full h-full">
          <smart-camera-web capture-id theme-color="#000" />
        </div>
      </div>
    </motion.div>
  );
}
