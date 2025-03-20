import { Fragment, JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { Loading } from "../assets/animations";
import "../styles/pages/splash.scss";

export default function Splash(): JSX.Element {
  const { startParam } = useLaunchParams();
  const navigate = useNavigate();

  const userAuthenticated = () => {
    let ethaddress: string | null = localStorage.getItem("ethaddress");
    let token: string | null = localStorage.getItem("spheretoken");
    let quvaulttoken: string | null = localStorage.getItem("quvaulttoken");

    if (
      ethaddress == null ||
      typeof ethaddress == "undefined" ||
      token == null ||
      typeof token == "undefined" ||
      quvaulttoken == null ||
      typeof quvaulttoken == "undefined"
    ) {
      navigate("/auth/phone");
      return;
    } else {
      navigate("/app");
      return;
    }
  };

  const checkStartParams = () => {
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
        /**https://t.me/spheredev_bot/spheredev?startapp={Nzg2MDM5NDkwNw==} {_Qy9IhBW01Hzu} {_payment=true} {_amount=30} {_currency=USDT} {_owner=7860394907} {_ownerAddress=0x9FDcEe7216386e9e11EB7aaf94Dc725EF22386C6} {_purpose=OPENAI} */
        // opened with a paid key link
        const splitparam = startParam?.split("_");
        const paysecretreceiver = splitparam[0];
        const paysecretid = splitparam[1];
        const paysecretnonce = splitparam[1];
        const paysecretpurpose = splitparam[7]?.split("=")[1];
        const paysecretamount = splitparam[3]?.split("=")[1];
        const paysecretcurrency = splitparam[4]?.split("=")[1];

        localStorage.setItem("paysecretreceiver", paysecretreceiver);
        localStorage.setItem("paysecretid", paysecretid);
        localStorage.setItem("paysecretnonce", paysecretnonce);
        localStorage.setItem("paysecretpurpose", paysecretpurpose);
        localStorage.setItem("paysecretamount", paysecretamount);
        localStorage.setItem("paysecretcurrency", paysecretcurrency);

        userAuthenticated();
      }

      if (startParam?.includes("collect")) {
        // opened with collect link
        // https://t.me/spheredev_bot/spheredev?startapp= {oNVeaSjQf4SL}- {MC4wOTk1OQ==} {-collect}
        const utxoId = startParam?.split("-")[0];
        const utxoVal = startParam?.split("-")[1];
        // const utxoIntent = startParam?.split("-")[2];

        localStorage.setItem("utxoId", utxoId);
        localStorage.setItem("utxoVal", utxoVal);
        // localStorage.setItem("utxoIntent", utxoIntent);

        userAuthenticated();
      }
    } else {
      userAuthenticated();
    }
  };

  useEffect(() => {
    checkStartParams();
  }, []);

  return (
    <Fragment>
      <div id="signupc">
        <div className="loader">
          <p>loading, please wait...</p>
          <Loading width="1.75rem" height="1.75rem" />
        </div>
      </div>
    </Fragment>
  );
}
