import { useEffect } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { analyticsLog } from "../analytics/events";

export const AnalyticsListener = () => {
  const { initData } = useLaunchParams();

  useEffect(() => {
    if (initData) {
      analyticsLog("APP_LAUNCH", {
        telegram_id: initData.user?.id?.toString() ?? "NO_USER_IDENTIFIED",
      });
    }
  }, []);

  return <></>;
};
