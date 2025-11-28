/**
 * Pusher Beams Notification Service
 *
 * Handles push notifications using Pusher Beams
 * Works on PWA (Android, iOS, Desktop)
 */

import * as PusherPushNotifications from "@pusher/push-notifications-web";
import {
  pusherBeamsConfig,
  validatePusherConfig,
  isPusherBeamsSupported,
} from "../config/pusher-beams";
import rift from "@/lib/rift";

export type NotificationPermission = "default" | "granted" | "denied";

export interface PusherBeamsNotificationService {
  isSupported(): boolean;
  getPermission(): NotificationPermission | null;
  enableNotifications(
    userId: string
  ): Promise<{ success: boolean; error?: string; deviceId?: string }>;
  disableNotifications(): Promise<{ success: boolean; error?: string }>;
  isInitialized(): boolean;
}

class PusherBeamsNotificationServiceImpl
  implements PusherBeamsNotificationService
{
  private beamsClient: any = null;
  private initialized: boolean = false;

  constructor() {
    console.log("🚀 [Pusher Beams] Service initialized");
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return isPusherBeamsSupported();
  }

  /**
   * Get current notification permission
   */
  getPermission(): NotificationPermission | null {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }
    return Notification.permission;
  }

  /**
   * Check if Beams client is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.beamsClient !== null;
  }

  /**
   * Initialize Pusher Beams client
   */
  private async initializeBeamsClient(): Promise<boolean> {
    try {
      if (this.initialized && this.beamsClient) {
        console.log("✅ [Pusher Beams] Already initialized");
        return true;
      }

      // Validate configuration
      if (!validatePusherConfig()) {
        console.error("❌ [Pusher Beams] Invalid configuration");
        return false;
      }

      // Check browser support
      if (!this.isSupported()) {
        console.warn("⚠️ [Pusher Beams] Not supported in this browser");
        return false;
      }

      // Initialize Beams client (it will handle service worker registration)
      console.log("📝 [Pusher Beams] Initializing client...");
      this.beamsClient = new PusherPushNotifications.Client({
        instanceId: pusherBeamsConfig.instanceId,
      });

      this.initialized = true;
      console.log("✅ [Pusher Beams] Client initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ [Pusher Beams] Failed to initialize:", error);
      this.initialized = false;
      this.beamsClient = null;
      return false;
    }
  }

  /**
   * Enable push notifications for a user
   * @param userId - The user ID to register for notifications
   */
  async enableNotifications(
    userId: string
  ): Promise<{ success: boolean; error?: string; deviceId?: string }> {
    try {
      console.log(
        "🔔 [Pusher Beams] Starting enable process for user:",
        userId
      );

      // Ensure user is authenticated - check bearer token like Rift SDK does
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        console.error("❌ [Pusher Beams] No authentication token found");
        return {
          success: false,
          error: "Please log in to enable notifications",
        };
      }

      // Set bearer token on Rift SDK (same pattern as other hooks)
      rift.setBearerToken(authToken);

      if (!userId || userId.trim() === "") {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      // Check browser support
      if (!this.isSupported()) {
        return {
          success: false,
          error: "Push notifications are not supported in this browser",
        };
      }

      // Initialize Beams client if not already initialized
      if (!this.isInitialized()) {
        const initialized = await this.initializeBeamsClient();
        if (!initialized) {
          return {
            success: false,
            error: "Failed to initialize notification service",
          };
        }
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("⚠️ [Pusher Beams] Permission denied");
        return {
          success: false,
          error:
            "Notification permission was denied. Please allow notifications in your browser settings.",
        };
      }

      console.log("✅ [Pusher Beams] Permission granted");

      // Start registration with Beams
      console.log("📝 [Pusher Beams] Starting registration...");
      console.log(
        "📝 [Pusher Beams] Instance ID:",
        pusherBeamsConfig.instanceId
      );

      await this.beamsClient!.start();
      console.log("✅ [Pusher Beams] Client started successfully");

      // Add user ID as device interest (used for targeted notifications)
      console.log(`📝 [Pusher Beams] Adding user interest: ${userId}`);
      await this.beamsClient!.addDeviceInterest(userId);
      console.log(`✅ [Pusher Beams] Interest added: ${userId}`);

      // Get device ID
      const deviceId = await this.beamsClient!.getDeviceId();
      console.log(`✅ [Pusher Beams] Device registered with ID: ${deviceId}`);

      // Verify interests were added
      const interests = await this.beamsClient!.getDeviceInterests();
      console.log(`✅ [Pusher Beams] Current interests:`, interests);

      // Register userId as subscriberId in backend using Rift SDK
      // ✅ IMPORTANT: Use userId (interest), not deviceId
      try {
        await rift.notifications.registerSubscription({
          subscriberId: userId, // ✅ Use userId (interest), not deviceId
          platform: "web",
          deviceInfo: `${this.getDeviceInfo()} (${deviceId})`,
        });
        console.log("✅ [Pusher Beams] Registered with backend");
        console.log("✅ [Pusher Beams] Subscribed to interest:", userId);
      } catch (error) {
        console.error("⚠️ [Pusher Beams] Failed to save to backend:", error);
        // Don't fail the entire process if backend save fails
      }

      return {
        success: true,
        deviceId: deviceId || undefined,
      };
    } catch (error: any) {
      console.error("❌ [Pusher Beams] Failed to enable notifications:", error);
      return {
        success: false,
        error: error.message || "Failed to enable push notifications",
      };
    }
  }

  /**
   * Disable push notifications
   */
  async disableNotifications(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("🔕 [Pusher Beams] Disabling notifications...");

      if (!this.isInitialized() || !this.beamsClient) {
        console.warn(
          "⚠️ [Pusher Beams] Client not initialized, nothing to disable"
        );
        return { success: true };
      }

      // Stop Beams client
      await this.beamsClient.stop();
      console.log("✅ [Pusher Beams] Notifications disabled");

      return { success: true };
    } catch (error: any) {
      console.error(
        "❌ [Pusher Beams] Failed to disable notifications:",
        error
      );
      return {
        success: false,
        error: error.message || "Failed to disable notifications",
      };
    }
  }

  /**
   * Clear all device interests
   */
  async clearAllInterests(): Promise<void> {
    try {
      if (this.isInitialized() && this.beamsClient) {
        await this.beamsClient.clearAllState();
        console.log("✅ [Pusher Beams] Cleared all interests");
      }
    } catch (error) {
      console.error("❌ [Pusher Beams] Failed to clear interests:", error);
    }
  }

  /**
   * Get current device interests
   */
  async getDeviceInterests(): Promise<string[]> {
    try {
      if (this.isInitialized() && this.beamsClient) {
        const interests = await this.beamsClient.getDeviceInterests();
        return interests || [];
      }
      return [];
    } catch (error) {
      console.error("❌ [Pusher Beams] Failed to get interests:", error);
      return [];
    }
  }

  /**
   * Get device ID
   */
  async getDeviceId(): Promise<string | null> {
    try {
      if (this.isInitialized() && this.beamsClient) {
        return await this.beamsClient.getDeviceId();
      }
      return null;
    } catch (error) {
      console.error("❌ [Pusher Beams] Failed to get device ID:", error);
      return null;
    }
  }

  /**
   * Get device info for registration
   */
  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let os = "Unknown";

    // Detect browser
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edge")) browser = "Edge";

    // Detect OS
    if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS")) os = "iOS";

    return `${browser} on ${os}`;
  }

  /**
   * Debug: Get full notification status
   */
  async debugStatus(): Promise<void> {
    console.log("🔍 [Pusher Beams] Debug Status:");
    console.log("- Browser support:", this.isSupported());
    console.log("- Initialized:", this.isInitialized());
    console.log("- Permission:", this.getPermission());
    console.log("- Instance ID:", pusherBeamsConfig.instanceId);

    if (this.isInitialized()) {
      const deviceId = await this.getDeviceId();
      const interests = await this.getDeviceInterests();
      console.log("- Device ID:", deviceId);
      console.log("- Interests:", interests);
      console.log("- Device Info:", this.getDeviceInfo());
    }
  }
}

// Export singleton instance
export const pusherBeamsNotificationService =
  new PusherBeamsNotificationServiceImpl();
