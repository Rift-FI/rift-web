import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a desktop device
 * Uses screen size, user agent, and touch capabilities
 */
export function useDesktopDetection() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent || navigator.vendor;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const hasMouse = window.matchMedia("(pointer: fine)").matches;

      // Desktop indicators
      const desktopOS = /Windows NT|Macintosh|Linux.*X11/i.test(userAgent);
      const desktopBrowser =
        /Chrome|Firefox|Safari|Edge|Opera/i.test(userAgent) &&
        !/Mobile|Android|iPhone|iPad/i.test(userAgent);
      const largeScreen = width >= 1024 && height >= 600;
      const noTouch = !hasTouch;

      // Consider desktop if:
      // - Large screen (>= 1024px) AND (no touch OR has mouse)
      // - OR desktop OS detected with large screen
      const isDesktopDevice =
        (largeScreen && (noTouch || hasMouse)) ||
        (desktopOS && desktopBrowser && largeScreen);

      setIsDesktop(isDesktopDevice);
    };

    // Check on mount
    checkDesktop();

    // Check on resize
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return isDesktop;
}

export default useDesktopDetection;
