import { JSX, useState, MouseEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import {
  faChevronDown,
  faCircleInfo,
  faCircleArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import { formatNumber, numberFormat } from "../../utils/formatters";
import { useBackButton } from "../../hooks/backbutton";
import { useTransactionStatus } from "../../hooks/txstatus";
import { useSnackbar } from "../../hooks/snackbar";
import { PopOver } from "../../components/global/PopOver";
import { sendBTC, sendEth, sendOM, sendUSDC } from "../../utils/api/wallet";
import { BottomButtonContainer } from "../../components/Bottom";
import { SubmitButton } from "../../components/global/Buttons";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/sendcrypto.scss";

export default function SendCrypto(): JSX.Element {
  const { srccurrency, intent } = useParams();
  const navigate = useNavigate();
  const { showerrorsnack } = useSnackbar();
  const { showTxStatusBar, txStatusBarVisible, transactionStatus } =
    useTransactionStatus();

  const goBack = () => {
    return srccurrency == "OM"
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

  const btcbalance = localStorage.getItem("btcbal");
  const ethbalance = localStorage.getItem("ethbal");
  const usdcbalance = localStorage.getItem("usdcbal");
  const mantrabalance = localStorage.getItem("mantrabal");

  const availableBalance =
    depositAsset == "OM"
      ? mantrabalance
      : depositAsset == "BTC"
      ? btcbalance
      : depositAsset == "ETH"
      ? ethbalance
      : usdcbalance;

  const { mutate: mutateSendBtc, isError: btcError } = useMutation({
    mutationFn: () =>
      sendBTC(receiverAddress, sendAmnt, intent as string)
        .then(() => {})
        .catch(() => {
          setProcessing(false);
        }),
  });

  const { mutate: mutateSendEth, isError: ethError } = useMutation({
    mutationFn: () =>
      sendEth(receiverAddress, sendAmnt, intent as string)
        .then(() => {})
        .catch(() => {
          setProcessing(false);
        }),
  });

  const { mutate: mutateSendUsdc, isError: usdcError } = useMutation({
    mutationFn: () =>
      sendUSDC(receiverAddress, sendAmnt, intent as string)
        .then(() => {})
        .catch(() => {
          setProcessing(false);
        }),
  });

  const { mutate: mutateSendOM, isError: OMError } = useMutation({
    mutationFn: () =>
      sendOM(receiverAddress, sendAmnt, intent as string)
        .then(() => {})
        .catch(() => {
          setProcessing(false);
        }),
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

      mutateSendBtc();

      if (btcError) {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      } else {
        showTxStatusBar(
          "PENDING",
          `Send ${numberFormat(Number(sendAmnt))} ${depositAsset}`
        );
      }

      return;
    }

    if (depositAsset == "ETH") {
      setProcessing(true);

      mutateSendEth();

      if (ethError) {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      } else {
        showTxStatusBar(
          "PENDING",
          `Send ${numberFormat(Number(sendAmnt))} ${depositAsset}`
        );
      }

      return;
    }

    if (depositAsset == "USDC") {
      setProcessing(true);

      mutateSendUsdc();

      if (usdcError) {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      } else {
        showTxStatusBar(
          "PENDING",
          `Send ${numberFormat(Number(sendAmnt))} ${depositAsset}`
        );
      }

      return;
    }

    if (depositAsset == "OM") {
      setProcessing(true);

      mutateSendOM();

      if (OMError) {
        showerrorsnack("An unexpected error occurred");
        setProcessing(false);
      } else {
        showTxStatusBar(
          "PENDING",
          `Send ${numberFormat(Number(sendAmnt))} ${depositAsset}`
        );
      }

      return;
    }
  };

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  useBackButton(goBack);

  return (
    <div id="sendasset">
      <p className="info">
        <FaIcon faIcon={faCircleInfo} color={colors.danger} fontsize={12} />
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

        <span>
          <FaIcon faIcon={faChevronDown} color={colors.textsecondary} />
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
        inputType="number"
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
            <FaIcon
              faIcon={faCircleArrowUp}
              color={
                processing ||
                receiverAddress == "" ||
                sendAmnt == "" ||
                Number(sendAmnt) > Number(availableBalance) ||
                (txStatusBarVisible && transactionStatus == "PENDING")
                  ? colors.textsecondary
                  : colors.textprimary
              }
            />
          }
          isDisabled={
            processing ||
            receiverAddress == "" ||
            sendAmnt == "" ||
            Number(sendAmnt) > Number(availableBalance) ||
            (txStatusBarVisible && transactionStatus == "PENDING")
          }
          isLoading={
            processing || (txStatusBarVisible && transactionStatus == "PENDING")
          }
          onclick={onSendCrypto}
        />
      </BottomButtonContainer>
    </div>
  );
}
