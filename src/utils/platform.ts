import { useLaunchParams } from "@telegram-apps/sdk-react";

export type PlatformType = "telegram" | "browser" | "farcaster";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
    farcaster?: {
      isConnected?: boolean;
      user?: any;
    };
  }
}

export function detectPlatformSync(): PlatformType {
  // Check for Farcaster first (highest priority)
  if (typeof window !== "undefined") {
    // Farcaster detection: check for miniapp context or URL parameters
    const isFarcasterFrame = window.location.href.includes('farcaster.xyz') || 
                             window.location.href.includes('warpcast.com') ||
                             window.parent !== window; // Running in iframe (common for miniapps)
    
    if (isFarcasterFrame || window.farcaster?.isConnected) {
      return "farcaster";
    }
  }

  if (import.meta.env.MODE === "development") {
    const testBrowserMode = import.meta.env.VITE_TEST_BROWSER_MODE === "true";
    return testBrowserMode ? "browser" : "telegram";
  }

  if (import.meta.env.MODE === "production") {
    const prodBrowserMode = import.meta.env.VITE_PROD_BROWSER_MODE === "true";
    return prodBrowserMode ? "browser" : "telegram";
  }

  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return "telegram";
  }

  return "browser";
}

export function detectPlatform(): PlatformType {
  return detectPlatformSync();
}

export function usePlatformDetection() {
  const platform = detectPlatformSync();

  let initData = null;
  let telegramUser = null;
  let farcasterUser = null;

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
    }
  }

  if (platform === "farcaster" && typeof window !== "undefined") {
    farcasterUser = window.farcaster?.user || null;
  }

  return {
    platform,
    initData,
    telegramUser,
    farcasterUser,
    isTelegram: platform === "telegram",
    isBrowser: platform === "browser",
    isFarcaster: platform === "farcaster",
  };
}

export function useSafeLaunchParams() {
  const platform = detectPlatformSync();

  if (platform === "browser") {
    return null;
  }

  try {
    return useLaunchParams();
  } catch (error) {
    console.warn(
      "Failed to retrieve launch params, probably using outside of Telegram"
    );
    return null;
  }
}
