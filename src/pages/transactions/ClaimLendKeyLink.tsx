import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import {
  faArrowRight,
  faCheckCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useAppDialog } from "@/hooks/dialog";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import { base64ToString } from "../../utils/base64";
import { useSocket } from "../../utils/SocketProvider";
import { useSnackbar } from "../../hooks/snackbar";
import { numberFormat } from "../../utils/formatters";
import { doKeyPayment, UseOpenAiKey } from "../../utils/api/keys";
import { TransactionStatusWithoutSocket } from "../../components/TransactionStatus";
import { SubmitButton } from "../../components/global/Buttons";
import { colors } from "../../constants";
import { Import } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import poelogo from "../../assets/images/icons/poe.png";
import wberalogo from "../../assets/images/icons/bera.webp";
import usdclogo from "../../assets/images/labs/usdc.png";
import ethlogo from "../../assets/images/eth.png";
import "../../styles/pages/transactions/claimlendkeylink.scss";

export default function ClaimLendKeyLink(): JSX.Element {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { switchtab } = useTabs();
  const { openAppDrawerWithKey } = useAppDrawer();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [processing, setProcessing] = useState<boolean>(false);
  const [userGotKey, setUserGotKey] = useState<boolean>(false);
  const [showTxStatus, setShowTxStatus] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<"PENDING" | "PROCESSED" | "FAILED">(
    "PENDING"
  );
  const [txMessage, setTxMessage] = useState<string>("");

  const paysecretreceiver = localStorage.getItem("paysecretreceiver");
  const paysecretid = localStorage.getItem("paysecretid");
  const paysecretnonce = localStorage.getItem("paysecretnonce");
  const paysecretpurpose = localStorage.getItem("paysecretpurpose");
  const paysecretamount = localStorage.getItem("paysecretamount");
  const paysecretcurrency = localStorage.getItem("paysecretcurrency");
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
      paysecretid as string,
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

  useEffect(() => {
    if (!socket) return;

    socket.on("TXConfirmed", () => {
      setTxStatus("PROCESSED");
      setTxMessage("Transaction completed");
      setShowTxStatus(true);

      setTimeout(() => {
        setShowTxStatus(false);
      }, 4500);

      socket.emit("paymentKeySuccess", {
        email: paysecretreceiver?.includes("==")
          ? base64ToString(paysecretreceiver)
          : paysecretreceiver,
        nonce: paysecretnonce,
      });

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
          {paysecretpurpose} <span>{paysecretid}</span>
        </p>
        <p className="desc">
          You have received a paid {paysecretpurpose} key. <br /> Click&nbsp;
          <span>'Get {paysecretpurpose} Key'</span> to pay for the key, <br />
          get access and use the key.
        </p>

        {userGotKey && (
          <>
            <p className="unlocks">
              You successfully paid for the {paysecretpurpose} key
            </p>
            <SubmitButton
              text="Start Using Key"
              icon={<FaIcon faIcon={faArrowRight} color={colors.textprimary} />}
              sxstyles={{
                padding: "0.625rem",
                borderRadius: "0.375rem",
                backgroundColor: colors.success,
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
            {paysecretamount}&nbsp;
            {paysecretcurrency}
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
            alt="mantra"
          />
          <p>
            {paysecretamount}&nbsp;
            {paysecretcurrency}
          </p>
        </div>

        <p className="deducts">
          <FaIcon faIcon={faInfoCircle} fontsize={12} color={colors.danger} />
          Amount will be deducted from your balance
        </p>

        <SubmitButton
          text="Get Key"
          icon={
            <FaIcon
              faIcon={faCheckCircle}
              color={
                processing || userGotKey || keypaymentloading
                  ? colors.textsecondary
                  : colors.textprimary
              }
            />
          }
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "0.375rem",
            backgroundColor:
              processing || userGotKey || keypaymentloading
                ? colors.divider
                : colors.success,
          }}
          isDisabled={processing || userGotKey || keypaymentloading}
          isLoading={processing || keypaymentloading}
          onclick={mutatekeypayment}
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
