/**
 * Pusher Beams Configuration
 *
 * Push notifications using Pusher Beams for PWA
 * Works on Android, iOS (PWA), and Desktop browsers
 */

export const pusherBeamsConfig = {
  instanceId:
    "a99bec59-b4a1-4182-bac9-c44b18e91162",
};

/**
 * Validate Pusher Beams configuration
 */
export const validatePusherConfig = (): boolean => {
  if (!pusherBeamsConfig.instanceId) {
    console.error("❌ [Pusher Beams] Instance ID is not configured");
    return false;
  }

  return true;
};

/**
 * Check if Pusher Beams is supported in the current browser
 */
export const isPusherBeamsSupported = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  // Check for required browser APIs
  const hasServiceWorker = "serviceWorker" in navigator;
  const hasPushManager = "PushManager" in window;
  const hasNotifications = "Notification" in window;

  return hasServiceWorker && hasPushManager && hasNotifications;
};
