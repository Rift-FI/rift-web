import { JSX, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { SOCKET } from "../../utils/api/config";
import { sendBTC } from "../../utils/api/wallet";
import { SnackBar } from "../../components/global/SnackBar";
import { colors } from "../../constants";
import { Send, Info } from "../../assets/icons";
import { Loading } from "../../assets/animations";
import btclogo from "../../assets/images/btc.png";
import "../../styles/pages/transaction.css";

export default function SendBtc(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const backbuttonclick = () => {
    navigate(-1);
  };

  let availableBalance = localStorage.getItem("btcbal");

  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [btcAmnt, setBtcAmnt] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const errorInBtcValue = (): boolean => {
    if (btcAmnt == "") return false;
    else if (Number(btcAmnt) >= Number(availableBalance)) return true;
    else return false;
  };

  const onSendBtc = async () => {
    if (receiverAddress == "" || btcAmnt == "") {
      showerrorsnack("Eanter a valid address & amount");
    } else {
      setProcessing(true);

      let access = localStorage.getItem("token");

      const { spendSuccess } = await sendBTC(
        access as string,
        receiverAddress,
        btcAmnt
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
        showsuccesssnack("The transaction was completed successfully");
      });
    }
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
      <img src={btclogo} alt="usdt logo" />

      <p className="info">
        <Info width={14} height={14} color={colors.danger} />
        Send BTC to another address
      </p>

      <p>
        To send BTC to another address, simply provide an address and amount.
        Amount will be deducted from your balance.
      </p>

      <TextField
        value={receiverAddress}
        onChange={(ev) => setReceiverAddress(ev.target.value)}
        label="BTC Address"
        placeholder="1. . ."
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
        value={btcAmnt}
        onChange={(ev) => setBtcAmnt(ev.target.value)}
        onKeyUp={() => errorInBtcValue()}
        error={errorInBtcValue()}
        label="Amount"
        placeholder="0.05"
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

      <p className="availablebalance">{availableBalance} BTC</p>

      <button
        disabled={
          processing ||
          receiverAddress == "" ||
          btcAmnt == "" ||
          Number(btcAmnt) > Number(availableBalance)
        }
        onClick={onSendBtc}
      >
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Send <Send color={colors.textprimary} />
          </>
        )}
      </button>

      <SnackBar />
    </div>
  );
}
