import { useEffect, useCallback } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { usePlatformDetection } from "@/utils/platform";

export const useBackButton = (goBack: () => void) => {
  const { isTelegram } = usePlatformDetection();
  const memoizedGoBack = useCallback(goBack, []);

  useEffect(() => {
    if (isTelegram) {
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
    }
  }, [memoizedGoBack]);
};
