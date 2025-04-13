import { JSX, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  miniApp,
  mountClosingBehavior,
  enableClosingConfirmation,
  unmountClosingBehavior,
  isSwipeBehaviorSupported,
  mountSwipeBehavior,
  disableVerticalSwipes,
  unmountSwipeBehavior,
} from "@telegram-apps/sdk-react";
import { tabsType, useTabs } from "./hooks/tabs";
import { useAppDrawer } from "./hooks/drawer";
import { BottomTabNavigation } from "./components/Bottom";
import { HomeTab } from "./components/tabs/Home";
import { SecurityTab } from "./components/tabs/Security";
import { LabsTab } from "./components/tabs/Lab";
import { DefiTab } from "./components/tabs/Defi";
import { Notifications } from "./components/tabs/Notifications";
import { Rewards } from "./components/tabs/Rewards";
import { SendCryptoTab } from "./components/tabs/SendCrypto";
import { ProfileTab } from "./components/tabs/Profile";
import "./index.css";
function App(): JSX.Element {
  const navigate = useNavigate();
  const { openAppDrawer } = useAppDrawer();
  const { switchtab, currTab } = useTabs();

  // collect link id & value
  const utxoId = localStorage.getItem("utxoId");
  const utxoVal = localStorage.getItem("utxoVal");

  const checkAccessUser = useCallback(async () => {
    const address: string | null = localStorage.getItem("ethaddress");
    const token: string | null = localStorage.getItem("spheretoken");
    const airdropId = localStorage.getItem("airdropId");
    const starttab = localStorage.getItem("starttab");
    const startpage = localStorage.getItem("startpage");
    // paid key/secret values
    const paysecretid = localStorage.getItem("paysecretid");
    const paysecretnonce = localStorage.getItem("paysecretnonce");
    const paysecretpurpose = localStorage.getItem("paysecretpurpose");
    const paysecretamount = localStorage.getItem("paysecretamount");
    const paysecretcurrency = localStorage.getItem("paysecretcurrency");

    if (address == null || token == null) {
      navigate("/auth/phone");
      return;
    }

    if (starttab !== null) {
      const tab = starttab as string as tabsType;
      switchtab(tab);
    }

    if (startpage !== null) {
      navigate(`/${startpage}`);
      return;
    }

    if (airdropId !== null) {
      switchtab("rewards");
      return;
    }

    if (
      paysecretid !== null &&
      paysecretnonce !== null &&
      paysecretpurpose !== null &&
      paysecretamount !== null &&
      paysecretcurrency !== null
    ) {
      navigate("/claimlendkey");
      return;
    }

    if (utxoId !== null && utxoVal !== null) {
      openAppDrawer("collectfromwallet");
      return;
    }
  }, []);

  useEffect(() => {
    checkAccessUser();
  }, []);

  useEffect(() => {
    if (miniApp.mount.isAvailable()) {
      miniApp.mount();
      miniApp.setHeaderColor("#0e0e0e");
      miniApp.setBottomBarColor("#0e0e0e");

      mountClosingBehavior();
    }

    if (isSwipeBehaviorSupported()) {
      mountSwipeBehavior();
    }

    enableClosingConfirmation();
    disableVerticalSwipes();

    return () => {
      unmountClosingBehavior();
      unmountSwipeBehavior();
    };
  }, []);

  return (
    <section className="bg-[#0e0e0e] h-screen overflow-y-scroll">
      {currTab == "home" ? (
        <HomeTab />
      ) : currTab == "security" ? (
        <SecurityTab />
      ) : currTab == "earn" ? (
        <DefiTab />
      ) : currTab == "labs" ? (
        <LabsTab />
      ) : currTab == "rewards" ? (
        <Rewards />
      ) : currTab == "sendcrypto" ? (
        <SendCryptoTab />
      ) : currTab == "profile" ? (
        <ProfileTab />
      ) : (
        <Notifications />
      )}

      <BottomTabNavigation />
    </section>
  );
}

export default App;
