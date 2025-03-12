import { createContext, useContext, useState, ReactNode } from "react";

export type draweraction =
  | "collectfromwallet"
  | "consumekey"
  | "sendairdroplink"
  | "quickactions"
  | "nodeteeselector"
  | "transactionlimit"
  | "createkey"
  | "deleteemail"
  | "deletephone"
  | "paymentlink"
  | "revokesecretaccess"
  | "stakepst"
  | "unlocktransactions";

interface draerctxtype {
  action: draweraction;
  drawerOpen: boolean;
  keyToshare?: string;
  linkUrl?: string;
  secretPurpose?: string;
  openAppDrawer: (drawerAction: draweraction) => void;
  openAppDrawerWithKey: (
    drawerAction: draweraction,
    keyToshare?: string,
    purpose?: string
  ) => void;
  openAppDrawerWithUrl: (drawerAction: draweraction, linkUrl?: string) => void;
  closeAppDrawer: () => void;
}

const appdrawerctx = createContext<draerctxtype>({} as draerctxtype);

interface providerProps {
  children: ReactNode;
}

export const AppDrawerProvider = ({ children }: providerProps): JSX.Element => {
  const [drawerAction, setDrawerAction] =
    useState<draweraction>("collectfromwallet");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [keyToshare, setKeyToshare] = useState<string>("");
  const [linkUrl, setSecretUrl] = useState<string>("");
  const [secretPurpose, setSecretPurpose] = useState<string>("");

  const openAppDrawer = (drawerAction: draweraction) => {
    setDrawerAction(drawerAction);
    setDrawerOpen(true);
  };

  const openAppDrawerWithKey = (
    drawerAction: draweraction,
    keyToshare?: string,
    purpose?: string
  ) => {
    setDrawerAction(drawerAction);
    setKeyToshare(keyToshare as string);
    setSecretPurpose(purpose as string);
    setDrawerOpen(true);
  };

  const openAppDrawerWithUrl = (
    drawerAction: draweraction,
    linkUrl?: string
  ) => {
    setDrawerAction(drawerAction);
    setSecretUrl(linkUrl as string);
    setDrawerOpen(true);
  };

  const closeAppDrawer = () => {
    setDrawerOpen(false);
  };

  const ctxvalue = {
    action: drawerAction,
    drawerOpen: drawerOpen,
    keyToshare,
    linkUrl,
    secretPurpose,
    openAppDrawer,
    openAppDrawerWithKey,
    openAppDrawerWithUrl,
    closeAppDrawer,
  };

  return (
    <appdrawerctx.Provider value={ctxvalue}>{children}</appdrawerctx.Provider>
  );
};

export const useAppDrawer = () => useContext<draerctxtype>(appdrawerctx);
