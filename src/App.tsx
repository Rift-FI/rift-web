import { JSX, Fragment, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useTabs } from "./hooks/tabs";
import { SnackBar } from "./components/global/SnackBar";
import { useAppDrawer } from "./hooks/drawer";
import { BottomTabNavigation } from "./components/Bottom";
import { VaultTab } from "./components/tabs/Vault";
import { MarketTab } from "./components/tabs/Market";
import { SecurityTab } from "./components/tabs/Security";
import { AppDrawer } from "./components/global/AppDrawer";
import "./styles/app.css";

function App(): JSX.Element {
  const { currTab } = useTabs();
  const { openAppDrawer } = useAppDrawer();
  const { startParam } = useLaunchParams();

  const navigate = useNavigate();

  const checkAccessUser = useCallback(() => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");
    let utxoId = localStorage.getItem("utxoId");

    if (address == "" || address == null || token == "" || token == null) {
      navigate("/signup");
    }

    if (startParam) {
      alert("startparam is "+ startParam)
      localStorage.setItem("utxoId", startParam as string);
      openAppDrawer("sendfromtoken");
    }

    if (utxoId) {
      alert("tHERE IS A UTXO ID")
      openAppDrawer("sendfromtoken");
    }
  }, []);

  useEffect(() => {
    checkAccessUser();
  }, []);

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
      ) : (
        <Fragment>
          <div id="appctr">
            <p>Coming soon!</p>
          </div>
        </Fragment>
      )}

      <SnackBar />
      <AppDrawer />
      <BottomTabNavigation />
    </section>
  );
}

export default App;
