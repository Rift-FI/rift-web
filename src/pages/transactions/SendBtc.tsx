import { JSX, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useSocket } from "../../utils/SocketProvider";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { sendBTC } from "../../utils/api/wallet";
import { colors } from "../../constants";
import { Send, Info } from "../../assets/icons/actions";
import { Loading } from "../../assets/animations";
import btclogo from "../../assets/images/btc.png";
import "../../styles/pages/transaction.scss";

export default function SendBtc(): JSX.Element {
  const { intent } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const backbuttonclick = () => {
    navigate("/btc-asset");
  };

  let availableBalance = localStorage.getItem("btcbal");

  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [btcAmnt, setBtcAmnt] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const { mutate: mutateSendBtc, isSuccess } = useMutation({
    mutationFn: () => sendBTC(receiverAddress, btcAmnt, intent as string),
  });

  const errorInBtcValue = (): boolean => {
    if (btcAmnt == "") return false;
    else if (Number(btcAmnt) >= Number(availableBalance)) return true;
    else return false;
  };

  const onSendBtc = async () => {
    if (receiverAddress == "" || btcAmnt == "") {
      showerrorsnack("Enter a valid BTC address & amount");
    } else {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      mutateSendBtc();

      if (isSuccess) sethttpSuccess(true);
      else {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      }
    }
  };

  useEffect(() => {
    if (httpSuccess) {
      if (!socket) return;
      socket.on("TXConfirmed", () => {
        setProcessing(false);
        showsuccesssnack("The transaction was completed successfully");
        closeAppDrawer();
      });
      socket.on("TXFailed", () => {
        setProcessing(false);
        showsuccesssnack("The transaction was completed successfully");
      });
    }

    return () => {
      if (!socket) return;
      socket.off("TXConfirmed");
      socket.off("TXFailed");
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
            Send
            <Send
              width={18}
              height={18}
              color={
                processing ||
                receiverAddress == "" ||
                btcAmnt == "" ||
                Number(btcAmnt) > Number(availableBalance)
                  ? colors.textsecondary
                  : colors.textprimary
              }
            />
          </>
        )}
      </button>
    </div>
  );
}
