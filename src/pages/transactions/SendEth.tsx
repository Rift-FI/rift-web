import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { sendEth } from "../../utils/api/wallet";
import { SOCKET } from "../../utils/api/config";
import { SnackBar } from "../../components/global/SnackBar";
import { Loading } from "../../assets/animations";
import { Info, Send as SendIcon } from "../../assets/icons";
import { colors } from "../../constants";
import ethereumlogo from "../../assets/images/eth.png";
import "../../styles/pages/transaction.css";

export default function SendEth(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [ethAmnt, setEthAmnt] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  let availableBalance = localStorage.getItem("ethbal");

  const backbuttonclick = () => {
    navigate(-1);
  };

  const errorInEthValue = (): boolean => {
    if (ethAmnt == "") return false;
    else if (Number(ethAmnt) >= Number(availableBalance)) return true;
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

      if (spendSuccess) {
        sethttpSuccess(true);
      } else {
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
      <img src={ethereumlogo} alt="send eth" />

      <p className="info">
        <Info width={14} height={14} color={colors.danger} />
        Send ETH to another address
      </p>

      <p>
        To send ETH to another address, simply provide an address and amount.
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
        value={ethAmnt}
        onChange={(ev) => setEthAmnt(ev.target.value)}
        onKeyUp={() => errorInEthValue()}
        error={errorInEthValue()}
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

      <p className="availablebalance">{availableBalance} ETH</p>

      <button
        disabled={
          processing ||
          receiverAddress == "" ||
          ethAmnt == "" ||
          Number(ethAmnt) >= Number(availableBalance)
        }
        onClick={onSendTx}
      >
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Send <SendIcon color={colors.textprimary} />
          </>
        )}
      </button>

      <SnackBar />
    </div>
  );
}
