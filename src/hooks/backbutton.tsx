import { useEffect, useCallback } from "react";
import { backButton } from "@telegram-apps/sdk-react";

export const useBackButton = (goBack: () => void) => {
  const memoizedGoBack = useCallback(goBack, []);

  const clearDeepLinkParams = () => {
    let starttab = localStorage.getItem("starttab");
    let startpage = localStorage.getItem("startpage");

    if (starttab !== null) localStorage.removeItem("starttab");
    if (startpage !== null) localStorage.removeItem("startpage");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(memoizedGoBack);
    }

    return () => {
      clearDeepLinkParams();
      backButton.offClick(memoizedGoBack);
      backButton.unmount();
    };
  }, [memoizedGoBack]);
};
