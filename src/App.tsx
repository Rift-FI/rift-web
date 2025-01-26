import { JSX, Fragment, useEffect, useCallback } from "react";
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
import { VaultTab } from "./components/tabs/Vault";
import { SecurityTab } from "./components/tabs/Security";
import { LabsTab } from "./components/tabs/Lab";
import { EarnTab } from "./components/tabs/Earn";
import { Profile } from "./components/tabs/Profile";
import "../src/index.css";

function App(): JSX.Element {
  const navigate = useNavigate();
  const { currTab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  const checkAccessUser = useCallback(async () => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");

    const utxoId = localStorage.getItem("utxoId");
    const utxoVal = localStorage.getItem("utxoVal");

    if (address == null || token == null) {
      navigate("/auth");
      return;
    }

    if (utxoId !== null && utxoVal !== null) {
      openAppDrawer("sendfromtoken");
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
  });

  return (
    <section>
      {currTab == "home" ? (
        <Fragment>
          <VaultTab />
        </Fragment>
      ) : currTab == "security" ? (
        <Fragment>
          <SecurityTab />
        </Fragment>
      ) : currTab == "earn" ? ( // earn -> defi (staking+coins)
        <Fragment>
          <EarnTab />
        </Fragment>
      ) : currTab == "labs" ? (
        <Fragment>
          <LabsTab />
        </Fragment>
      ) : (
        <Fragment>
          <Profile />
        </Fragment>
      )}

      <BottomTabNavigation />
    </section>
  );
}

export default App;
