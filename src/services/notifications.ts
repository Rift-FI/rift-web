import rift from "@/lib/rift";

// Extend Window interface to include webpushr
declare global {
  interface Window {
    webpushr?: (command: string, ...args: any[]) => void;
    _webpushrScriptReady?: () => void;
  }
}

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

export class NotificationService {
  private isWebpushrReady = false;
  private webpushrInitPromise: Promise<void> | null = null;

  constructor() {
    // Initialize webpushr check on construction
    this.webpushrInitPromise = this.initializeWebpushr();
  }

  /**
   * Ensure authentication token is set
   */
  private ensureAuthenticated(): boolean {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      console.error("❌ [Notifications] No authentication token found");
      return false;
    }
    rift.setBearerToken(authToken);
    return true;
  }

  /**
   * Initialize and wait for Webpushr to be fully ready
   */
  private async initializeWebpushr(): Promise<void> {
    if (typeof window === "undefined") {
      console.warn(
        "NotificationService: Window is not available (SSR context)"
      );
      return;
    }

    // Wait for webpushr script to load and setup to complete
    await this.waitForWebpushrScript();

    // Additional wait to ensure webpushr internal initialization
    await this.waitForWebpushrReady();

    this.isWebpushrReady = true;
    console.log("✅ [Notifications] Webpushr fully initialized");
  }

  /**
   * Wait for Webpushr script to be loaded
   */
  private async waitForWebpushrScript(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (typeof window.webpushr === "function") {
          console.log("✅ [Notifications] Webpushr script loaded");
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn("⚠️ [Notifications] Webpushr script load timeout");
        resolve();
      }, 10000);
    });
  }

  /**
   * Wait for Webpushr to be fully ready after script load
   */
  private async waitForWebpushrReady(): Promise<void> {
    return new Promise((resolve) => {
      if (!window.webpushr) {
        resolve();
        return;
      }

      let checkCount = 0;
      const maxChecks = 30; // 3 seconds total

      const checkReady = () => {
        checkCount++;

        try {
          // Try to fetch ID to verify webpushr is ready
          // This should work even if user hasn't subscribed yet
          window.webpushr!("fetch_id", (sid: string | null) => {
            // If this callback executes without error, webpushr is ready
            console.log("✅ [Notifications] Webpushr ready check passed");
            resolve();
          });
        } catch (error) {
          // If error occurs, webpushr isn't ready yet
          if (checkCount < maxChecks) {
            setTimeout(checkReady, 100);
          } else {
            console.warn("⚠️ [Notifications] Webpushr ready check timeout");
            resolve();
          }
        }
      };

      // Start checking after a small delay to let setup complete
      setTimeout(checkReady, 500);
    });
  }

  /**
   * Ensure Webpushr is ready before using
   */
  private async ensureWebpushrReady(): Promise<boolean> {
    if (this.isWebpushrReady) {
      return true;
    }

    if (this.webpushrInitPromise) {
      await this.webpushrInitPromise;
    } else {
      await this.initializeWebpushr();
    }

    return this.isWebpushrReady;
  }

  /**
   * Check if notifications are supported in this browser
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  /**
   * Get current browser notification permission
   */
  getPermission(): NotificationPermission | null {
    if (!this.isSupported()) return null;
    return Notification.permission;
  }

  /**
   * Enable notifications for the current user
   * @returns Object with success status and error details if applicable
   */
  async enableNotifications(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("🔔 [Notifications] Starting enable process...");

      // Ensure user is authenticated
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: "Please log in to enable notifications",
        };
      }

      // Ensure Webpushr is fully ready
      console.log("⏳ [Notifications] Ensuring Webpushr is ready...");
      const isReady = await this.ensureWebpushrReady();

      if (
        !isReady ||
        !window.webpushr ||
        typeof window.webpushr !== "function"
      ) {
        console.error(
          "❌ [Notifications] Webpushr not available after initialization"
        );
        return {
          success: false,
          error:
            "Notification service failed to load. Please refresh the page and try again.",
        };
      }

      // Check if already subscribed
      const existingSubscriptions = await this.getSubscriptions();
      if (existingSubscriptions.activeCount > 0) {
        console.log("✅ [Notifications] User already has active subscriptions");
        return { success: true };
      }

      // Request permission and subscribe
      const permissionResult = await this.requestPermission();

      if (permissionResult.denied) {
        console.log("⚠️ [Notifications] User denied notification permission");
        return {
          success: false,
          error:
            "You blocked notifications. To enable them, please allow notifications in your browser settings.",
        };
      }

      if (!permissionResult.granted) {
        console.log("⚠️ [Notifications] Permission not granted");
        return {
          success: false,
          error: "Notification permission was not granted. Please try again.",
        };
      }

      // Wait a bit for Webpushr to process the subscription
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get subscriber ID from Webpushr
      const subscriberId = await this.getWebpushrSubscriberId();
      console.log("🔑 [Notifications] Subscriber ID obtained:", subscriberId);

      // Register with Rift
      const response = await rift.notifications.registerSubscription({
        subscriberId,
        deviceInfo: this.getDeviceInfo(),
        platform: this.getPlatform(),
      });

      if (response.success) {
        this.saveSubscriptionLocally(response.data?.subscription);
        console.log("✅ [Notifications] Enabled successfully!");
        return { success: true };
      }

      console.error(
        "❌ [Notifications] Failed to register subscription:",
        response.message
      );
      return {
        success: false,
        error:
          "Failed to register with notification service. Please try again.",
      };
    } catch (error: any) {
      console.error(
        "❌ [Notifications] Failed to enable notifications:",
        error
      );
      return {
        success: false,
        error:
          error?.message || "An unexpected error occurred. Please try again.",
      };
    }
  }

  /**
   * Request notification permission from the user
   */
  private async requestPermission(): Promise<{
    granted: boolean;
    denied: boolean;
  }> {
    // Check current permission state first
    const currentPermission = Notification.permission;

    if (currentPermission === "denied") {
      console.log("🚫 [Notifications] Permission already denied by user");
      return { granted: false, denied: true };
    }

    // Use Webpushr's subscribe method which handles everything
    console.log("🔔 [Notifications] Subscribing via Webpushr...");

    if (!window.webpushr || typeof window.webpushr !== "function") {
      console.error("❌ [Notifications] Webpushr not available");
      return { granted: false, denied: false };
    }

    try {
      // Let Webpushr handle permission request and subscription
      const result = await new Promise<{ granted: boolean; denied: boolean }>(
        (resolve, reject) => {
          try {
            // Wrap the webpushr call in try-catch to handle any synchronous errors
            window.webpushr!("subscribe", (status: string) => {
              console.log(
                "🔔 [Notifications] Webpushr subscribe result:",
                status
              );

              const finalPermission = Notification.permission;
              resolve({
                granted: finalPermission === "granted",
                denied: finalPermission === "denied",
              });
            });
          } catch (error) {
            console.error(
              "❌ [Notifications] Error calling webpushr subscribe:",
              error
            );
            // Try fallback to direct browser API if webpushr fails
            Notification.requestPermission()
              .then((permission) => {
                resolve({
                  granted: permission === "granted",
                  denied: permission === "denied",
                });
              })
              .catch(reject);
          }
        }
      );

      return result;
    } catch (error) {
      console.error("❌ [Notifications] Error during subscription:", error);
      // Fallback: Try direct browser permission request
      try {
        const permission = await Notification.requestPermission();
        return {
          granted: permission === "granted",
          denied: permission === "denied",
        };
      } catch (fallbackError) {
        console.error(
          "❌ [Notifications] Fallback permission request failed:",
          fallbackError
        );
        return { granted: false, denied: false };
      }
    }
  }

  /**
   * Get the Webpushr subscriber ID with retry logic
   */
  private async getWebpushrSubscriberId(): Promise<string> {
    // Ensure webpushr is ready
    const isReady = await this.ensureWebpushrReady();

    if (!isReady || !window.webpushr || typeof window.webpushr !== "function") {
      throw new Error("Webpushr not available");
    }

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 10;

      const tryFetchId = () => {
        attempts++;

        try {
          window.webpushr!("fetch_id", (sid: string | null) => {
            console.log(
              "🆔 [Notifications] Subscriber ID fetched:",
              sid ? "✓" : "✗"
            );
            if (sid) {
              resolve(sid);
            } else if (attempts < maxAttempts) {
              console.log(
                `⏳ [Notifications] No ID yet, retrying (${attempts}/${maxAttempts})...`
              );
              setTimeout(tryFetchId, 1000);
            } else {
              // If no ID after retries, it might mean the user isn't subscribed yet
              // Try to get permission status to provide better error
              const permission = Notification.permission;
              if (permission !== "granted") {
                reject(new Error("Notification permission not granted"));
              } else {
                reject(
                  new Error(
                    "No subscriber ID available after multiple attempts"
                  )
                );
              }
            }
          });
        } catch (error) {
          console.error(
            "❌ [Notifications] Error fetching subscriber ID:",
            error
          );
          if (attempts < maxAttempts) {
            // Retry on error
            setTimeout(tryFetchId, 1000);
          } else {
            reject(error);
          }
        }
      };

      tryFetchId();
    });
  }

  /**
   * Get all user subscriptions
   */
  async getSubscriptions(): Promise<UserSubscriptionsData> {
    try {
      if (!this.ensureAuthenticated()) {
        return { subscriptions: [], activeCount: 0, totalCount: 0 };
      }

      const response = await rift.notifications.getUserSubscriptions();
      console.log("📋 [Notifications] Subscriptions fetched:", response.data);
      return (
        response.data || { subscriptions: [], activeCount: 0, totalCount: 0 }
      );
    } catch (error) {
      console.error("❌ [Notifications] Failed to get subscriptions:", error);
      return { subscriptions: [], activeCount: 0, totalCount: 0 };
    }
  }

  /**
   * Unsubscribe a specific device
   */
  async unsubscribe(subscriberId: string): Promise<boolean> {
    try {
      if (!this.ensureAuthenticated()) {
        return false;
      }

      const response = await rift.notifications.unsubscribe(subscriberId);
      if (response.success) {
        console.log("✅ [Notifications] Successfully unsubscribed");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ [Notifications] Failed to unsubscribe:", error);
      return false;
    }
  }

  /**
   * Delete all user subscriptions
   */
  async deleteAllSubscriptions(): Promise<number> {
    try {
      if (!this.ensureAuthenticated()) {
        return 0;
      }

      const response = await rift.notifications.deleteAllSubscriptions();
      if (response.success && response.data) {
        console.log(
          `✅ [Notifications] Deleted ${response.data.deletedCount} subscriptions`
        );
        this.clearLocalSubscription();
        return response.data.deletedCount;
      }
      return 0;
    } catch (error) {
      console.error(
        "❌ [Notifications] Failed to delete subscriptions:",
        error
      );
      return 0;
    }
  }

  /**
   * Send a test notification
   */
  async sendTestNotification(
    subscriberId: string,
    message: string
  ): Promise<boolean> {
    try {
      if (!this.ensureAuthenticated()) {
        return false;
      }

      const response = await rift.notifications.sendTestNotification({
        subscriberId,
        title: "Test Notification",
        message,
        targetUrl: "https://wallet.riftfi.xyz/app",
      });

      const success = response.success ?? false;
      if (success) {
        console.log("✅ [Notifications] Test notification sent successfully");
      }
      return success;
    } catch (error) {
      console.error(
        "❌ [Notifications] Failed to send test notification:",
        error
      );
      return false;
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
   * Get platform type
   */
  private getPlatform(): string {
    return /mobile/i.test(navigator.userAgent) ? "mobile" : "web";
  }

  /**
   * Save subscription locally
   */
  private saveSubscriptionLocally(subscription: any) {
    if (subscription) {
      localStorage.setItem(
        "riftNotificationSubscription",
        JSON.stringify({
          id: subscription.id,
          subscriberId: subscription.subscriberId,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Clear local subscription data
   */
  private clearLocalSubscription() {
    localStorage.removeItem("riftNotificationSubscription");
  }

  /**
   * Get local subscription data
   */
  getLocalSubscription(): any | null {
    try {
      const data = localStorage.getItem("riftNotificationSubscription");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
