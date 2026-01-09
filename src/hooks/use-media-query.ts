import { useState, useEffect } from "react";

interface MediaQueryResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useMediaQuery = (): MediaQueryResult => {
  const [mediaQuery, setMediaQuery] = useState<MediaQueryResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    // define media queries for different breakpoints
    // mobile: < 768px, tablet: 768px - 1023px, desktop: >= 1024px
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const tabletQuery = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px)",
    );
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    const handleMediaChange = () => {
      setMediaQuery({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
      });
    };

    handleMediaChange();

    mobileQuery.addEventListener("change", handleMediaChange);
    tabletQuery.addEventListener("change", handleMediaChange);
    desktopQuery.addEventListener("change", handleMediaChange);

    return () => {
      mobileQuery.removeEventListener("change", handleMediaChange);
      tabletQuery.removeEventListener("change", handleMediaChange);
      desktopQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return mediaQuery;
};
