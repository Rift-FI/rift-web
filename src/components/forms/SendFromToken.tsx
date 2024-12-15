import { JSX, useEffect, useState } from "react";
import { TextField } from "@mui/material";
import { SOCKET } from "../../utils/api/config";
import { spendOnBehalf } from "../../utils/api/wallet";
import { Loading } from "../../assets/animations";
import { useSnackbar } from "../../hooks/snackbar";
import { SendFromToken } from "../../assets/icons";
import { colors } from "../../constants";
import foreignspend from "../../assets/images/obhehalfspend.png";
import "../../styles/components/forms.css";

export const SendEthFromToken = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  // receiverAddress -> to
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  // accesstoken -> spendToken
  const [accessToken, setAccessToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const errorInEthValue = (): boolean => {
    if (Number.isInteger(Number(amount))) return false;
    else if (amount.split(".")[1].length > 5) return true;
    else return false;
  };

  const onSpendOnBehalf = async () => {
    if (
      receiverAddress == "" ||
      accessToken == "" ||
      amount == "" ||
      errorInEthValue()
    ) {
      showerrorsnack("Fill in all fields");
    } else {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      let access = localStorage.getItem("token");

      const { spendOnBehalfSuccess } = await spendOnBehalf(
        access as string,
        accessToken,
        receiverAddress,
        amount
      );

      if (spendOnBehalfSuccess) sethttpSuccess(true);
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
        To send ETH using a shared wallet access token, paste the token, enter
        the receipient's address and amount
      </p>

      <TextField
        value={accessToken}
        onChange={(ev) => setAccessToken(ev.target.value)}
        label="Wallet Access Token"
        placeholder="ey. . ."
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
            borderBottomColor: colors.divider,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.divider,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

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
            borderBottomColor: colors.divider,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.divider,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <TextField
        value={amount}
        onChange={(ev) => setAmount(ev.target.value)}
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
            borderBottomColor: colors.divider,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.divider,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <button onClick={onSpendOnBehalf}>
        {processing ? (
          <Loading />
        ) : (
          <>
            Send <SendFromToken color={colors.primary} />
          </>
        )}
      </button>
    </div>
  );
};
