import { useEffect, useCallback } from "react";
import { backButton } from "@telegram-apps/sdk-react";

export const useBackButton = (goBack: () => void) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedGoBack = useCallback(goBack, []);

  const clearDeepLinkParams = () => {
    const starttab = localStorage.getItem("starttab");
    const startpage = localStorage.getItem("startpage");
    const prev_page = localStorage.getItem("prev_page");

    if (starttab !== null) localStorage.removeItem("starttab");
    if (startpage !== null) localStorage.removeItem("startpage");
    if (prev_page !== null) localStorage.removeItem("prev_page");
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
