import { JSX, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  mountClosingBehavior,
  enableClosingConfirmation,
  unmountClosingBehavior,
  isSwipeBehaviorSupported,
  mountSwipeBehavior,
  disableVerticalSwipes,
  unmountSwipeBehavior,
} from "@telegram-apps/sdk-react";
import { useTabs } from "./hooks/tabs";
import { useAppDrawer } from "./hooks/drawer";
import { BottomTabNavigation } from "./components/Bottom";
import { HomeTab } from "./components/tabs/Home";
import { SecurityTab } from "./components/tabs/Security";
import { LabsTab } from "./components/tabs/Lab";
import { DefiTab } from "./components/tabs/Defi";
import { Notifications } from "./components/tabs/Notifications";
import { Rewards } from "./components/tabs/Rewards";
import { SendCryptoTab } from "./components/tabs/SendCrypto";

function App(): JSX.Element {
  const navigate = useNavigate();
  const { openAppDrawer } = useAppDrawer();
  const { switchtab, currTab } = useTabs();

  // collect link id & value
  const utxoId = localStorage.getItem("utxoId");
  const utxoVal = localStorage.getItem("utxoVal");

  const checkAccessUser = useCallback(async () => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");
    let airdropId = localStorage.getItem("airdropId");
    const userhaspin = localStorage.getItem("userhaspin");

    if (address == null || token == null) {
      navigate("/auth");
      return;
    }

    if (airdropId !== null) {
      switchtab("rewards");
    }

    if (utxoId !== null && utxoVal !== null) {
      openAppDrawer("collectfromwallet");
      return;
    }

    if (userhaspin == null) {
      openAppDrawer("addpin");
      return;
    }
  }, []);

  useEffect(() => {
    checkAccessUser();
  }, []);

  useEffect(() => {
    mountClosingBehavior();

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
    <section>
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
      ) : (
        <Notifications />
      )}

      <BottomTabNavigation />
    </section>
  );
}

export default App;
