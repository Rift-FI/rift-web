import { Fragment, JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "../hooks/snackbar";
import { earnFromReferral } from "../utils/api/refer";
import { Loading } from "../assets/animations";
import "../styles/pages/auth.scss";

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

  let address: string | null = localStorage.getItem("address"); // eth address
  let token: string | null = localStorage.getItem("token"); // auth token

  const { mutate: mutateRewardReferrer, isSuccess: rewardrefererok } =
    useMutation({
      mutationFn: (referralCode: string) => earnFromReferral(referralCode),
    });

  const tgUsername = initData?.user?.username as string;

  const rewardReferrer = (referrerId: string) => {
    if (address == null && token == null) {
      const referCode = referrerId?.split("_")[0] as string;
      const referrerUsername = referrerId?.split("_")[1] as string;

      if (base64ToString(referrerUsername) == tgUsername) {
        showerrorsnack(`Sorry, you can't refer yourself...`);
        navigate("/auth");
      } else {
        mutateRewardReferrer(referCode);

        if (rewardrefererok) {
          showsuccesssnack(
            "You have received 1 OM, for joining StratosphereID"
          );
        }

        navigate("/auth");
      }
    } else {
      navigate("/app");
    }
  };

  const checkStartParams = () => {
    if (startParam) {
      let data = startParam.split("-");

      if (startParam.startsWith("om")) {
        // opened with airdrop link
        navigate(`/rewards/${startParam}`);
        return;
      }

      if (startParam.startsWith("ref")) {
        // opened with referal link
        const [_, id] = startParam.split("-");

        rewardReferrer(id);
      } else if (data.length == 1) {
        // opened with collectible link
        const [utxoId, utxoVal] = startParam.split("=");

        if (utxoId && utxoVal) {
          localStorage.setItem("utxoId", utxoId);
          localStorage.setItem("utxoVal", utxoVal);
        }

        navigate("/auth");
        return;
      } else if (startParam.startsWith("address")) {
        console.log({ startParam });
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
