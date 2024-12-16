import { JSX, useEffect, useState } from "react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { sendEth } from "../../utils/api/wallet";
import { SOCKET } from "../../utils/api/config";
import { Loading } from "../../assets/animations";
import { Send as SendIcon } from "../../assets/icons";
import { colors } from "../../constants";
import ethereumlogo from "../../assets/images/eth.png";
import "../../styles/components/forms.css";

export const Send = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [ethAmnt, setEthAmnt] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const errorInEthValue = (): boolean => {
    if (Number.isInteger(Number(ethAmnt))) return false;
    else if (ethAmnt.split(".")[1].length > 5) return true;
    else return false;
  };

  const onSendTx = async () => {
    if (ethAmnt == "" || receiverAddress == "" || errorInEthValue()) {
      showerrorsnack("Enter an amount & address");
    } else {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      let access = localStorage.getItem("token");

      const { spendSuccess } = await sendEth(
        access as string,
        receiverAddress,
        ethAmnt
      );

      if (spendSuccess) sethttpSuccess(true);
      else {
        showerrorsnack("An unexpected error occurred, please try again");
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
      });
      SOCKET.on("TXFailed", () => {
        setProcessing(false);
        showsuccesssnack("The transaction was completed successfully");
      });
    }
  }, [httpSuccess]);

  return (
    <div id="sendeth">
      <img src={ethereumlogo} alt="send eth" />

      <p>
        To send ETH from your balance, enter the receipient's address and the
        amount you wish to send
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
        value={ethAmnt}
        onChange={(ev) => setEthAmnt(ev.target.value)}
        onKeyUp={() => errorInEthValue()}
        error={errorInEthValue()}
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

      <button onClick={onSendTx}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Send <SendIcon color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
