import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { SOCKET } from "../../utils/api/config";
import { sendUSDT } from "../../utils/api/wallet";
import { colors } from "../../constants";
import { Info, Send } from "../../assets/icons";
import { Loading } from "../../assets/animations";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/transaction.css";

export default function SendUsdc(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [usdtAmnt, setUsdtAmnt] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  let availableBalance = localStorage.getItem("usdtbal");

  const errorInUsdcValue = (): boolean => {
    if (usdtAmnt == "") return false;
    else if (Number(usdtAmnt) >= Number(availableBalance)) return true;
    else return false;
  };

  const backbuttonclick = () => {
    navigate(-1);
  };

  const onSendUsdt = async () => {
    if (receiverAddress == "" || usdtAmnt == "") {
      showerrorsnack("Eanter a valid address & amount");
    } else {
      showsuccesssnack("Please wait for the transaction...");
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
      });
      SOCKET.on("TXFailed", () => {
        setProcessing(false);
        console.log("tx event...");
      });
    }

    return () => {
      SOCKET.off("TXSent");
      SOCKET.off("TXConfirmed");
      SOCKET.off("TXFailed");
    };
  }, [httpSuccess]);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(backbuttonclick);
    }

    return () => {
      backButton.offClick(backbuttonclick);
      backButton.unmount();
    };
  }, []);

  return (
    <div id="sendasset">
      <img src={usdclogo} alt="usdt logo" />

      <p className="info">
        <Info width={14} height={14} color={colors.danger} />
        Send USDC to another address
      </p>

      <p>
        To send USDC to another address, simply provide an address and amount.
        Amount will be deducted from your balance.
      </p>

      <TextField
        value={receiverAddress}
        onChange={(ev) => setReceiverAddress(ev.target.value)}
        label="Address"
        placeholder="0x. . ."
        fullWidth
        variant="outlined"
        autoComplete="off"
        type="text"
        sx={{
          marginTop: "1.5rem",
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: colors.divider,
            },
            "& input": {
              color: colors.textprimary,
            },
            "&::placeholder": {
              color: colors.textsecondary,
              opacity: 1,
            },
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
            fontSize: "0.875rem",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: colors.accent,
          },
        }}
      />

      <TextField
        value={usdtAmnt}
        onChange={(ev) => setUsdtAmnt(ev.target.value)}
        onKeyUp={() => errorInUsdcValue()}
        error={errorInUsdcValue()}
        label="Amount"
        placeholder="0.5"
        fullWidth
        variant="outlined"
        autoComplete="off"
        type="number"
        sx={{
          marginTop: "1.5rem",
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: colors.divider,
            },
            "& input": {
              color: colors.textprimary,
            },
            "&::placeholder": {
              color: colors.textsecondary,
              opacity: 1,
            },
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
            fontSize: "0.875rem",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: colors.accent,
          },
        }}
      />

      <p className="availablebalance">{availableBalance} USDC</p>

      <button
        disabled={
          processing ||
          receiverAddress == "" ||
          usdtAmnt == "" ||
          Number(usdtAmnt) > Number(availableBalance)
        }
        onClick={onSendUsdt}
      >
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
}
