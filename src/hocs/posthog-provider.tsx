import { useEffect } from "react";
import { analyticsLog } from "../analytics/events";
import { usePlatformDetection } from "@/utils/platform";

export const AnalyticsListener = () => {
  const { isTelegram, telegramUser } = usePlatformDetection();

  useEffect(() => {
    if (isTelegram) {
      analyticsLog("APP_LAUNCH", {
        telegram_id: telegramUser?.id?.toString() ?? "NO_USER_IDENTIFIED",
      });
    }
  }, []);

  return <></>;
};