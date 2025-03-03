import { Fragment, JSX } from "react";
import { useTransactionStatus } from "../hooks/txstatus";
import { Notification } from "../assets/animations";
import "../styles/components/transactionstatus.scss";

export const TransactionStatus = (): JSX.Element => {
  const { transactionMessage, transactionStatus, txStatusBarVisible } =
    useTransactionStatus();

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
