import { JSX, useEffect, useCallback } from "react";
import {
  miniApp,
  mountClosingBehavior,
  enableClosingConfirmation,
  unmountClosingBehavior,
  isSwipeBehaviorSupported,
  mountSwipeBehavior,
  disableVerticalSwipes,
  unmountSwipeBehavior,
  useLaunchParams,
} from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useAppDialog } from "../hooks/dialog";
import { analyticsLog } from "../analytics/events";
import { colors } from "../constants";

export default function Splash(): JSX.Element {
  const { startParam, initData } = useLaunchParams();
  const navigate = useNavigate();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const userAuthenticated = useCallback(() => {
    const ethaddress: string | null = localStorage.getItem("ethaddress");
    const token: string | null = localStorage.getItem("spheretoken");
    const quvaulttoken: string | null = localStorage.getItem("quvaulttoken");
    const authsessionversion: string | null = localStorage.getItem(
      "auth_session_version"
    );

    analyticsLog("APP_LAUNCH", {
      telegram_id: initData?.user?.id?.toString() ?? "NO_TELEGRAM_ID",
    });

    if (
      ethaddress == null ||
      typeof ethaddress == undefined ||
      token == null ||
      typeof token == undefined ||
      quvaulttoken == null ||
      typeof quvaulttoken == undefined ||
      authsessionversion == null ||
      typeof authsessionversion == undefined
    ) {
      navigate("/auth");
      return;
    } else {
      analyticsLog("SIGN_IN", {
        telegram_id: initData?.user?.id?.toString() ?? "NO_TELEGRAM_ID",
      });
      closeAppDialog();
      navigate("/app");
      return;
    }
  }, []);

  const checkStartParams = useCallback(() => {
    if (startParam) {
      if (startParam?.includes("starttab")) {
        localStorage.setItem("starttab", startParam?.split("-")[1]);
        userAuthenticated();
      }

      if (startParam?.includes("startpage")) {
        localStorage.setItem("startpage", startParam?.split("-")[1]);
        userAuthenticated();
      }

      if (startParam?.startsWith("om")) {
        // opened with airdrop link
        localStorage.setItem("airdropId", startParam);
        userAuthenticated();
      }

      if (startParam?.includes("xy")) {
        // opened with unpaid key link
        const secretId = startParam?.split("_")[0];
        const secretNonce = startParam?.split("_")[1];

        localStorage.setItem("lendsecretid", secretId);
        localStorage.setItem("lendsecretnonce", secretNonce);

        userAuthenticated();
      }

      if (startParam?.includes("payment")) {
        /**https://t.me/spheredev_bot/spheredev?startapp={base64sender} {_nonce} {_payment=true}*/
        // opened with a paid key link
        const splitparam = startParam?.split("_");
        const paysecretnonce = splitparam[1];

        localStorage.setItem("paysecretnonce", paysecretnonce);
        userAuthenticated();
      }

      if (startParam?.includes("referral")) {
        // https://t.me/spheredev_bot/spheredev?startapp=referral_thecode
        const referalcode = startParam?.split("_");

        localStorage.setItem("referrer", referalcode[1]);
        userAuthenticated();
      }

      if (startParam?.includes("collect")) {
        // opened with collect link
        // https://t.me/spheredev_bot/spheredev?startapp= {txId} {-base64Value} {-currency} {-collect}
        const utxoId = startParam?.split("-")[0];
        const utxoVal = startParam?.split("-")[1];
        const utxoCurrency = startParam?.split("-")[2];

        localStorage.setItem("utxoId", utxoId);
        localStorage.setItem("utxoVal", utxoVal);
        localStorage.setItem("utxoCurrency", utxoCurrency);

        userAuthenticated();
      }
    } else {
      userAuthenticated();
    }
  }, []);

  useEffect(() => {
    if (miniApp.mount.isAvailable()) {
      miniApp.mount();
      miniApp.setHeaderColor(colors.primaryhex);
      miniApp.setBottomBarColor(colors.primaryhex);
      miniApp.setBackgroundColor(colors.primaryhex);

      mountClosingBehavior();
    }

    if (isSwipeBehaviorSupported()) {
      mountSwipeBehavior();
    }

    enableClosingConfirmation();
    disableVerticalSwipes();

    return () => {
      unmountClosingBehavior();
      unmountSwipeBehavior();
    };
  }, []);

  useEffect(() => {
    openAppDialog("loading", "Loading, please wait...");
    checkStartParams();
  }, []);

  return <section id="splash" />;
}
