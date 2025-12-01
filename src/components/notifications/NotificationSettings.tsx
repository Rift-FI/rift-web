import React, { useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className,
}) => {
  // Use try-catch to handle HMR issues gracefully
  let notificationContext;
  try {
    notificationContext = useNotifications();
  } catch (error) {
    // During HMR, context might not be available yet
    console.error("NotificationContext not available:", error);
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">
            Loading notification settings...
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            If this persists, please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const {
    isEnabled,
    isLoading,
    deviceId,
    enableNotifications,
    disableNotifications,
    checkStatus,
  } = notificationContext;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleEnableNotifications = async () => {
    setIsProcessing(true);
    try {
      const result = await enableNotifications();
      if (result.success) {
        toast.success("Notifications enabled successfully! 🎉", {
          description:
            "You'll now receive updates about your transactions and activities.",
        });
      } else {
        toast.error("Failed to enable notifications", {
          description:
            result.error ||
            "Please make sure you've granted permission in your browser.",
        });
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsProcessing(true);
    try {
      const success = await disableNotifications();
      if (success) {
        toast.success("Notifications disabled", {
          description: "You won't receive any more notifications.",
        });
      } else {
        toast.error("Failed to disable notifications", {
          description: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error disabling notifications:", error);
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = async () => {
    setIsProcessing(true);
    try {
      await checkStatus();
      toast.success("Notification status refreshed");
    } catch (error) {
      console.error("Error refreshing status:", error);
      toast.error("Failed to refresh");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Push Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Stay updated with instant notifications about your transactions,
          payments, and account activities.
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              Notifications {isEnabled ? "Enabled" : "Disabled"}
            </span>
            {isEnabled && deviceId && (
              <span className="text-sm text-muted-foreground">
                Device connected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || isProcessing}
              >
                Refresh
              </Button>
            )}

            <Button
              variant={isEnabled ? "destructive" : "default"}
              size="sm"
              onClick={
                isEnabled
                  ? handleDisableNotifications
                  : handleEnableNotifications
              }
              disabled={isLoading || isProcessing}
            >
              {isLoading || isProcessing
                ? "Loading..."
                : isEnabled
                ? "Disable"
                : "Enable"}
            </Button>
          </div>
        </div>

        {!isEnabled && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Enable notifications to receive:
            </p>
            <ul className="mt-2 ml-4 text-sm text-blue-800 dark:text-blue-200 list-disc">
              <li>Payment confirmations</li>
              <li>Transaction updates</li>
              <li>Security alerts</li>
              <li>Account activities</li>
            </ul>
          </div>
        )}

        {isEnabled && deviceId && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-2">Device Information:</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between p-2 bg-muted rounded-md text-sm">
                  <div className="flex flex-col gap-1">
                  <span className="font-medium">This Device</span>
                    <span className="text-xs text-muted-foreground">
                    ID: {deviceId.substring(0, 12)}...
                  </span>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
