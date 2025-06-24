import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { usePlatformDetection, useSafeLaunchParams } from "@/utils/platform";

export default function Splash() {
  const navigate = useNavigate();
  const { isTelegram } = usePlatformDetection();
  const safeLaunchParams = useSafeLaunchParams(); // tg-start params
  const searchParams = new URLSearchParams(window.location.search); // browser-start params

  const address = localStorage.getItem("address");
  const token = localStorage.getItem("token");

  const startparam = safeLaunchParams?.startParam;
  const searchParamsData = searchParams.get("data");

  console.log("startparams -> ", startparam);
  console.log("searcparams -> ", searchParamsData);

  const isAuthenticated = () => {
    if (address == null || token == null) {
      navigate("/auth");
    } else {
      // Set the isNewVersion flag for existing authenticated users
      localStorage.setItem("isNewVersion", "true");
      navigate("/app");
    }
  };

  const handleStartParams = useCallback(() => {
    if (startparam || searchParamsData) {
      if (
        startparam?.includes("send_link") ||
        searchParamsData?.includes("send_link")
      ) {
        // handle collect >> send_link-base64 encoded collect object
        const collectobjectb64 = isTelegram
          ? startparam?.split("-")[1]
          : searchParamsData?.split("-")[1];
        localStorage.setItem("collectobject", collectobjectb64!);

        isAuthenticated();
      }

      if (
        startparam?.includes("request_link") ||
        searchParamsData?.includes("request_link")
      ) {
        // handle payment request >> request_link-base64 encoded payment request object
        const requestobjectb64 = isTelegram
          ? startparam?.split("-")[1]
          : searchParamsData?.split("-")[1];
        localStorage.setItem("requestobject", requestobjectb64!);

        isAuthenticated();
      }
    } else {
      isAuthenticated();
    }
  }, []);

  useEffect(() => {
    handleStartParams();
  }, []);

  return <div />;
}
