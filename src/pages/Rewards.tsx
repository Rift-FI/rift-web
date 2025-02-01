import { JSX, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  backButton,
  openLink,
  openTelegramLink,
} from "@telegram-apps/sdk-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useTabs } from "../hooks/tabs";
import { useSnackbar } from "../hooks/snackbar";
import { useAppDialog } from "../hooks/dialog";
import {
  claimAirdrop,
  getUnlockedTokens,
  unlockTokens,
  unlockTokensType,
} from "../utils/api/airdrop";
import { formatUsd } from "../utils/formatters";
import { getMantraUsdVal } from "../utils/api/mantra";
import { Confetti } from "../assets/animations";
import { CheckAlt, Lock, Stake } from "../assets/icons";
import { colors } from "../constants";
import rewards from "../assets/images/icons/rewards.png";
import shareapp from "../assets/images/refer.png";
import staketokens from "../assets/images/icons/lendto.png";
import evident from "../assets/images/labs/evident.png";
import "../styles/pages/rewards.scss";

export default function Rewards(): JSX.Element {
  const { id } = useParams();
  const { invalidateQueries } = useQueryClient();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showerrorsnack } = useSnackbar();
  const { showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [animationplayed, setAnimationPlayed] = useState<boolean>(false);

  const airdropId = id == "nil" ? "nil" : id?.split("-")[1];

  const { data: mantrausdval } = useQuery({
    queryKey: ["mantrausd"],
    queryFn: getMantraUsdVal,
  });

  const { data: unlocked } = useQuery({
    queryKey: ["getunlocked"],
    queryFn: getUnlockedTokens,
  });

  // claim airdrop
  const { mutate: mutateClaimAirdrop } = useMutation({
    mutationFn: () => claimAirdrop(airdropId as string),
    onSuccess: () => {
      showsuccesssnack("You Successfully claimed Airdrop Tokens");
      closeAppDialog();
    },
    onError: () => {
      showerrorsnack("Sorry, the Airdrop did not work");
      closeAppDialog();
    },
  });

  // unlock mutations
  const { mutate: unlockForShare } = useMutation({
    mutationFn: () => unlockTokens(1),
    onSuccess: () => {
      invalidateQueries({ queryKey: ["getunlocked", "btceth", "mantra"] });
      localStorage.removeItem("shareapp");
      showsuccesssnack("Successfully unlocked 1 OM");
      closeAppDialog();
    },
    onError: () => {
      localStorage.removeItem("shareapp");
      showsuccesssnack("Sorry, An error occurred...");
      closeAppDialog();
    },
  });
  const { mutate: unlockForEvident } = useMutation({
    mutationFn: () => unlockTokens(2),
    onSuccess: () => {
      invalidateQueries({ queryKey: ["getunlocked", "btceth", "mantra"] });
      localStorage.removeItem("tryapp");
      showsuccesssnack("Successfully unlocked 1 OM");
      closeAppDialog();
    },
    onError: () => {
      localStorage.removeItem("tryapp");
      showsuccesssnack("Sorry, An error occurred...");
      closeAppDialog();
    },
  });

  const unlockedTokens = unlocked as unlockTokensType;

  const sharetask = localStorage.getItem("shareapp");
  const tryapptask = localStorage.getItem("tryapp");

  const onShareApp = () => {
    localStorage.setItem("shareapp", "true");

    const appUrl = "https://t.me/strato_vault_bot/stratovault";
    openTelegramLink(
      `https://t.me/share/url?url=${appUrl}&text=Hey, Join me on StratoSphereId. A multiasset crypto wallet that also manages your secrets.`
    );
  };

  const onStake = () => {
    showerrorsnack("Staking coming soon...");
  };

  const tryApp = () => {
    localStorage.setItem("tryapp", "true");
    openLink("https://t.me/evident_capital_bot/evident");
  };

  const goBack = () => {
    switchtab("profile");
    navigate("/app");
  };

  useEffect(() => {
    setTimeout(() => {
      setAnimationPlayed(true);
    }, 1000);
  }, []);

  useEffect(() => {
    if (id !== "nil") {
      mutateClaimAirdrop();
    }
  }, [id]);

  useEffect(() => {
    if (sharetask !== null) {
      openAppDialog("loading", "Unlocking 1 OM, please wait...");
      unlockForShare();
    }

    if (tryapptask !== null) {
      openAppDialog("loading", "Unlocking 2 OM, please wait...");
      unlockForEvident();
    }
  }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isVisible()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="rewards">
      <div className="animationctr">
        <div className="img">
          <img src={rewards} alt="rewards" />
        </div>
      </div>

      {!animationplayed && (
        <div className="anim">
          <Confetti width="100%" height="100%" />
        </div>
      )}

      <div className="lockedamount">
        <p className="fiat">
          <span className="crypto">{unlockedTokens?.amount} OM</span> ~&nbsp;
          {formatUsd(Number(unlocked?.amount) * Number(mantrausdval))}
          <Lock width={10} height={14} color={colors.textsecondary} />
        </p>

        <span className="info">
          Your rewards will be unlocked as you complete tasks
        </span>
      </div>
      <div className="tasks">
        <p className="title">Tasks</p>

        <div className="task" onClick={onShareApp}>
          <img src={shareapp} alt="rewards" />

          <p>
            Share&nbsp;
            {sharetask == null ? (
              <Stake color={colors.success} />
            ) : (
              <CheckAlt width={12} height={12} color={colors.success} />
            )}
            <br />
            <span>Share the app & unlock 1 OM every time</span>
          </p>
        </div>

        <div className="task" onClick={onStake}>
          <img src={staketokens} alt="rewards" />

          <p>
            Stake&nbsp;
            <Stake color={colors.success} />
            <br />
            <span>Stake crypto assets & unlock 4 OM</span>
          </p>
        </div>

        <div className="task" onClick={tryApp}>
          <img src={evident} alt="rewards" />

          <p>
            Evident Capital&nbsp;
            {tryapptask == null ? (
              <Stake color={colors.success} />
            ) : (
              <CheckAlt width={12} height={12} color={colors.success} />
            )}
            <br />
            <span>Try out Evident Capital & unlcock 2 OM</span>
          </p>
        </div>
      </div>

      <div className="unlockedamount">
        <span className="desc">Unlocked Amount</span>
        <p className="available">
          {unlockedTokens?.unlocked} OM ~&nbsp;
          <span>
            {formatUsd(Number(unlockedTokens?.unlocked) * Number(mantrausdval))}
          </span>
        </p>
        <p className="aboutunlocked">
          Any unlocked amount is sent to your wallet
        </p>
      </div>
    </section>
  );
}
