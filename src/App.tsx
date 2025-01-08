import { JSX, Fragment, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  useLaunchParams,
  mountClosingBehavior,
  enableClosingConfirmation,
  unmountClosingBehavior,
  isSwipeBehaviorSupported,
  mountSwipeBehavior,
  disableVerticalSwipes,
  unmountSwipeBehavior,
} from "@telegram-apps/sdk-react";
import { useTabs } from "./hooks/tabs";
import { SnackBar } from "./components/global/SnackBar";
import { useAppDrawer } from "./hooks/drawer";
import { earnFromReferral } from "./utils/api/refer";
import { BottomTabNavigation } from "./components/Bottom";
import { VaultTab } from "./components/tabs/Vault";
import { MarketTab } from "./components/tabs/Market";
import { SecurityTab } from "./components/tabs/Security";
import { LabsTab } from "./components/tabs/Lab";
import { AppDrawer } from "./components/global/AppDrawer";
import { EarnTab } from "./components/tabs/Earn";

function App(): JSX.Element {
  const { currTab } = useTabs();
  const { openAppDrawer } = useAppDrawer();
  const { startParam } = useLaunchParams();

  const navigate = useNavigate();

  const rewardReferrer = async () => {
    const referrerId = localStorage.getItem("referalId");

    if (referrerId !== null) {
      await earnFromReferral(referrerId as string);

      localStorage.removeItem("referalId");
      return;
    }
  };

  const checkStartParams = () => {
    if (startParam) {
      if (startParam.startsWith("ref")) {
        // opened with referal link
        const [_, id] = startParam.split("-");
        localStorage.setItem("referalId", id);
        return;
      }

      let data = startParam.split("-");
      // opened with collectible link
      if (data.length == 1) {
        const [utxoId, utxoVal] = startParam.split("=");

        if (utxoId && utxoVal) {
          localStorage.setItem("utxoId", utxoId);
          localStorage.setItem("utxoVal", utxoVal);
        }

        return;
      }
    }
  };

  const checkAccessUser = useCallback(async () => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");
    // referer
    const referrerId = localStorage.getItem("referalId");
    // collectible
    const utxoId = localStorage.getItem("utxoId");
    const utxoVal = localStorage.getItem("utxoVal");

    if (address == "" || address == null || token == "" || token == null) {
      navigate("/signup");
      return;
    }

    if (referrerId !== null) {
      await rewardReferrer();
      return;
    }

    if (utxoId !== null && utxoVal !== null) {
      openAppDrawer("sendfromtoken");
      return;
    }
  }, []);

  useEffect(() => {
    checkStartParams();
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
  });

  return (
    <section>
      {currTab == "vault" ? (
        <Fragment>
          <VaultTab />
        </Fragment>
      ) : currTab == "security" ? (
        <Fragment>
          <SecurityTab />
        </Fragment>
      ) : currTab == "market" ? (
        <Fragment>
          <MarketTab />
        </Fragment>
      ) : currTab == "labs" ? (
        <Fragment>
          <LabsTab />
        </Fragment>
      ) : (
        <Fragment>
          <EarnTab />
        </Fragment>
      )}

      <SnackBar />
      <AppDrawer />
      <BottomTabNavigation />
    </section>
  );
}

export default App;
