import { JSX, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { sendEth } from "../../utils/api/wallet";
import { useSocket } from "../../utils/SocketProvider";
import { Loading } from "../../assets/animations";
import { Info, Send as SendIcon } from "../../assets/icons/actions";
import { colors } from "../../constants";
import ethereumlogo from "../../assets/images/eth.png";
import "../../styles/pages/transaction.scss";

export default function SendEth(): JSX.Element {
  const navigate = useNavigate();
  const { intent } = useParams();
  const { socket } = useSocket();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [ethAmnt, setEthAmnt] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, setHttpSuccess] = useState<boolean>(false);

  const { mutate: mutateSenEth } = useMutation({
    mutationFn: () => sendEth(receiverAddress, ethAmnt, intent as string),
    onSuccess: () => {
      setHttpSuccess(true);
      showsuccesssnack("Please hold on...");
    },
    onError: () => {
      setProcessing(false);
      showerrorsnack("An unexpected error occurred");
    },
  });

  let availableBalance = localStorage.getItem("ethbal");

  const backbuttonclick = () => {
    navigate("/eth-asset/:send");
  };

  const errorInEthValue = (): boolean => {
    if (ethAmnt === "") return false;
    else if (Number(ethAmnt) >= Number(availableBalance)) return true;
    else return false;
  };

  const onSendTx = async () => {
    if (ethAmnt === "" || receiverAddress === "" || errorInEthValue()) {
      showerrorsnack("Enter an amount & address");
    } else {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      mutateSenEth();
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
        showerrorsnack("The transaction failed");
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
          receiverAddress === "" ||
          ethAmnt === "" ||
          Number(ethAmnt) >= Number(availableBalance)
        }
        onClick={onSendTx}
      >
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Send
            <SendIcon
              width={18}
              height={18}
              color={
                processing ||
                receiverAddress === "" ||
                ethAmnt === "" ||
                Number(ethAmnt) >= Number(availableBalance)
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
