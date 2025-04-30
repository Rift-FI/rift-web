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
import { useQuery } from "@tanstack/react-query";
import { tabsType, useTabs } from "./hooks/tabs";
import { useAppDrawer } from "./hooks/drawer";
import { checkServerStatus } from "./utils/api/apistatus";
import { BottomTabNavigation } from "./components/Bottom";
import { HomeTab } from "./components/tabs/Home";
import { LabsTab } from "./components/tabs/Lab";
import { Notifications } from "./components/tabs/Notifications";
import { Rewards } from "./components/tabs/Rewards";
import { SendCryptoTab } from "./components/tabs/SendCrypto";
import { ProfileTab } from "./components/tabs/Profile";
import LendToUse from "./pages/lend/LendToUse";
import { Polymarket } from "./components/tabs/Polymarket";
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
    const authsessionversion: string | null = localStorage.getItem(
      "auth_session_version"
    );
    const airdropId = localStorage.getItem("airdropId");
    const starttab = localStorage.getItem("starttab");
    const startpage = localStorage.getItem("startpage");
    // paid key/secret values
    const paysecretnonce = localStorage.getItem("paysecretnonce");

    if (address == null || token == null || authsessionversion == null) {
      navigate("/auth");
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

    if (paysecretnonce !== null) {
      navigate("/claimlendkey");
      return;
    }

    if (utxoId !== null && utxoVal !== null) {
      openAppDrawer("collectfromwallet");
      return;
    }
  }, []);

  const { data, isFetchedAfterMount } = useQuery({
    queryKey: ["serverstatus"],
    refetchInterval: 30000,
    queryFn: checkServerStatus,
  });

  useEffect(() => {
    if (isFetchedAfterMount && data?.status !== 200) {
      navigate("/server-error");
    }
  }, [data?.status]);

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
      ) : currTab == "lend" ? (
        <LendToUse />
      ) : currTab == "labs" ? (
        <LabsTab />
      ) : currTab == "rewards" ? (
        <Rewards />
      ) : currTab == "sendcrypto" ? (
        <SendCryptoTab />
      ) : currTab == "profile" ? (
        <ProfileTab />
      ) : currTab == "polymarket" ? (
        <Polymarket />
      ) : (
        <Notifications />
      )}

      <BottomTabNavigation />
    </section>
  );
}

export default App;
