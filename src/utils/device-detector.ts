/**
 * Device detection utilities for KYC flow
 * Enhanced detection to properly identify desktop vs mobile devices
 */

export function isMobileDevice(): boolean {
  // Check for manual override
  const override = localStorage.getItem("kyc-device-override");
  if (override === "force-mobile") return true;
  if (override === "force-desktop") return false;

  // More comprehensive user agent check
  const userAgent = navigator.userAgent || navigator.vendor;

  // First, check for definite mobile devices
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  if (mobileRegex.test(userAgent)) {
    return true;
  }

  // Check for desktop browsers (these are definitely NOT mobile)
  const desktopRegex = /Windows NT|Macintosh|Linux.*X11/i;
  if (desktopRegex.test(userAgent)) {
    return false;
  }

  // Additional checks for screen and touch capabilities
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Desktop indicators
  const isLikelyDesktop =
    screenWidth >= 1024 && screenHeight >= 768 && !hasTouch;

  if (isLikelyDesktop) {
    return false;
  }

  // Mobile indicators - small screen with touch
  const isLikelyMobile = screenWidth < 768 && hasTouch;

  if (isLikelyMobile) {
    return true;
  }

  // Default to mobile for ambiguous cases (safer for KYC)
  return true;
}

export function isDefinitelyDesktop(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor;

  // Check for desktop operating systems
  const desktopOS = /Windows NT|Macintosh|Linux.*X11/i.test(userAgent);

  // Check for desktop browsers
  const desktopBrowser =
    /Chrome|Firefox|Safari|Edge|Opera/i.test(userAgent) &&
    !/Mobile|Android|iPhone|iPad/i.test(userAgent);

  // Check screen size (desktop typically has larger screens)
  const largeScreen = window.innerWidth >= 1200 && window.innerHeight >= 800;

  // Check for lack of touch (most desktops don't have touch)
  const noTouch = !("ontouchstart" in window) && navigator.maxTouchPoints === 0;

  // Check for mouse (desktop indicator)
  const hasMouse = window.matchMedia("(pointer: fine)").matches;

  // Combine checks - need at least 2-3 positive indicators
  const desktopIndicators = [
    desktopOS,
    desktopBrowser,
    largeScreen,
    noTouch,
    hasMouse,
  ];
  const positiveIndicators = desktopIndicators.filter(Boolean).length;

  return positiveIndicators >= 3;
}

export function hasCamera(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      resolve(false);
      return;
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const hasVideoInput = devices.some(
          (device) => device.kind === "videoinput"
        );
        resolve(hasVideoInput);
      })
      .catch(() => resolve(false));
  });
}

export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = navigator.userAgent || navigator.vendor;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Definite desktop indicators
  if (isDefinitelyDesktop()) {
    return "desktop";
  }

  // iPhone/iPod are always mobile
  if (/iPhone|iPod/.test(userAgent)) {
    return "mobile";
  }

  // iPad is tablet
  if (/iPad/.test(userAgent)) {
    return "tablet";
  }

  // Android device classification
  if (/Android/.test(userAgent)) {
    if (width < 600) return "mobile";
    if (width >= 600 && width < 1024) return "tablet";
    return "tablet"; // Large Android devices are typically tablets
  }

  // Fallback based on screen size and capabilities
  if (width < 600) {
    return "mobile";
  } else if (width >= 600 && width < 1024) {
    return hasTouch ? "tablet" : "desktop";
  } else {
    return hasTouch && width < 1200 ? "tablet" : "desktop";
  }
}

export function shouldShowQRCode(): boolean {
  // Check for manual override
  const override = localStorage.getItem("kyc-device-override");
  if (override === "force-desktop") return true;
  if (override === "force-mobile") return false;

  // Show QR code if it's definitely a desktop or large non-touch screen
  return (
    isDefinitelyDesktop() ||
    (window.innerWidth >= 1200 &&
      window.innerHeight >= 800 &&
      !("ontouchstart" in window))
  );
}
