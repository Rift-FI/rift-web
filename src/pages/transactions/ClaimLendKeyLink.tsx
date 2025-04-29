import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  faArrowRight,
  faCheckCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useAppDialog } from "@/hooks/dialog";
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
import { getBerachainUsdVal } from "@/utils/api/mantra";
import { getEthUsdVal } from "@/utils/ethusd";
import { TransactionStatusWithoutSocket } from "../../components/TransactionStatus";
import { SubmitButton } from "../../components/global/Buttons";
import { colors } from "../../constants";
import { Import } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import poelogo from "../../assets/images/openai-alt.png";
import wberalogo from "../../assets/images/icons/bera.webp";
import usdclogo from "../../assets/images/labs/usdc.png";
import ethlogo from "../../assets/images/eth.png";
import "../../styles/pages/transactions/claimlendkeylink.scss";
import { Loading } from "@/assets/animations";
import { stringToBase64 } from "@/utils/base64";

export default function ClaimLendKeyLink(): JSX.Element {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { switchtab } = useTabs();
  const { openAppDrawerWithKey } = useAppDrawer();
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
      navigate(prev_page);
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
    if (paysecretpurpose === "OPENAI") {
      decodeOpenAiKey();
    } else {
      openAppDrawerWithKey(
        "consumeawxkey",
        paysecretid as string,
        paysecretnonce as string
      ); //keyToshare: secretid, purpose: secretnonce
    }
  };

  const ethUsdValue = localStorage.getItem("ethvalue");
  const wberaUsdValue = localStorage.getItem("WberaUsdVal");

  const { data: ethusdval } = useQuery({
    queryKey: ["ethusd"],
    queryFn: getEthUsdVal,
  });
  const { data: berausdval } = useQuery({
    queryKey: ["berachainusd"],
    queryFn: getBerachainUsdVal,
  });

  const secretAmountInUSD =
    paysecretcurrency === "WBERA"
      ? Number(paysecretamount || 0) * Number(wberaUsdValue || berausdval)
      : paysecretcurrency === "ETH"
      ? Number(paysecretamount || 0) * Number(ethUsdValue || ethusdval)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTxStatus]);

  useBackButton(goBack);

  return (
    <section id="claimlendkeylink">
      <span className="icon_ctr">
        <Import color={colors.textprimary} />
      </span>

      <div className="received_key">
        <img src={poelogo} alt="received-key" />
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
          You have received a paid {paysecretpurpose} key. <br /> Click&nbsp;
          <span>'Get {paysecretpurpose} Key'</span> to pay for the key, <br />
          get access and use the key.
        </p>

        {userGotKey && (
          <>
            <p className="unlocks">
              You successfully paid for the{" "}
              {keydetails ? "---" : paysecretpurpose} key
            </p>
            <SubmitButton
              text="Start Using Key"
              icon={<FaIcon faIcon={faArrowRight} color={colors.primary} />}
              sxstyles={{
                padding: "0.625rem",
                borderRadius: "0.375rem",
              }}
              onclick={onStartUseKey}
            />
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
              ? "USDC.E"
              : paysecretcurrency}
          </p>
        </div>

        <p className="deducts">
          <FaIcon faIcon={faInfoCircle} fontsize={12} color={colors.danger} />
          Amount will be deducted from your balance
        </p>

        <SubmitButton
          text={
            keydetailsloading
              ? "Please wait..."
              : txverified == null
              ? "Verify To Get Key"
              : "Get Key"
          }
          icon={
            <FaIcon
              faIcon={faCheckCircle}
              color={
                processing || userGotKey || keypaymentloading
                  ? colors.textsecondary
                  : colors.primary
              }
            />
          }
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "0.375rem",
          }}
          isDisabled={
            keydetailsloading || processing || userGotKey || keypaymentloading
          }
          isLoading={processing || keypaymentloading}
          onclick={onPayForKeyToUse}
        />
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
