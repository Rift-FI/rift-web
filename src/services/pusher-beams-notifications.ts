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
    // Service initialized
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
        return true;
      }

      // Validate configuration
      if (!validatePusherConfig()) {
        return false;
      }

      // Check browser support
      if (!this.isSupported()) {
        return false;
      }

      // Initialize Beams client (it will handle service worker registration)
      this.beamsClient = new PusherPushNotifications.Client({
        instanceId: pusherBeamsConfig.instanceId,
      });

      this.initialized = true;
      return true;
    } catch {
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
      // Ensure user is authenticated - check bearer token like Rift SDK does
      const authToken = localStorage.getItem("token");
      if (!authToken) {
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
        return {
          success: false,
          error:
            "Notification permission was denied. Please allow notifications in your browser settings.",
        };
      }

      // Start registration with Beams
      await this.beamsClient!.start();

      // Get device ID first
      const deviceId = await this.beamsClient!.getDeviceId();

      // Check if user is already authenticated (from previous session)
      const currentUserId = await this.beamsClient!.getUserId();

      if (currentUserId !== userId) {
        // Set user ID for authenticated user (allows multi-device)
        // Create token provider for authenticated users
        const apiKey = import.meta.env.VITE_SDK_API_KEY;

        if (!apiKey) {
          throw new Error("API key not configured");
        }

        const { getApiBase } = await import("@/lib/apiBase");
        const tokenProvider = new PusherPushNotifications.TokenProvider({
          url: `${getApiBase()}/notifications/pusher-beams-auth`,
          headers: {
            "x-api-key": apiKey,
            Authorization: `Bearer ${authToken}`,
          },
        });

        await this.beamsClient!.setUserId(userId, tokenProvider);
      }

      // Register userId as subscriberId in backend using Rift SDK
      try {
        await rift.notifications.registerSubscription({
          subscriberId: userId,
          platform: "web",
          deviceInfo: `${this.getDeviceInfo()} (${deviceId})`,
        });
      } catch {
        // Don't fail the entire process if backend save fails
      }

      return {
        success: true,
        deviceId: deviceId || undefined,
      };
    } catch (error: any) {
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
      if (!this.isInitialized() || !this.beamsClient) {
        return { success: true };
      }

      // Stop Beams client
      await this.beamsClient.stop();

      return { success: true };
    } catch (error: any) {
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
      }
    } catch {
      // Failed to clear interests
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
    } catch {
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
    } catch {
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
   * Debug: Get full notification status (for development only)
   */
  async debugStatus(): Promise<void> {
    // Debug method - no console output in production
  }
}

// Export singleton instance
export const pusherBeamsNotificationService =
  new PusherBeamsNotificationServiceImpl();
