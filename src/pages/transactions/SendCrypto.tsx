import { JSX, useState, useEffect, MouseEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useSocket } from "../../utils/SocketProvider";
import { formatNumber } from "../../utils/formatters";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useTransactionStatus } from "../../hooks/txstatus";
import { useAppDrawer } from "../../hooks/drawer";
import { PopOver } from "../../components/global/PopOver";
import { sendBTC, sendEth } from "../../utils/api/wallet";
import { BottomButtonContainer } from "../../components/Bottom";
import { SubmitButton } from "../../components/global/Buttons";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { colors } from "../../constants";
import { Send, Info, ChevronLeft } from "../../assets/icons/actions";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/sendcrypto.scss";

export default function SendCrypto(): JSX.Element {
  const { srccurrency, intent } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { showTxStatusBar, hideTxStatusBar } = useTransactionStatus();
  const { closeAppDrawer } = useAppDrawer();

  const goBack = () => {
    srccurrency == "OM"
      ? navigate("/om-asset")
      : srccurrency == "BTC"
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
  let mantrabalance = localStorage.getItem("mantrabal");

  let availableBalance =
    depositAsset == "OM"
      ? mantrabalance
      : depositAsset == "BTC"
      ? btcbalance
      : depositAsset == "ETH"
      ? ethbalance
      : usdcbalance;

  const {
    mutate: mutateSendBtc,
    isSuccess: btcSucess,
    isError: btcError,
  } = useMutation({
    mutationFn: () => sendBTC(receiverAddress, sendAmnt, intent as string),
  });

  const {
    mutate: mutateSenEth,
    isSuccess: ethSucess,
    isError: ethError,
  } = useMutation({
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

  const onSendCrypto = async () => {
    if (receiverAddress == "" || sendAmnt == "") {
      showerrorsnack("Enter a valid BTC address & amount");
      return;
    }

    if (depositAsset == "BTC") {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      mutateSendBtc();

      if (btcSucess) sethttpSuccess(true);
      if (btcError) {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      }

      return;
    }

    if (depositAsset == "ETH") {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      mutateSenEth();

      if (ethSucess) sethttpSuccess(true);
      if (ethError) {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      }

      showTxStatusBar(
        "PENDING",
        `Send ${Number(sendAmnt).toFixed(2)}... ${depositAsset}`
      );
      return;
    }

    if (depositAsset == "USDC") {
      showerrorsnack("Send USDC coming soon...");
      return;
    }

    if (depositAsset == "OM") {
      showerrorsnack("Send OM coming soon...");
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
        showTxStatusBar("PROCESSED", `Send ${sendAmnt} ${depositAsset}`);

        setProcessing(false);
        showsuccesssnack("The transaction was completed successfully");
        closeAppDrawer();

        setTimeout(() => {
          hideTxStatusBar();
        }, 3500);
      });

      socket.on("TXFailed", () => {
        setProcessing(false);
        showsuccesssnack("The transaction was completed successfully");

        showTxStatusBar("FAILED", `Send ${Number(sendAmnt)} ${depositAsset}`);
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
              depositAsset == "OM"
                ? mantralogo
                : depositAsset == "BTC"
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
              {depositAsset == "OM"
                ? "Mantra"
                : depositAsset == "BTC"
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
              setDepositAsset("OM");
              setAnchorEl(null);
            }}
          >
            <img src={mantralogo} alt="asset" />

            <p className="desc">
              OM <br /> <span>Mantra</span>
            </p>
          </div>

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
        </div>
      </PopOver>

      <OutlinedTextInput
        inputType="text"
        placeholder="address"
        inputlabalel={`${depositAsset} Address`}
        inputState={receiverAddress}
        setInputState={setReceiverAddress}
      />

      <OutlinedTextInput
        inputType="text"
        placeholder="0.05"
        inputlabalel="Amount"
        inputState={sendAmnt}
        setInputState={setSendAmnt}
        hasError={errorInSendAmount()}
      />

      <p className="availablebalance">
        {formatNumber(Number(availableBalance))} {depositAsset}
      </p>

      <BottomButtonContainer>
        <SubmitButton
          text="Send"
          icon={
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
          }
          isDisabled={
            processing ||
            receiverAddress == "" ||
            sendAmnt == "" ||
            Number(sendAmnt) > Number(availableBalance)
          }
          isLoading={processing}
          onclick={onSendCrypto}
        />
      </BottomButtonContainer>
    </div>
  );
}
