import { Fragment, JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { Loading } from "../assets/animations";
import "../styles/pages/auth.scss";

export default function Splash(): JSX.Element {
  const { startParam } = useLaunchParams();
  const navigate = useNavigate();

  let address: string | null = localStorage.getItem("address"); // eth address
  let token: string | null = localStorage.getItem("token"); // auth token

  const checkStartParams = () => {
    if (startParam) {
      let data = startParam.split("-");
      if (startParam.startsWith("om")) {
        // opened with airdrop link
        localStorage.setItem("airdropId", startParam);
        navigate("/auth");
      }
      //&& token == null && address == null
      if (startParam.startsWith("ref")) {
        // opened with referal link
        const [_, id] = startParam.split("-");

        const referCode = id?.split("_")[0] as string;
        const referrerUsername = id?.split("_")[1] as string;
        const referaltype = id?.split("_")[2] as string;

        localStorage.setItem("referCode", referCode);
        localStorage.setItem("referrerUsername", referrerUsername);
        localStorage.setItem("referaltype", referaltype);

        navigate("/auth");
      } else if (data.length == 1) {
        // opened with collectible link
        const utxoId = startParam.split("_")[0];
        const utxoVal = startParam.split("_")[1];
        const utxoIntent = startParam.split("_")[2];

        if (utxoId && utxoVal) {
          localStorage.setItem("utxoId", utxoId);
          localStorage.setItem("utxoVal", utxoVal);
          localStorage.setItem("utxoIntent", utxoIntent);

          navigate("/auth");
        }

        navigate("/auth");
      }
    } else {
      if (address && token) {
        navigate("/app");
      } else {
        navigate("/auth");
      }
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
