import { JSX, useState, useEffect, MouseEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useSocket } from "../../utils/SocketProvider";
import { formatNumber } from "../../utils/formatters";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { PopOver } from "../../components/global/PopOver";
import { sendBTC, sendEth } from "../../utils/api/wallet";
import { colors } from "../../constants";
import { Send, Info, ChevronLeft } from "../../assets/icons/actions";
import { Loading } from "../../assets/animations";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/sendcrypto.scss";

export default function SendCrypto(): JSX.Element {
  const { srccurrency, intent } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const goBack = () => {
    srccurrency == "BTC"
      ? navigate("/btc-asset")
      : srccurrency == "ETH"
      ? navigate("/eth-asset/send")
      : navigate("/usdc-asset");
  };

  const [depositAsset, setDepositAsset] = useState<string>(
    srccurrency as string
  );
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [sendAmnt, setSendAmnt] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  let btcbalance = localStorage.getItem("btcbal");
  let ethbalance = localStorage.getItem("ethbal");
  let usdcbalance = "0";
  let availableBalance =
    depositAsset == "BTC"
      ? btcbalance
      : depositAsset == "ETH"
      ? ethbalance
      : usdcbalance;

  const { mutate: mutateSendBtc, isSuccess } = useMutation({
    mutationFn: () => sendBTC(receiverAddress, sendAmnt, intent as string),
  });

  const { mutate: mutateSenEth } = useMutation({
    mutationFn: () => sendEth(receiverAddress, sendAmnt, intent as string),
    onSuccess: () => {
      sethttpSuccess(true);
      showsuccesssnack("Please hold on...");
    },
    onError: () => {
      setProcessing(false);
      showerrorsnack("An unexpected error occurred");
    },
  });

  const errorInSendAmount = (): boolean => {
    if (sendAmnt == "") return false;
    else if (Number(sendAmnt) >= Number(availableBalance)) return true;
    else return false;
  };

  const onSendBtc = async () => {
    if (receiverAddress == "" || sendAmnt == "") {
      showerrorsnack("Enter a valid BTC address & amount");
      return;
    }

    if (depositAsset == "BTC") {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      mutateSendBtc();

      if (isSuccess) sethttpSuccess(true);
      else {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      }

      return;
    }

    if (depositAsset == "ETH") {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      mutateSenEth();

      if (isSuccess) sethttpSuccess(true);
      else {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      }

      return;
    }

    if (depositAsset == "USDC") {
      showerrorsnack("Send USDC coming soon...");
      return;
    }
  };

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  useBackButton(goBack);

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

  return (
    <div id="sendasset">
      <p className="info">
        <Info width={14} height={14} color={colors.danger} />
        Send {depositAsset} to another address
      </p>

      <p className="info_desc">
        To send {depositAsset} to another address, simply provide an address and
        amount. Amount will be deducted from your balance.
      </p>

      <div className="assetselector" onClick={openAssetPopOver}>
        <div className="img_desc">
          <img
            src={
              depositAsset == "BTC"
                ? btclogo
                : depositAsset == "ETH"
                ? ethlogo
                : usdclogo
            }
            alt="asset"
          />

          <p className="desc">
            {depositAsset}
            <span>
              {depositAsset == "BTC"
                ? "Bitcoin"
                : depositAsset == "ETH"
                ? "Ethereum"
                : "USD Coin"}
            </span>
          </p>
        </div>

        <span className="inv_icon">
          <ChevronLeft width={6} height={11} color={colors.textsecondary} />
        </span>
      </div>
      <PopOver anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
        <div className="select_assets">
          <div
            className="img_desc"
            onClick={() => {
              setDepositAsset("BTC");
              setAnchorEl(null);
            }}
          >
            <img src={btclogo} alt="asset" />

            <p className="desc">
              BTC <br /> <span>Bitcoin</span>
            </p>
          </div>

          <div
            className="img_desc"
            onClick={() => {
              setDepositAsset("ETH");
              setAnchorEl(null);
            }}
          >
            <img src={ethlogo} alt="asset" />

            <p className="desc">
              ETH <br /> <span>Ethereum</span>
            </p>
          </div>

          <div
            className="img_desc"
            onClick={() => {
              setDepositAsset("USDC");
              setAnchorEl(null);
            }}
          >
            <img src={usdclogo} alt="asset" />

            <p className="desc">
              USDC <br /> <span>USD Coin</span>
            </p>
          </div>

          <p className="asset_tle">Choose the crypto you would like to send</p>
        </div>
      </PopOver>

      <TextField
        value={receiverAddress}
        onChange={(ev) => setReceiverAddress(ev.target.value)}
        label={`${depositAsset} Address`}
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
        value={sendAmnt}
        onChange={(ev) => setSendAmnt(ev.target.value)}
        onKeyUp={() => errorInSendAmount()}
        error={errorInSendAmount()}
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

      <p className="availablebalance">
        {formatNumber(Number(availableBalance))} {depositAsset}
      </p>

      <button
        disabled={
          processing ||
          receiverAddress == "" ||
          sendAmnt == "" ||
          Number(sendAmnt) > Number(availableBalance)
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
                sendAmnt == "" ||
                Number(sendAmnt) > Number(availableBalance)
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
