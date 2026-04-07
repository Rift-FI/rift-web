import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { SlCheck } from "react-icons/sl";
import RiftLoader from "@/components/ui/rift-loader";
import { FiChevronRight } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";
import { DollarSign } from "lucide-react";
import useAnalytics from "@/hooks/use-analytics";
import { useFlow } from "../context";
import { useNotifications } from "@/contexts/NotificationContext";
import ActionButton from "@/components/ui/action-button";
import { toast } from "sonner";
import rift from "@/lib/rift";
import useDesktopDetection from "@/hooks/use-desktop-detection";

export default function Created() {
  const { signInMutation, signUpMutation } = useFlow();
  const loading = signInMutation?.isPending || signUpMutation?.isPending;
  const error = signInMutation?.error || signUpMutation?.error;
  const { logEvent } = useAnalytics();
  const { enableNotifications, isLoading: notifLoading } = useNotifications();
  const [notificationAsked, setNotificationAsked] = useState(false);
  const isDesktop = useDesktopDetection();

  const navigate = useNavigate();

  // Referrer is now saved immediately after signup in the signup step itself
  // (code.tsx, email-code.tsx, username-password.tsx)

  const handleBuyUSDC = () => {
    logEvent("WALLET_CREATED");
    logEvent("ONBOARDING_BUY_USDC_CLICKED");
    navigate("/app/request?type=topup");
  };

  const handleSkipToHome = () => {
    logEvent("WALLET_CREATED");
    logEvent("ONBOARDING_SKIP_TO_HOME");
    navigate("/app");
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
    <div className={`w-full h-full ${isDesktop ? "flex items-center justify-center p-8" : ""}`}>
      <motion.div
        initial={{ x: 4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`flex flex-col items-center justify-between w-full h-full ${isDesktop ? "max-w-xl bg-white rounded-2xl shadow-lg border border-gray-200 h-auto min-h-[480px] px-12 py-10" : "p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"}`}
      >
        <div />
        <div className={`w-full flex flex-col items-center justify-center ${isDesktop ? "py-4" : "p-5"}`}>
          {loading ? (
            <WalletCreating />
          ) : (
            <>{error ? <WalletCreationFailed /> : <WalletCreated />}</>
          )}
        </div>

        <div className={`flex flex-col items-center justify-center w-full gap-3 ${isDesktop ? "max-w-sm" : ""}`}>
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
            <>
              <div className="w-full bg-accent-primary/5 rounded-lg p-4 mb-2">
                <div className="flex items-start gap-3">
                  <DollarSign className="text-accent-primary text-xl flex-shrink-0 mt-0.5 w-5 h-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-default mb-1">
                      Buy your first USDC
                    </p>
                    <p className="text-xs text-text-subtle">
                      Top up your account and get USDC — a digital dollar backed 1:1 by USD. Hold, spend, or send it anywhere.
                    </p>
                  </div>
                </div>
              </div>

              <ActionButton
                onClick={handleBuyUSDC}
                variant="secondary"
                className="p-[0.625rem] rounded-[0.75rem] gap-1 w-full"
              >
                Buy USDC <FiChevronRight className="text-lg" />
              </ActionButton>

              <button
                onClick={handleSkipToHome}
                className="text-sm text-muted-foreground hover:text-text-default transition-colors"
              >
                I'll do this later
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function WalletCreated() {
  return (
    <div className="w-full flex flex-col items-center">
      <SlCheck className="text-4xl text-success" />
      <p className="font-medium text-lg text-center mt-2">
        Your account is ready
      </p>
      <p className="text-muted-foreground text-center">
        You're one step away from holding dollars
      </p>
    </div>
  );
}

function WalletCreating() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center my-2">
        <RiftLoader message="Setting up your account..." />
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
