import { createContext, useContext, useState, ReactNode } from "react";

export type dialogActionType =
  | "referearn"
  | "loading"
  | "success"
  | "failure"
  | "awxkeyimport";

interface dialogctxtype {
  action: dialogActionType;
  dialogOpen: boolean;
  dialogMessage: string;
  openAppDialog: (
    dialogActionType: dialogActionType,
    dialogmessage: string
  ) => void;
  closeAppDialog: () => void;
}

const appdialogctx = createContext<dialogctxtype>({} as dialogctxtype);

interface providerProps {
  children: ReactNode;
}

export const AppDialogProvider = ({ children }: providerProps): JSX.Element => {
  const [dialogActionType, setdialogActionType] =
    useState<dialogActionType>("referearn");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMessage, setDialogMessage] = useState<string>("");

  const openAppDialog = (
    dialogActionType: dialogActionType,
    dialogmessage: string
  ) => {
    setdialogActionType(dialogActionType);
    setDialogMessage(dialogmessage);
    setDialogOpen(true);
  };

  const closeAppDialog = () => {
    setDialogOpen(false);
  };

  const ctxvalue = {
    action: dialogActionType,
    dialogOpen: dialogOpen,
    dialogMessage,
    openAppDialog,
    closeAppDialog,
  };

  return (
    <appdialogctx.Provider value={ctxvalue}>{children}</appdialogctx.Provider>
  );
};

export const useAppDialog = () => useContext<dialogctxtype>(appdialogctx);
