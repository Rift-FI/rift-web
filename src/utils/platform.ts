import { useLaunchParams } from "@telegram-apps/sdk-react";

export type PlatformType = "telegram" | "browser";

// Type declaration for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

/**
 * Detects if the app is running in Telegram or browser (non-hook version)
 * @returns 'telegram' if running in Telegram, 'browser' if running in browser
 */
export function detectPlatformSync(): PlatformType {
  // Check if we're in development mode with mocked Telegram
  if (import.meta.env.MODE === "development") {
    const testBrowserMode = import.meta.env.VITE_TEST_BROWSER_MODE === "true";
    return testBrowserMode ? "browser" : "telegram";
  }

  // Check if Telegram WebApp is available
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return "telegram";
  }

  return "browser";
}

/**
 * Detects if the app is running in Telegram or browser (legacy - uses hooks)
 * @returns 'telegram' if running in Telegram, 'browser' if running in browser
 */
export function detectPlatform(): PlatformType {
  return detectPlatformSync();
}

/**
 * Hook to detect platform and provide platform-specific information
 */
export function usePlatformDetection() {
  const platform = detectPlatformSync();

  let initData = null;
  let telegramUser = null;

  // Only try to get Telegram data if we're in Telegram environment
  if (platform === "telegram") {
    try {
      const launchParams = useLaunchParams();
      initData = launchParams.initData;
      telegramUser = initData?.user;
    } catch (error) {
      console.warn(
        "Failed to get Telegram launch params in usePlatformDetection:",
        error
      );
      // If we can't get launch params but platform detection says telegram,
      // it might be a mocked environment or initialization issue
      // In this case, we'll continue without telegram user data
    }
  }

  return {
    platform,
    initData,
    telegramUser,
    isTelegram: platform === "telegram",
    isBrowser: platform === "browser",
  };
}

/**
 * Safe hook to get telegram launch params only when in telegram environment
 * Returns null if not in telegram or if there's an error
 */
export function useSafeLaunchParams() {
  const platform = detectPlatformSync();

  if (platform === "browser") {
    return null;
  }

  try {
    return useLaunchParams();
  } catch (error) {
    console.warn("Failed to get launch params in useSafeLaunchParams:", error);
    return null;
  }
}

/**
 * Get the appropriate external ID based on platform
 * @param phoneNumber - Phone number for browser authentication
 * @param telegramId - Telegram user ID for Telegram authentication
 * @returns The external ID to use for authentication
 */
export function getExternalId(
  phoneNumber?: string,
  telegramId?: string
): string {
  const platform = detectPlatformSync();

  if (platform === "telegram" && telegramId) {
    return telegramId;
  }

  if (platform === "browser" && phoneNumber) {
    return phoneNumber;
  }

  throw new Error(
    `Cannot determine external ID. Platform: ${platform}, phoneNumber: ${phoneNumber}, telegramId: ${telegramId}`
  );
}
