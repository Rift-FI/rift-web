import { Fragment, JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../hooks/snackbar";
import { earnFromReferral, rewardNewUser } from "../utils/api/refer";
import { Loading } from "../assets/animations";
import "../styles/pages/auth.css";

const base64ToString = (base64: string | null): string => {
  try {
    if (!base64) throw new Error("Base64 string is missing");
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    return "Invalid value";
  }
};

export default function Splash(): JSX.Element {
  const { initData, startParam } = useLaunchParams();
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const referrerUser = initData?.user?.username as string;

  const rewardReferrer = async (referrerId: string) => {
    const referCode = referrerId?.split("_")[0] as string;
    const referrerUsername = referrerId?.split("_")[1] as string;
    console.log(referCode);
    console.log(referrerUsername);
    if (base64ToString(referrerUsername) == referrerUser) {
      showerrorsnack(`Sorry, you can't refer yourself...`);
      navigate("/auth");
      return;
    }

    if (referrerId !== null) {
      const { earnOk } = await earnFromReferral(referCode);
      const { isOk } = await rewardNewUser();

      if (earnOk && isOk) {
        showsuccesssnack(
          "You have received 1 USDC, for joining StratosphereID"
        );
        navigate("/auth");
      } else {
        navigate("/auth");
      }
    }
  };

  const checkStartParams = () => {
    if (startParam) {
      if (startParam.startsWith("ref")) {
        // opened with referal link
        const [_, id] = startParam.split("-");

        rewardReferrer(id);
        return;
      }

      let data = startParam.split("-");
      // opened with collectible link
      if (data.length == 1) {
        const [utxoId, utxoVal] = startParam.split("=");

        if (utxoId && utxoVal) {
          localStorage.setItem("utxoId", utxoId);
          localStorage.setItem("utxoVal", utxoVal);
        }

        navigate("/auth");
        return;
      }
    }

    navigate("/auth");
  };

  useEffect(() => {
    checkStartParams();
  }, []);

  return (
    <Fragment>
      <div id="signupc">
        <div className="loader">
          <p>loading...</p>
          <Loading width="1.75rem" height="1.75rem" />
        </div>
      </div>
    </Fragment>
  );
}
