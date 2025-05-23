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
      console.log("TXConfirmed event - the transaction was completed");

      showTxStatusBar("PROCESSED", "Transaction completed");

      setTimeout(() => {
        hideTxStatusBar();
      }, 5000);
    });

    socket.on("TXFailed", () => {
      console.log("TXFailed event - the transaction failed");

      showTxStatusBar("FAILED", "Transaction failed");

      setTimeout(() => {
        hideTxStatusBar();
      }, 5000);
    });

    return () => {
      socket.off("TXConfirmed");
      socket.off("TXFailed");
    };
  }, [socket, showTxStatusBar]);

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

export const TransactionStatusWithoutSocket = ({
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
