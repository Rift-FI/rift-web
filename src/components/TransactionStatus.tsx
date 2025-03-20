import { Fragment, JSX, useEffect } from "react";
import { useTransactionStatus } from "../hooks/txstatus";
import { useSocket } from "../utils/SocketProvider";
import { Notification } from "../assets/animations";
import "../styles/components/transactionstatus.scss";

export const TransactionStatus = (): JSX.Element => {
  const { socket } = useSocket();
  const {
    showTxStatusBar,
    hideTxStatusBar,
    transactionMessage,
    transactionStatus,
    txStatusBarVisible,
  } = useTransactionStatus();

  useEffect(() => {
    if (!socket) return;

    socket.on("TXConfirmed", () => {
      showTxStatusBar("PROCESSED", "Transaction completed");

      setTimeout(() => {
        hideTxStatusBar();
      }, 3500);
    });

    socket.on("TXFailed", () => {
      showTxStatusBar("FAILED", "Transaction failed");

      setTimeout(() => {
        hideTxStatusBar();
      }, 3500);
    });

    return () => {
      if (!socket) return;

      socket.off("TXConfirmed");
      socket.off("TXFailed");
    };
  }, [showTxStatusBar]);

  return (
    <Fragment>
      {txStatusBarVisible && (
        <div id="transactionstatus">
          <div className="animation_ctr">
            <Notification width="1.75rem" height="1.75rem" />

            <p>{transactionMessage}</p>
          </div>

          <p className="tx_status">{transactionStatus}</p>
        </div>
      )}
    </Fragment>
  );
};

export const KeyPaymentTransactionStatus = ({
  transactionMessage,
  transactionStatus,
}: {
  transactionMessage: string;
  transactionStatus: string;
}): JSX.Element => {
  return (
    <Fragment>
      <div id="transactionstatus">
        <div className="animation_ctr">
          <Notification width="1.75rem" height="1.75rem" />

          <p>{transactionMessage}</p>
        </div>

        <p className="tx_status">{transactionStatus}</p>
      </div>
    </Fragment>
  );
};
