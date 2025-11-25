import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";
import { X, Bell } from "lucide-react";

interface NotificationPromptProps {
  onClose?: () => void;
}

/**
 * Prompt component to encourage users to enable notifications
 * Show this after successful login/signup
 */
export const NotificationPrompt: React.FC<NotificationPromptProps> = ({
  onClose,
}) => {
  const { isEnabled, enableNotifications } = useNotifications();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this prompt
    const dismissed = localStorage.getItem("notificationPromptDismissed");
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Don't show if already enabled or dismissed
  if (isEnabled || isDismissed) {
    return null;
  }

  const handleEnable = async () => {
    setIsProcessing(true);
    try {
      const result = await enableNotifications();
      if (result.success) {
        onClose?.();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    // Remember that user dismissed this
    localStorage.setItem("notificationPromptDismissed", "true");
    setIsDismissed(true);
    onClose?.();
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Stay Updated!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Get instant notifications for payments, transactions, and important
            updates.
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? "Enabling..." : "Enable Notifications"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
