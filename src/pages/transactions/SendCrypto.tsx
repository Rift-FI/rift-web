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
import { useTabs } from "../../hooks/tabs";
import { PopOver } from "../../components/global/PopOver";
import {
  sendEth,
  sendUSDC,
  sendWbera,
  sendWUSDC,
} from "../../utils/api/wallet";
import { BottomButtonContainer } from "../../components/Bottom";
import { SubmitButton } from "../../components/global/Buttons";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { FaIcon } from "../../assets/faicon";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import beralogo from "../../assets/images/icons/bera.webp";
import { colors } from "@/constants";
import { useAppDrawer } from "@/hooks/drawer";

export default function SendCrypto(): JSX.Element {
  const { srccurrency, intent } = useParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showerrorsnack } = useSnackbar();
  const { showTxStatusBar, txStatusBarVisible, transactionStatus } =
    useTransactionStatus();
  const { openAppDrawer } = useAppDrawer();

  const [depositAsset, setDepositAsset] = useState<string>(
    srccurrency as string
  );
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [sendAmnt, setSendAmnt] = useState<string>("");

  const ethbalance = localStorage.getItem("ethbal");
  const usdcbalance = localStorage.getItem("usdcbal");
  const wberabalance = localStorage.getItem("WBERAbal");
  const wusdcbalance = localStorage.getItem("wusdcbal");
  const prev_page = localStorage.getItem("prev_page");
  const txverified = localStorage.getItem("txverified");

  const availableBalance =
    depositAsset == "WBERA"
      ? wberabalance
      : depositAsset == "ETH"
      ? ethbalance
      : depositAsset == "USDC"
      ? usdcbalance
      : depositAsset == "WUSDC"
      ? wusdcbalance
      : "0";

  const { mutate: mutateSendEth, isError: ethError } = useMutation({
    mutationFn: () =>
      sendEth(receiverAddress, sendAmnt, intent as string)
        .then(() => {
          localStorage.removeItem("txverified");
        })
        .catch(() => {
          console.error("Unable to send ETH");
        }),
  });
  const { mutate: mutateSendUsdc, isError: usdcError } = useMutation({
    mutationFn: () =>
      sendUSDC(receiverAddress, sendAmnt, intent as string)
        .then(() => {
          localStorage.removeItem("txverified");
        })
        .catch(() => {
          console.error("Unable to send USDC");
        }),
  });
  const { mutate: mutateSendWusdc, isError: wusdcError } = useMutation({
    mutationFn: () =>
      sendWUSDC(receiverAddress, sendAmnt, intent as string)
        .then(() => {
          localStorage.removeItem("txverified");
        })
        .catch(() => {
          console.error("Unable to send WUSDC");
        }),
  });
  const { mutate: mutateSendWbera, isError: wberaError } = useMutation({
    mutationFn: () =>
      sendWbera(receiverAddress, sendAmnt, intent as string)
        .then(() => {
          localStorage.removeItem("txverified");
        })
        .catch(() => {
          console.error("Unable to send WBERA");
        }),
  });

  const errorInSendAmount = (): boolean => {
    if (sendAmnt == "") return false;
    else if (Number(sendAmnt) >= Number(availableBalance)) return true;
    else return false;
  };

  const onSendCrypto = async () => {
    if (receiverAddress == "" || sendAmnt == "") {
      showerrorsnack(`Enter a valid ${depositAsset} address & amount`);
      return;
    }

    if (txverified == null) {
      openAppDrawer("verifytxwithotp");
      return;
    }

    if (depositAsset == "ETH") {
      mutateSendEth();

      if (ethError) {
        showerrorsnack("An unexpected error occurred");
      } else {
        showTxStatusBar(
          "PENDING",
          `Send ${numberFormat(Number(sendAmnt))} ${depositAsset}`
        );
      }

      return;
    }

    if (depositAsset == "WUSDC") {
      mutateSendWusdc();

      if (wusdcError) {
        showerrorsnack("An unexpected error occurred");
      } else {
        showTxStatusBar(
          "PENDING",
          `Send ${numberFormat(Number(sendAmnt))} ${depositAsset}`
        );
      }

      return;
    }

    if (depositAsset == "USDC") {
      mutateSendUsdc();

      if (usdcError) {
        showerrorsnack("An unexpected error occurred");
      } else {
        showTxStatusBar(
          "PENDING",
          `Send ${numberFormat(Number(sendAmnt))} ${depositAsset}`
        );
      }

      return;
    }

    if (depositAsset == "WBERA") {
      mutateSendWbera();

      if (wberaError) {
        showerrorsnack("An unexpected error occurred");
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

  const goBack = () => {
    if (prev_page == null) {
      switchtab("home");
      navigate("/app");
    } else if (prev_page === "rewards") {
      switchtab("rewards");
      navigate("/app");
    } else if (prev_page === "send-options") {
      switchtab("sendcrypto");
      navigate("/app");
    } else {
      navigate(prev_page);
    }
  };

  useBackButton(goBack);

  return (
    <div className="flex flex-col p-4 bg-[#212523] text-[#f6f7f9] h-full gap-4">
      <div className="flex items-start gap-2 p-3 bg-[#2a2e2c] rounded-lg border border-[#34404f]">
        <FaIcon faIcon={faCircleInfo} color="#ffb386" fontsize={14} />
        <div>
          <p className="text-sm font-semibold text-[#f6f7f9]">
            Send {depositAsset} to another address
          </p>
          <p className="text-xs text-gray-400 mt-1">
            To send {depositAsset}, provide the recipient's address and the
            amount. The amount will be deducted from your balance.
          </p>
        </div>
      </div>

      <div
        className="flex items-center justify-between p-3 rounded-xl bg-[#2a2e2c] border border-[#34404f] cursor-pointer my-2"
        onClick={openAssetPopOver}
      >
        <div className="flex items-center gap-3">
          <img
            src={
              depositAsset == "WBERA"
                ? beralogo
                : depositAsset == "ETH"
                ? ethlogo
                : depositAsset == "USDC"
                ? usdclogo
                : depositAsset == "WUSDC"
                ? usdclogo
                : ethlogo
            }
            alt={depositAsset}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="text-sm font-medium text-[#f6f7f9]">
              {depositAsset == "WUSDC" ? "USDC.E" : depositAsset}
            </p>
            <span className="text-xs text-gray-400">
              {depositAsset == "WBERA"
                ? "Berachain"
                : depositAsset == "ETH"
                ? "Ethereum"
                : depositAsset == "USDC"
                ? "USD Coin (Polygon)"
                : depositAsset == "WUSDC"
                ? "USDC (Berachain)"
                : "Unknown"}
            </span>
          </div>
        </div>
        <FaIcon faIcon={faChevronDown} color="#9ca3af" />
      </div>

      <PopOver anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
        <div className="bg-[#2a2e2c] p-2 rounded-lg shadow-lg border border-[#34404f] w-60">
          <div
            className="flex items-center gap-2 p-2 hover:bg-[#34404f] rounded-lg cursor-pointer"
            onClick={() => {
              setDepositAsset("WBERA");
              setAnchorEl(null);
            }}
          >
            <img src={beralogo} alt="WBERA" className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-sm text-[#f6f7f9]">WBERA</p>
              <span className="text-xs text-gray-400">Berachain</span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 p-2 hover:bg-[#34404f] rounded-lg cursor-pointer"
            onClick={() => {
              setDepositAsset("ETH");
              setAnchorEl(null);
            }}
          >
            <img src={ethlogo} alt="ETH" className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-sm text-[#f6f7f9]">ETH</p>
              <span className="text-xs text-gray-400">Ethereum</span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 p-2 hover:bg-[#34404f] rounded-lg cursor-pointer"
            onClick={() => {
              setDepositAsset("USDC");
              setAnchorEl(null);
            }}
          >
            <img src={usdclogo} alt="USDC" className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-sm text-[#f6f7f9]">USDC</p>
              <span className="text-xs text-gray-400">USD Coin (Polygon)</span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 p-2 hover:bg-[#34404f] rounded-lg cursor-pointer"
            onClick={() => {
              setDepositAsset("WUSDC");
              setAnchorEl(null);
            }}
          >
            <img src={usdclogo} alt="WUSDC" className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-sm text-[#f6f7f9]">USDC.E</p>
              <span className="text-xs text-gray-400">USDC (Berachain)</span>
            </div>
          </div>
        </div>
      </PopOver>

      <div className="space-y-4">
        <OutlinedTextInput
          inputType="text"
          placeholder={`Enter recipient ${depositAsset} address`}
          inputlabalel={`${depositAsset} Address`}
          inputState={receiverAddress}
          setInputState={setReceiverAddress}
        />

        <OutlinedTextInput
          inputType="number"
          placeholder="0.00"
          inputlabalel="Amount to Send"
          inputState={sendAmnt}
          setInputState={setSendAmnt}
          hasError={errorInSendAmount()}
        />
      </div>

      <p className="text-sm text-right text-gray-400 mt-1 pr-1">
        Available: {formatNumber(Number(availableBalance))} {depositAsset}
      </p>

      <BottomButtonContainer>
        <SubmitButton
          text={txverified == null ? "Verify To Send" : "Send"}
          icon={
            <FaIcon
              faIcon={faCircleArrowUp}
              color={
                receiverAddress == "" ||
                sendAmnt == "" ||
                Number(sendAmnt) > Number(availableBalance) ||
                (txStatusBarVisible && transactionStatus == "PENDING")
                  ? colors.textsecondary
                  : colors.primary
              }
            />
          }
          isDisabled={
            receiverAddress == "" ||
            sendAmnt == "" ||
            Number(sendAmnt) > Number(availableBalance) ||
            (txStatusBarVisible && transactionStatus == "PENDING")
          }
          isLoading={txStatusBarVisible && transactionStatus == "PENDING"}
          onclick={onSendCrypto}
          sxstyles={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "2rem",
            fontSize: "0.875rem",
            fontWeight: "bold",
          }}
        />
      </BottomButtonContainer>
    </div>
  );
}
