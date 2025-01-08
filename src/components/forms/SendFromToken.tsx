import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SOCKET } from "../../utils/api/config";
import { spendOnBehalf } from "../../utils/api/wallet";
import { getEthUsdVal } from "../../utils/ethusd";
import { Loading } from "../../assets/animations";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { SendFromToken } from "../../assets/icons";
import { colors } from "../../constants";
import foreignspend from "../../assets/images/obhehalfspend.png";
import "../../styles/components/forms.css";

function base64ToString(base64: string | null): string {
  try {
    if (!base64) throw new Error("Base64 string is missing");
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    return "Invalid value";
  }
}

// foreign spend
export const SendEthFromToken = (): JSX.Element => {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  let localethValue = localStorage.getItem("ethvalue");

  const [eThvalLoading, setEThvalLoading] = useState<boolean>(false);
  const [ethValinUSd, setEthValinUSd] = useState<number>(0.0);

  const [disableReceive, setdisableReceive] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const getUSDToEthValue = useCallback(async () => {
    if (localethValue == null) {
      setEThvalLoading(true);

      const { ethValue } = await getEthUsdVal(1);

      setEthValinUSd(ethValue);
      setEThvalLoading(false);
    } else {
      setEthValinUSd(Number(localethValue));
    }
  }, []);

  const onSpendOnBehalf = async () => {
    setProcessing(true);
    setdisableReceive(true);
    showsuccesssnack("Please wait...");

    let access = localStorage.getItem("token");
    let utxoId = localStorage.getItem("utxoId");

    const { spendOnBehalfSuccess, status } = await spendOnBehalf(
      access as string,
      localStorage.getItem("address") as string,
      utxoId as string
    );

    if (spendOnBehalfSuccess == true && status == 200) {
      sethttpSuccess(true);
      showsuccesssnack("Please wait for the transaction...");
    } else if ((spendOnBehalfSuccess == true && status) == 403) {
      showerrorsnack("This link has expired");
      closeAppDrawer();
      navigate("/");
    } else if (spendOnBehalfSuccess == true && status == 404) {
      showerrorsnack("This link has been used");
      closeAppDrawer();
      navigate("/");
    } else {
      showerrorsnack("An unexpected error occurred");
      closeAppDrawer();
    }

    localStorage.removeItem("utxoId");
  };

  useEffect(() => {
    if (httpSuccess) {
      SOCKET.on("TXSent", () => {
        showsuccesssnack("Please hold on...");
      });
      SOCKET.on("TXConfirmed", () => {
        setProcessing(false);
        showsuccesssnack(
          `Successfully collected ${base64ToString(
            localStorage.getItem("utxoVal") as string
          )} ETH`
        );

        localStorage.removeItem("utxoVal");
        closeAppDrawer();
        navigate("/");
      });

      return () => {
        SOCKET.off("connect");
        SOCKET.off("disconnect");
      };
    }
  }, [httpSuccess]);

  useEffect(() => {
    getUSDToEthValue();
  }, []);

  return (
    <div id="sendethfromtoken">
      <img src={foreignspend} alt="Foreign spend" />

      <p>
        Click to receive&nbsp;
        {eThvalLoading
          ? "- - -"
          : `${(
              Number(
                base64ToString(localStorage.getItem("utxoVal") as string)
              ) * ethValinUSd
            ).toFixed(2)} USD`}
      </p>

      <button disabled={disableReceive} onClick={onSpendOnBehalf}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Receive <SendFromToken color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
