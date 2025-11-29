import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  pusherBeamsNotificationService,
  PusherBeamsNotificationService,
} from "@/services/pusher-beams-notifications";
import rift from "@/lib/rift";

interface NotificationContextType {
  isEnabled: boolean;
  isLoading: boolean;
  deviceId: string | null;
  enableNotifications: () => Promise<{ success: boolean; error?: string }>;
  disableNotifications: () => Promise<boolean>;
  notificationService: PusherBeamsNotificationService;
  checkStatus: () => Promise<void>;
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
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Check notification status on mount
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const permission = pusherBeamsNotificationService.getPermission();
      setIsEnabled(permission === "granted");

      // If initialized, get device ID
      if (pusherBeamsNotificationService.isInitialized()) {
        const id = await pusherBeamsNotificationService.getDeviceId();
        setDeviceId(id);
      }
    } catch (error) {
      console.error(
        "❌ [NotificationContext] Failed to check notification status:",
        error
      );
    }
  };

  const enableNotifications = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    setIsLoading(true);
    try {
      // Ensure user is authenticated and set bearer token
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        return {
          success: false,
          error: "Please log in to enable notifications",
        };
      }

      // Set bearer token (same pattern as other hooks)
      rift.setBearerToken(authToken);

      // Get user ID from Rift SDK
      const userResponse = await rift.auth.getUser();
      const user = (userResponse as any).user;
      const userId = user?.id || user?.externalId;

      if (!userId) {
        return {
          success: false,
          error: "Please log in to enable notifications",
        };
      }

      // Enable notifications with user ID as the interest
      const result = await pusherBeamsNotificationService.enableNotifications(
        userId
      );

      if (result.success) {
        setIsEnabled(true);
        setDeviceId(result.deviceId || null);

        console.log(
          "✅ [NotificationContext] Notifications enabled successfully"
        );
        console.log(`📱 [NotificationContext] Device ID: ${result.deviceId}`);
        console.log(`👤 [NotificationContext] User Interest: ${userId}`);
      }

      return result;
    } catch (error: any) {
      console.error(
        "❌ [NotificationContext] Failed to enable notifications:",
        error
      );
      return {
        success: false,
        error:
          error.message || "An unexpected error occurred. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result =
        await pusherBeamsNotificationService.disableNotifications();

      if (result.success) {
        setIsEnabled(false);
        setDeviceId(null);
        console.log("✅ [NotificationContext] Notifications disabled");
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        "❌ [NotificationContext] Failed to disable notifications:",
        error
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    await checkNotificationStatus();
  };

  const value: NotificationContextType = {
    isEnabled,
    isLoading,
    deviceId,
    enableNotifications,
    disableNotifications,
    notificationService: pusherBeamsNotificationService,
    checkStatus,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
