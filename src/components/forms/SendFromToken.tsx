import { JSX, useEffect, useState } from "react";

import { SOCKET } from "../../utils/api/config";
import { spendOnBehalf } from "../../utils/api/wallet";
import { Loading } from "../../assets/animations";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { SendFromToken } from "../../assets/icons";
import { colors } from "../../constants";
import foreignspend from "../../assets/images/obhehalfspend.png";
import "../../styles/components/forms.css";

// foreign spend
export const SendEthFromToken = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  function base64ToString(base64: string | null): string {
    try {
      if (!base64) throw new Error("Base64 string is missing");
      return decodeURIComponent(escape(atob(base64)));
    } catch (error) {
      console.error("Error decoding base64:", error);
      return "Invalid value";
    }
  }

  const [disableReceive, setdisableReceive] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

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
    } else {
      showerrorsnack("An unexpected error occurred");
    }

    closeAppDrawer();
    setProcessing(false);
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
      });

      return () => {
        SOCKET.off("connect");
        SOCKET.off("disconnect");
      };
    }
  }, [httpSuccess]);

  return (
    <div id="sendethfromtoken">
      <img src={foreignspend} alt="Foreign spend" />

      <p>
        Click to receive&nbsp;
        {base64ToString(localStorage.getItem("utxoVal") as string)}&nbsp;ETH
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
