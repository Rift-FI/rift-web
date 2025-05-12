import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppDialog } from "../../hooks/dialog";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import { useSocket } from "../../utils/SocketProvider";
import { useSnackbar } from "../../hooks/snackbar";
import { numberFormat } from "../../utils/formatters";
import {
  doKeyPayment,
  UseOpenAiKey,
  doKeyPaymentSuccess,
  getKeyDetails,
} from "../../utils/api/keys";
import { fetchCoinInfo } from "../../utils/coingecko/markets";
import { stringToBase64 } from "../../utils/base64";
import { TransactionStatusWithoutSocket } from "../../components/TransactionStatus";
import { Check } from "../../assets/icons";
import { Loading } from "../../assets/animations";
import { colors } from "../../constants";
import openailogo from "../../assets/images/logos/openai.png";
import wberalogo from "../../assets/images/logos/bera.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import ethlogo from "../../assets/images/logos/eth.png";
import "../../styles/pages/transactions/claimlendkeylink.scss";

export default function ClaimLendKeyLink(): JSX.Element {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { switchtab } = useTabs();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { openAppDrawer } = useAppDrawer();

  const [processing, setProcessing] = useState<boolean>(false);
  const [userGotKey, setUserGotKey] = useState<boolean>(false);
  const [showTxStatus, setShowTxStatus] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<"PENDING" | "PROCESSED" | "FAILED">(
    "PENDING"
  );
  const [txMessage, setTxMessage] = useState<string>("");

  const paysecretnonce = localStorage.getItem("paysecretnonce");

  const { data: ethereumInfo } = useQuery({
    queryKey: ["ethinfo"],
    queryFn: () => fetchCoinInfo("ethereum"),
  });

  const { data: beraInfo } = useQuery({
    queryKey: ["berachainbera"],
    queryFn: () => fetchCoinInfo("berachain-bera"),
  });

  const { data: keydetails, isFetching: keydetailsloading } = useQuery({
    queryKey: ["keydetails"],
    queryFn: () => getKeyDetails(paysecretnonce as string),
  });

  const paysecretreceiver = keydetails?.email;
  const paysecretid = keydetails?.id;
  const paysecretpurpose = keydetails?.purpose;
  const paysecretamount = keydetails?.paymentValue;
  const paysecretcurrency = keydetails?.paymentCurrency;
  const txverified = localStorage.getItem("txverified");
  const prev_page = localStorage.getItem("prev_page");

  const { mutate: mutatekeypayment, isPending: keypaymentloading } =
    useMutation({
      mutationFn: () =>
        doKeyPayment(paysecretnonce as string)
          .then((res) => {
            if (res?.status !== 400) {
              setTxStatus("PENDING");
              setTxMessage(
                `Transferring ${numberFormat(
                  Number(paysecretamount)
                )} ${paysecretcurrency}`
              );
              setShowTxStatus(true);
              setProcessing(true);
            } else {
              setProcessing(false);
              showerrorsnack("You cannot pay for your own key!");
            }
          })
          .catch(() => {
            setProcessing(false);
            showerrorsnack("An error occurred, please try again");
          }),
    });

  const onPayForKeyToUse = () => {
    if (txverified == null) {
      openAppDrawer("verifytxwithotp");
      return;
    } else {
      mutatekeypayment();
    }
  };

  const goBack = () => {
    localStorage.removeItem("paysecretid");
    localStorage.removeItem("paysecretnonce");
    localStorage.removeItem("paysecretpurpose");
    localStorage.removeItem("paysecretamount");
    localStorage.removeItem("paysecretcurrency");

    if (prev_page == null) {
      switchtab("home");
      navigate("/app");
    } else {
      switchtab("keys");
      navigate("/app");
    }
  };

  const decodeOpenAiKey = async () => {
    openAppDialog("loading", "Preparing your chat...");

    const { response, accessToken, conversationId } = await UseOpenAiKey(
      stringToBase64(keydetails?.email as string),
      paysecretnonce as string
    );

    if (response && accessToken && conversationId) {
      closeAppDialog();

      navigate(`/chat/${conversationId}/${accessToken}/${paysecretnonce}`);
    } else {
      openAppDialog(
        "failure",
        "Failed to start a conversation, please try again !"
      );
    }
  };

  const onStartUseKey = () => {
    decodeOpenAiKey();
  };

  const secretAmountInUSD =
    paysecretcurrency === "WBERA"
      ? Number(paysecretamount || 0) *
        Number(beraInfo?.market_data?.current_price?.usd)
      : paysecretcurrency === "ETH"
      ? Number(paysecretamount || 0) *
        Number(ethereumInfo?.market_data?.current_price?.usd)
      : Number(paysecretamount || 0) * 0.99;

  useEffect(() => {
    if (!socket) return;

    socket.on("TXConfirmed", (data) => {
      setTxStatus("PROCESSED");
      setTxMessage("Transaction completed");
      setShowTxStatus(true);

      doKeyPaymentSuccess(
        paysecretnonce as string,
        paysecretreceiver as string,
        data?.transactionHash,
        secretAmountInUSD
      ).then(() => {
        setProcessing(false);
        setUserGotKey(true);
        localStorage.removeItem("txverified");
      });

      setTimeout(() => {
        setShowTxStatus(false);
      }, 4500);

      socket.on("KeyUnlocked", () => {
        showsuccesssnack("Key was unlocked successfully");
        setProcessing(false);
        setUserGotKey(true);
      });
    });

    socket.on("TXFailed", () => {
      setTxStatus("FAILED");
      setTxMessage("Transaction failed");
      setShowTxStatus(true);

      showerrorsnack("Transaction failed, please try again");
      setProcessing(false);

      setTimeout(() => {
        setShowTxStatus(false);
      }, 4500);
    });

    return () => {
      if (!socket) return;

      socket.off("TXConfirmed");
      socket.off("TXFailed");
      socket.off("KeyUnlocked");
    };
  }, [showTxStatus]);

  useBackButton(goBack);

  return (
    <section id="claimlendkeylink">
      <div className="received_key">
        <img src={openailogo} alt="received-key" />
        <p className="key_val">
          {keydetailsloading ? (
            <Loading />
          ) : (
            <>
              {paysecretpurpose} <span>{paysecretid}</span>
            </>
          )}
        </p>
        <p className="desc">
          You have received a paid {paysecretpurpose} key. <br /> Verify with
          your phone number to pay for the key,
          <br />
          get access and start using the key.
        </p>

        {userGotKey && (
          <>
            <p className="unlocks">
              You successfully paid for the{" "}
              {keydetails ? "---" : paysecretpurpose} key
            </p>

            <button onClick={() => onStartUseKey()}>Start Using Key</button>
          </>
        )}
      </div>

      <div className="pay_key_ctr">
        <p className="title">
          Pay&nbsp;
          <span>
            {keydetailsloading ? "- - -" : paysecretamount}&nbsp;
            {!keydetailsloading && paysecretcurrency}
          </span>
          &nbsp;To Use Key
        </p>

        <div className="amount">
          <img
            src={
              paysecretcurrency === "USDC" || paysecretcurrency === "WUSDC"
                ? usdclogo
                : paysecretcurrency === "WBERA"
                ? wberalogo
                : ethlogo
            }
            alt="payment-token"
          />
          <p>
            {keydetailsloading ? "- - -" : paysecretamount}&nbsp;
            {!keydetailsloading && paysecretcurrency == "WUSDC"
              ? "USDC.e"
              : paysecretcurrency}
          </p>
        </div>

        <p className="deducts">Amount will be deducted from your balance</p>

        <button
          disabled={
            keydetailsloading || processing || userGotKey || keypaymentloading
          }
          onClick={() => onPayForKeyToUse()}
          className="submit-claim"
        >
          {keydetailsloading
            ? "Please wait..."
            : txverified == null
            ? "Verify To Get Key"
            : "Get Key"}
          <Check color={colors.textprimary} />
        </button>
      </div>

      {showTxStatus && (
        <TransactionStatusWithoutSocket
          transactionStatus={txStatus}
          transactionMessage={txMessage}
        />
      )}
    </section>
  );
}
