import { useLaunchParams } from "@telegram-apps/sdk-react";

export type PlatformType = "telegram" | "browser";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export function detectPlatformSync(): PlatformType {
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

  return {
    platform,
    initData,
    telegramUser,
    isTelegram: platform === "telegram",
    isBrowser: platform === "browser",
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
