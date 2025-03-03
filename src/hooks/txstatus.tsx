import { createContext, useContext, useState, ReactNode } from "react";

export type txStatus = "PENDING" | "PROCESSED" | "FAILED";

interface txStatusCtxType {
  transactionStatus: txStatus;
  transactionMessage: string;
  txStatusBarVisible: boolean;
  showTxStatusBar: (newStatus: txStatus, message: string) => void;
  hideTxStatusBar: () => void;
}

const txstatusrctx = createContext<txStatusCtxType>({} as txStatusCtxType);

interface providerProps {
  children: ReactNode;
}

export const TxStatusProvider = ({ children }: providerProps): JSX.Element => {
  const [transactionStatus, setTransactionStatus] =
    useState<txStatus>("PENDING");
  const [transactionMessage, setTransactionMessage] = useState<string>("");
  const [txStatusBarVisible, setTxStatusBarVisible] = useState<boolean>(false);

  const showTxStatusBar = (newStatus: txStatus, message: string) => {
    setTransactionStatus(newStatus);
    setTransactionMessage(message);
    setTxStatusBarVisible(true);
  };

  const hideTxStatusBar = () => {
    setTxStatusBarVisible(false);
  };

  const ctxvalue = {
    transactionStatus,
    transactionMessage,
    txStatusBarVisible,
    showTxStatusBar,
    hideTxStatusBar,
  };

  return (
    <txstatusrctx.Provider value={ctxvalue}>{children}</txstatusrctx.Provider>
  );
};

export const useTransactionStatus = () =>
  useContext<txStatusCtxType>(txstatusrctx);
