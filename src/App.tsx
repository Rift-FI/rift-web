import { JSX, Fragment, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import {
  mountClosingBehavior,
  enableClosingConfirmation,
  unmountClosingBehavior,
  isSwipeBehaviorSupported,
  mountSwipeBehavior,
  disableVerticalSwipes,
  unmountSwipeBehavior,
  useLaunchParams,
} from "@telegram-apps/sdk-react";
import { useTabs } from "./hooks/tabs";
import { useAppDrawer } from "./hooks/drawer";
import { useAppDialog } from "./hooks/dialog";
import { useSnackbar } from "./hooks/snackbar";
import { base64ToString } from "./utils/base64";
import { earnFromReferral, rewardNewUser } from "./utils/api/refer";
import { BottomTabNavigation } from "./components/Bottom";
import { HomeTab } from "./components/tabs/Home";
import { SecurityTab } from "./components/tabs/Security";
import { LabsTab } from "./components/tabs/Lab";
import { DefiTab } from "./components/tabs/Defi";
import { Profile } from "./components/tabs/Profile";
import "../src/index.css";

function App(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { currTab } = useTabs();
  const { openAppDrawer } = useAppDrawer();
  const { showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const tgUsername = initData?.user?.username as string;

  // collect
  const utxoId = localStorage.getItem("utxoId");
  const utxoVal = localStorage.getItem("utxoVal");

  // referal
  const referCode = localStorage.getItem("referCode");
  const referrerUsername = localStorage.getItem("referrerUsername");
  const referaltype = localStorage.getItem("referaltype");

  const { mutate: mutateRewardReferrer, isSuccess: rewardRefererOk } =
    useMutation({
      mutationFn: () =>
        earnFromReferral(referCode as string, referaltype as string),
    });
  const { mutate: mutateRewardNewUser, isSuccess: rewardNewUserOk } =
    useMutation({ mutationFn: rewardNewUser });

  const checkAccessUser = useCallback(async () => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");
    let airdropId = localStorage.getItem("airdropId");

    if (address == null || token == null) {
      navigate("/auth");
      return;
    }

    if (airdropId !== null) {
      navigate(`/rewards/${airdropId}`);
    }

    if (utxoId !== null && utxoVal !== null) {
      openAppDrawer("collectfromwallet");
      return;
    }

    if (
      referCode !== null &&
      referaltype !== null &&
      base64ToString(referrerUsername) !== tgUsername
    ) {
      openAppDialog(
        "loading",
        "Unlocking your rewards for joining StratoSphere, please wait.."
      );

      mutateRewardReferrer();
      mutateRewardNewUser();

      if (rewardRefererOk && rewardNewUserOk) {
        localStorage.removeItem("referCode");
        localStorage.removeItem("referrerUsername");
        localStorage.removeItem("referaltype");

        showsuccesssnack("You earned 1 OM for joining Stratosphere");
        closeAppDialog();
      } else {
        localStorage.removeItem("referCode");
        localStorage.removeItem("referrerUsername");
        localStorage.removeItem("referaltype");

        openAppDialog(
          "failure",
          `Sorry, we couldn't unlock your rewards at the moment...`
        );
      }

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
          <HomeTab />
        </Fragment>
      ) : currTab == "security" ? (
        <Fragment>
          <SecurityTab />
        </Fragment>
      ) : currTab == "earn" ? ( // earn -> defi (staking+coins)
        <Fragment>
          <DefiTab />
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
