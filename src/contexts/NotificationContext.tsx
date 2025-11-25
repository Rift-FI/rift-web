import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  FCMNotificationService,
  UserSubscriptionsData,
} from "@/services/fcm-notifications";

interface NotificationContextType {
  isEnabled: boolean;
  isLoading: boolean;
  subscriptionCount: number;
  subscriptions: UserSubscriptionsData;
  enableNotifications: () => Promise<{ success: boolean; error?: string }>;
  disableNotifications: () => Promise<boolean>;
  refreshSubscriptions: () => Promise<void>;
  notificationService: FCMNotificationService;
  debugStatus: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionsData>({
    subscriptions: [],
    activeCount: 0,
    totalCount: 0,
  });
  const [notificationService] = useState(() => new FCMNotificationService());

  // Check notification status on mount (only if user is authenticated)
  useEffect(() => {
    const authToken = localStorage.getItem("token");
    if (authToken) {
      checkNotificationStatus();
    }
  }, []);

  // Listen for messages from service worker (notification clicks)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICKED") {
        console.log("Notification clicked, navigating to:", event.data.url);
        // The service worker will handle the navigation
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  const checkNotificationStatus = async () => {
    // Only check if user is authenticated
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const subs = await notificationService.getSubscriptions();
      setSubscriptions(subs);
      setIsEnabled(subs.activeCount > 0);
      setSubscriptionCount(subs.activeCount);
    } catch (error) {
      console.error(
        "❌ [NotificationContext] Failed to check notification status:",
        error
      );
      // Don't throw - fail gracefully
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscriptions = async () => {
    await checkNotificationStatus();
  };

  const enableNotifications = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    setIsLoading(true);
    try {
      const result = await notificationService.enableNotifications();
      if (result.success) {
        await checkNotificationStatus();
      }
      return result;
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const deletedCount = await notificationService.deleteAllSubscriptions();
      if (deletedCount > 0) {
        setIsEnabled(false);
        setSubscriptionCount(0);
        setSubscriptions({
          subscriptions: [],
          activeCount: 0,
          totalCount: 0,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to disable notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const debugStatus = async () => {
    await notificationService.debugSubscriptionStatus();
  };

  const value: NotificationContextType = {
    isEnabled,
    isLoading,
    subscriptionCount,
    subscriptions,
    enableNotifications,
    disableNotifications,
    refreshSubscriptions,
    notificationService,
    debugStatus,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
