import {
  getToken,
  onMessage,
  deleteToken,
  Messaging,
} from "firebase/messaging";
import { getFirebaseMessaging } from "@/config/firebase";
import rift from "@/lib/rift";

export interface NotificationSubscription {
  id: string;
  subscriberId: string;
  deviceInfo?: string;
  platform?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscriptionsData {
  subscriptions: NotificationSubscription[];
  activeCount: number;
  totalCount: number;
}

export class FCMNotificationService {
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;
  private isInitialized = false;

  constructor() {
    // Initialize Firebase Messaging
    this.initializeMessaging();
  }

  /**
   * Initialize Firebase Messaging
   */
  private async initializeMessaging() {
    try {
      this.messaging = await getFirebaseMessaging();
      if (this.messaging) {
        console.log("✅ [FCM] Messaging initialized");
        this.isInitialized = true;

        // Set up foreground message handler
        this.setupForegroundHandler();
      }
    } catch (error) {
      console.error("❌ [FCM] Failed to initialize messaging:", error);
    }
  }

  /**
   * Setup handler for foreground messages (when app is open)
   */
  private setupForegroundHandler() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log("[FCM] Foreground message received:", payload);

      // Show notification using Notification API
      if (Notification.permission === "granted") {
        const notificationTitle =
          payload.notification?.title || "New Notification";
        const notificationOptions = {
          body: payload.notification?.body || "",
          icon: payload.notification?.icon || "/icon-192x192.jpg",
          badge: "/icon-192x192.jpg",
          data: payload.data,
          tag: payload.data?.notificationId || "default",
        };

        new Notification(notificationTitle, notificationOptions);
      }
    });
  }

  /**
   * Ensure authentication token is set
   */
  private ensureAuthenticated(): boolean {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      console.error("❌ [FCM] No authentication token found");
      return false;
    }
    rift.setBearerToken(authToken);
    return true;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator
    );
  }

  /**
   * Get current notification permission
   */
  getPermission(): NotificationPermission | null {
    if (!this.isSupported()) return null;
    return Notification.permission;
  }

  /**
   * Enable notifications - Request permission and get FCM token
   */
  async enableNotifications(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("🔔 [FCM] Starting enable process...");

      // Ensure user is authenticated
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: "Please log in to enable notifications",
        };
      }

      // Check browser support
      if (!this.isSupported()) {
        return {
          success: false,
          error: "Push notifications are not supported in this browser",
        };
      }

      // Ensure messaging is initialized
      if (!this.isInitialized || !this.messaging) {
        await this.initializeMessaging();
        if (!this.messaging) {
          return {
            success: false,
            error: "Failed to initialize notification service",
          };
        }
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return {
          success: false,
          error:
            "Notification permission was denied. Please allow notifications in your browser settings.",
        };
      }

      console.log("✅ [FCM] Permission granted");

      // Get FCM token
      // IMPORTANT: Get your VAPID key from Firebase Console:
      // Project Settings > Cloud Messaging > Web Push certificates
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        console.error("❌ [FCM] VAPID key not configured");
        return {
          success: false,
          error:
            "Notification service not properly configured. Please contact support.",
        };
      }

      const token = await getToken(this.messaging, { vapidKey });

      if (!token) {
        return {
          success: false,
          error: "Failed to get notification token. Please try again.",
        };
      }

      this.currentToken = token;
      console.log("🔑 [FCM] Token obtained:", token.substring(0, 20) + "...");

      // Register token with your backend
      const response = await this.registerTokenWithBackend(token);

      if (response.success) {
        this.saveTokenLocally(token);
        console.log("✅ [FCM] Notifications enabled successfully!");
        return { success: true };
      }

      return {
        success: false,
        error: "Failed to register with notification service",
      };
    } catch (error: any) {
      console.error("❌ [FCM] Failed to enable notifications:", error);

      if (error?.code === "messaging/permission-blocked") {
        return {
          success: false,
          error:
            "Notifications are blocked. Please enable them in your browser settings.",
        };
      }

      return {
        success: false,
        error:
          error?.message || "An unexpected error occurred. Please try again.",
      };
    }
  }

  /**
   * Register FCM token with backend
   */
  private async registerTokenWithBackend(
    token: string
  ): Promise<{ success: boolean }> {
    try {
      if (!this.ensureAuthenticated()) {
        return { success: false };
      }

      // Your existing backend endpoint - it should accept FCM tokens!
      // Note: "subscriberId" is a misnomer - this is actually an FCM token
      // Your backend should ideally rename this field to "fcmToken" or "token"
      const response = await rift.notifications.registerSubscription({
        subscriberId: token, // FCM token (150-180 char string)
        deviceInfo: this.getDeviceInfo(),
        platform: "web", // Important: tells backend this is a web token
      });

      return { success: response.success ?? false };
    } catch (error) {
      console.error("❌ [FCM] Failed to register token with backend:", error);
      return { success: false };
    }
  }

  /**
   * Disable notifications
   */
  async disableNotifications(): Promise<boolean> {
    try {
      if (!this.messaging || !this.currentToken) {
        return false;
      }

      // Delete FCM token
      await deleteToken(this.messaging);

      // Notify backend
      if (this.ensureAuthenticated()) {
        await rift.notifications.deleteAllSubscriptions();
      }

      this.currentToken = null;
      this.clearLocalToken();

      console.log("✅ [FCM] Notifications disabled successfully");
      return true;
    } catch (error) {
      console.error("❌ [FCM] Failed to disable notifications:", error);
      return false;
    }
  }

  /**
   * Get all user subscriptions from backend
   */
  async getSubscriptions(): Promise<UserSubscriptionsData> {
    try {
      if (!this.ensureAuthenticated()) {
        return { subscriptions: [], activeCount: 0, totalCount: 0 };
      }

      const response = await rift.notifications.getUserSubscriptions();
      console.log("📋 [FCM] Subscriptions fetched:", response.data);
      return (
        response.data || { subscriptions: [], activeCount: 0, totalCount: 0 }
      );
    } catch (error) {
      console.error("❌ [FCM] Failed to get subscriptions:", error);
      return { subscriptions: [], activeCount: 0, totalCount: 0 };
    }
  }

  /**
   * Delete all subscriptions
   */
  async deleteAllSubscriptions(): Promise<number> {
    try {
      if (!this.ensureAuthenticated()) {
        return 0;
      }

      // Delete FCM token locally
      if (this.messaging && this.currentToken) {
        await deleteToken(this.messaging);
        this.currentToken = null;
      }

      // Notify backend
      const response = await rift.notifications.deleteAllSubscriptions();
      if (response.success && response.data) {
        console.log(
          `✅ [FCM] Deleted ${response.data.deletedCount} subscriptions`
        );
        this.clearLocalToken();
        return response.data.deletedCount;
      }
      return 0;
    } catch (error) {
      console.error("❌ [FCM] Failed to delete subscriptions:", error);
      return 0;
    }
  }

  /**
   * Send a test notification (via backend)
   */
  async sendTestNotification(
    userId: string,
    message: string
  ): Promise<boolean> {
    try {
      if (!this.ensureAuthenticated()) {
        return false;
      }

      console.log(`📤 [FCM] Sending test to user: ${userId}`);

      // Your existing backend handles this - it already works with FCM!
      const response = await rift.notifications.sendTestNotification({
        subscriberId: userId,
        title: "Test Notification",
        message,
        targetUrl: "https://wallet.riftfi.xyz/app",
      });

      const success = response.success ?? false;
      if (success) {
        console.log("✅ [FCM] Test notification sent successfully");
      } else {
        console.error("❌ [FCM] Test notification failed:", response.message);
      }
      return success;
    } catch (error) {
      console.error("❌ [FCM] Failed to send test notification:", error);
      return false;
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Debug subscription status
   */
  async debugSubscriptionStatus(): Promise<void> {
    console.log("🔍 [FCM] Debug Subscription Status");

    // Check browser permission
    const permission = Notification.permission;
    console.log(`  Browser Permission: ${permission}`);

    // Check FCM status
    console.log(`  FCM Initialized: ${this.isInitialized}`);
    console.log(
      `  Current Token: ${
        this.currentToken ? this.currentToken.substring(0, 20) + "..." : "None"
      }`
    );

    // Check backend subscriptions
    if (this.ensureAuthenticated()) {
      const subs = await this.getSubscriptions();
      console.log(
        `  Backend Subscriptions: ${subs.totalCount} total, ${subs.activeCount} active`
      );
      subs.subscriptions.forEach((sub) => {
        console.log(
          `    - ${sub.subscriberId.substring(0, 20)}... (${
            sub.isActive ? "active" : "inactive"
          }) - ${sub.deviceInfo}`
        );
      });
    }

    // Check local storage
    const localToken = this.getLocalToken();
    if (localToken) {
      console.log(`  Local Storage: ${localToken.substring(0, 20)}...`);
    } else {
      console.log("  Local Storage: No token saved");
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    // Detect browser
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    // Detect OS
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS")) os = "iOS";

    return `${browser} on ${os}`;
  }

  /**
   * Save FCM token locally
   */
  private saveTokenLocally(token: string) {
    localStorage.setItem(
      "riftFCMToken",
      JSON.stringify({
        token,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Clear local token
   */
  private clearLocalToken() {
    localStorage.removeItem("riftFCMToken");
  }

  /**
   * Get local token
   */
  getLocalToken(): string | null {
    try {
      const data = localStorage.getItem("riftFCMToken");
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
}
