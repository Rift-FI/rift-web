import { createContext, useContext, useState, ReactNode } from "react";

export type tabsType =
  | "home"
  | "labs"
  | "polymarket"
  | "lend"
  | "rewards"
  | "sendcrypto"
  | "profile"
  | "notifications";

interface tabsctxtype {
  currTab: tabsType;
  switchtab: (newtab: tabsType) => void;
}

const tabsctx = createContext<tabsctxtype>({} as tabsctxtype);

interface providerProps {
  children: ReactNode;
}

export const TabsProvider = ({ children }: providerProps): JSX.Element => {
  const [currTab, setCurrTab] = useState<tabsType>("home");

  const switchtab = (newtab: tabsType): void => {
    setCurrTab(newtab);
  };

  const ctxvalue = {
    currTab,
    switchtab,
  };

  return <tabsctx.Provider value={ctxvalue}>{children}</tabsctx.Provider>;
};

export const useTabs = () => useContext<tabsctxtype>(tabsctx);
