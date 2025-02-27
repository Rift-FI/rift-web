import { useEffect, useCallback } from "react";
import { backButton } from "@telegram-apps/sdk-react";

export const useBackButton = (goBack: () => void) => {
  const memoizedGoBack = useCallback(goBack, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(memoizedGoBack);
    }

    return () => {
      backButton.offClick(memoizedGoBack);
      backButton.unmount();
    };
  }, [memoizedGoBack]);
};
