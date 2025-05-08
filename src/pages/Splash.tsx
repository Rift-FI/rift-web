import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useAppDialog } from "@/hooks/dialog";
import "../styles/pages/signup.scss";

export default function Splash(): JSX.Element {
  const { startParam } = useLaunchParams();
  const navigate = useNavigate();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const userAuthenticated = () => {
    const ethaddress: string | null = localStorage.getItem("ethaddress");
    const token: string | null = localStorage.getItem("spheretoken");
    const quvaulttoken: string | null = localStorage.getItem("quvaulttoken");
    const authsessionversion: string | null = localStorage.getItem(
      "auth_session_version"
    );

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
      closeAppDialog();
      navigate("/app");
      return;
    }
  };

  const checkStartParams = () => {
    console.log("start params" + startParam);

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
        /**https://t.me/spheredev_bot/spheredev?startapp={Nzg2MDM5NDkwNw==} {_Qy9IhBW01Hzu} {_payment=true}*/
        // opened with a paid key link
        const splitparam = startParam?.split("_");
        const paysecretnonce = splitparam[1];

        localStorage.setItem("paysecretnonce", paysecretnonce);
        userAuthenticated();
      }

      if (startParam?.includes("referral")) {
        // https://t.me/spheredev_bot/spheredev?startapp=referral_ooxcyr74
        const referalcode = startParam?.split("_");

        localStorage.setItem("referrer", referalcode[1]);
        userAuthenticated();
      }

      // https://t.me/spheredev_bot/spheredev?startapp=mpesa_xxy
      if (startParam?.includes("mpesa")) {
        const reference = startParam?.split("_")[1];
        // mpesa?trxref=9qy6xr27hu
        // reference=9qy6xr27hu

        localStorage.setItem("paystackreference", reference);

        userAuthenticated();
      }

      if (startParam?.includes("collect")) {
        // opened with collect link
        // https://t.me/spheredev_bot/spheredev?startapp= {hyp5tQRDFSeA} {-MC4wMTI1Mw==} {-ETH} {-collect}
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
  };

  useEffect(() => {
    openAppDialog("loading", "Loading, please wait...");
    checkStartParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <section id="signup" />;
}
