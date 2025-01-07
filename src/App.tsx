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
import { BottomTabNavigation } from "./components/Bottom";
import { VaultTab } from "./components/tabs/Vault";
import { MarketTab } from "./components/tabs/Market";
import { SecurityTab } from "./components/tabs/Security";
import { LabsTab } from "./components/tabs/Lab";
import { AppDrawer } from "./components/global/AppDrawer";
import { EarnTab } from "./components/tabs/Earn";
import { earnFromReferral } from "./utils/api/refer";

function App(): JSX.Element {
  const { currTab } = useTabs();
  const { openAppDrawer } = useAppDrawer();
  const { startParam } = useLaunchParams();

  const navigate = useNavigate();

  const checkAccessUser = useCallback(async () => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");

    if (address == "" || address == null || token == "" || token == null) {
      navigate("/signup");
    }

    if (startParam) {
      if(startParam.startsWith("ref")){
        //know that this is a refferal and split by -
        const [_ ,id]=startParam.split("-");
        //call the backend to send some tokens to the refferer
        let refferal=  await earnFromReferral(id);
        if(refferal){
        return   alert(`Succesfully created an account using a refferal link`)
        }

      else{
       return  alert(`Could not find the refferal code`)
      }
        
      }
      let data = startParam.split("-");

      if (data.length == 1) {
        const [utxoId, utxoVal] = startParam.split("=");

        openAppDrawer("sendfromtoken");

        if (utxoId && utxoVal) {
          localStorage.setItem("utxoId", utxoId);
          localStorage.setItem("utxoVal", utxoVal);
        }
      }
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
