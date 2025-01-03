import { JSX, useEffect, useState } from "react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { SOCKET } from "../../utils/api/config";
import { sendUSDT } from "../../utils/api/wallet";
import { colors } from "../../constants";
import { Send } from "../../assets/icons";
import { Loading } from "../../assets/animations";
import usdtlogo from "../../assets/images/usdt.png";
import "../../styles/components/forms.css";

export const SendUsdt = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [usdtAmnt, setUsdtAmnt] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const onSendUsdt = async () => {
    if (receiverAddress == "" || usdtAmnt == "") {
      showerrorsnack("Eanter a valid address & amount");
    } else {
      setProcessing(true);

      let access = localStorage.getItem("token");

      const { spendSuccess } = await sendUSDT(
        access as string,
        receiverAddress,
        usdtAmnt
      );

      if (spendSuccess) sethttpSuccess(true);
      else {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      }
    }
  };

  useEffect(() => {
    if (httpSuccess) {
      SOCKET.on("TXSent", () => {
        showsuccesssnack("Please hold on...");
      });
      SOCKET.on("TXConfirmed", () => {
        setProcessing(false);
        showsuccesssnack("The transaction was completed successfully");
        closeAppDrawer();

        localStorage.setItem("shouldRefetchbalances", "true");
      });
      SOCKET.on("TXFailed", () => {
        setProcessing(false);
        showsuccesssnack("The transaction was completed successfully");
      });
    }
  }, [httpSuccess]);

  return (
    <div id="sendusdtbtc">
      <img src={usdtlogo} alt="usdt logo" />

      <p>
        Send USDT by providing an address and amount. This will be spent from
        your balance
      </p>

      <TextField
        value={receiverAddress}
        onChange={(ev) => setReceiverAddress(ev.target.value)}
        label="Address"
        placeholder="0x. . ."
        fullWidth
        variant="standard"
        autoComplete="off"
        type="text"
        sx={{
          marginTop: "1.25rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <TextField
        value={usdtAmnt}
        onChange={(ev) => setUsdtAmnt(ev.target.value)}
        label="Amount"
        placeholder="0.5"
        fullWidth
        variant="standard"
        autoComplete="off"
        type="number"
        sx={{
          marginTop: "1.25rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <button disabled={processing} onClick={onSendUsdt}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Send <Send color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
