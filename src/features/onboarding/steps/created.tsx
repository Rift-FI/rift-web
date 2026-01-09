import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { SlCheck } from "react-icons/sl";
import { CgSpinner } from "react-icons/cg";
import { FiChevronRight } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";
import useAnalaytics from "@/hooks/use-analytics";
import { useFlow } from "../context";
import { useNotifications } from "@/contexts/NotificationContext";
import ActionButton from "@/components/ui/action-button";
import { toast } from "sonner";
import rift from "@/lib/rift";

export default function Created() {
  const { signInMutation, signUpMutation } = useFlow();
  const loading = signInMutation?.isPending || signUpMutation?.isPending;
  const error = signInMutation?.error || signUpMutation?.error;
  const { logEvent } = useAnalaytics();
  const { enableNotifications, isLoading: notifLoading } = useNotifications();
  const [notificationAsked, setNotificationAsked] = useState(false);

  const navigate = useNavigate();

  // After successful signup, update user with referrer in background
  useEffect(() => {
    const updateReferrer = async () => {
      const pendingReferrer = localStorage.getItem("pending_referrer");
      const token = localStorage.getItem("token");
      
      // Only process if we have a pending referrer, auth token, and signup was successful
      if (pendingReferrer && token && !loading && !error && signUpMutation?.isSuccess) {
        try {
          console.log("📎 Updating user with referrer:", pendingReferrer);
          rift.setBearerToken(token);
          await rift.auth.updateUser({ referrer: pendingReferrer });
          localStorage.removeItem("pending_referrer");
          console.log("✅ Referrer updated successfully");
        } catch (err) {
          console.error("❌ Failed to update referrer:", err);
          // Don't show error to user, just log it
        }
      }
    };

    updateReferrer();
  }, [loading, error, signUpMutation?.isSuccess]);

  const handleOpenWallet = async () => {
    logEvent("WALLET_CREATED");

    // Check KYC status before navigating
    const auth_token = localStorage.getItem("token");
    console.log("🔍 [Created] Auth token exists:", !!auth_token);

    if (auth_token) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const apiKey = import.meta.env.VITE_SDK_API_KEY;

        console.log("🔍 [Created] Checking KYC at:", `${apiUrl}/api/kyc/verified`);

        const response = await fetch(`${apiUrl}/api/kyc/verified`, {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth_token}`,
            "x-api-key": apiKey,
          },
        });

        console.log("🔍 [Created] KYC response status:", response.status);

        // Get raw text first to handle non-JSON responses
        const text = await response.text();
        console.log("🔍 [Created] KYC raw response:", text.substring(0, 200));

        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("❌ [Created] KYC response is not JSON:", parseError);
          // If we can't parse the response, go to KYC to be safe
          navigate("/kyc");
          return;
        }

        console.log("🔍 [Created] KYC status:", data);

        if (data.kycVerified === true) {
          console.log("✅ [Created] User is KYC verified, going to /app");
          navigate("/app");
        } else if (data.underReview === true) {
          console.log("⏳ [Created] User KYC is under review, going to /app");
          navigate("/app");
        } else {
          console.log("⚠️ [Created] User not KYC verified, going to /kyc");
          navigate("/kyc");
        }
      } catch (kycError) {
        console.error("❌ [Created] KYC check failed:", kycError);
        // On error, go to KYC to be safe
        navigate("/kyc");
      }
    } else {
      navigate("/app");
    }
  };

  const handleEnableNotifications = async () => {
    setNotificationAsked(true);
    const result = await enableNotifications();

    if (result.success) {
      toast.success("🔔 Notifications enabled!", {
        description: "You'll receive updates about your transactions",
      });
      logEvent("NOTIFICATIONS_ENABLED_ONBOARDING");
    } else {
      toast.error("Couldn't enable notifications", {
        description:
          result.error || "You can enable them later in Profile settings",
      });
    }
  };

  const handleSkipNotifications = () => {
    setNotificationAsked(true);
    logEvent("NOTIFICATIONS_SKIPPED_ONBOARDING");
  };

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col items-center justify-between w-full h-full p-5"
    >
      <div />
      <div className="w-full flex flex-col items-center justify-center p-5">
        {loading ? (
          <WalletCreating />
        ) : (
          <>{error ? <WalletCreationFailed /> : <WalletCreated />}</>
        )}
      </div>

      <div className="flex flex-col items-center justify-center w-full gap-3">
        {!loading && !error && !notificationAsked && (
          <>
            <div className="w-full bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-2">
              <div className="flex items-start gap-3">
                <IoNotificationsOutline className="text-blue-600 dark:text-blue-400 text-2xl flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Stay updated with notifications
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Get instant alerts for transactions, payments, and important
                    account activities
                  </p>
                </div>
              </div>
            </div>

            <ActionButton
              onClick={handleEnableNotifications}
              disabled={notifLoading}
              className="p-[0.625rem] rounded-[0.75rem] gap-1 w-full"
            >
              {notifLoading ? "Enabling..." : "Enable Notifications"}
            </ActionButton>

            <button
              onClick={handleSkipNotifications}
              className="text-sm text-muted-foreground hover:text-text-default transition-colors"
            >
              Skip for now
            </button>
          </>
        )}

        {!loading && !error && notificationAsked && (
          <ActionButton
            onClick={handleOpenWallet}
            variant="success"
            className="p-[0.625rem] rounded-[0.75rem] gap-1"
          >
            Get Started <FiChevronRight className="text-lg" />
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

function WalletCreated() {
  return (
    <div className="w-full flex flex-col items-center">
      <SlCheck className="text-4xl text-success" />
      <p className="font-medium text-lg text-center mt-2">
        Your wallet is ready
      </p>
      <p className="text-muted-foreground text-center">
        You wallet was created successfully
      </p>
    </div>
  );
}

function WalletCreating() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center my-2">
        <CgSpinner className="text-accent-primary w-10 h-10 animate-spin" />
      </div>

      <p className="font-medium text-lg text-center">Creating Your wallet</p>

      <p className="text-muted-foreground text-center">
        Doing some cryptographic magic...
      </p>
    </div>
  );
}

function WalletCreationFailed() {
  const { gotBack } = useFlow();
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <p className="font-medium text-lg text-center">Wallet creation failed</p>

      <p className="text-muted-foreground text-center">
        Sorry, an unexpected error occurred...
      </p>

      <button
        onClick={() => gotBack()}
        className="font-medium text-accent-secondary cursor-pointer active:scale-95 mt-4"
      >
        Go back & try again
      </button>
    </div>
  );
}
