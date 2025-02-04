import { JSX, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useAppDrawer } from "../hooks/drawer";
import { useSnackbar } from "../hooks/snackbar";
import { useAppDialog } from "../hooks/dialog";
import {
  claimAirdrop,
  getUnlockedTokens,
  unlockhistorytype,
  unlockTokensHistory,
  unlockTokensType,
} from "../utils/api/airdrop";
import { formatUsd } from "../utils/formatters";
import { getMantraUsdVal } from "../utils/api/mantra";
import { dateDistance, formatDateToStr } from "../utils/dates";
import { Confetti } from "../assets/animations";
import { Lock } from "../assets/icons";
import { colors } from "../constants";
import rewards from "../assets/images/icons/rewards.png";
import shareapp from "../assets/images/refer.png";
import staketokens from "../assets/images/icons/lendto.png";
import transaction from "../assets/images/obhehalfspend.png";
import "../styles/pages/rewards.scss";

export default function Rewards(): JSX.Element {
  const { id } = useParams();
  const { invalidateQueries } = useQueryClient();
  const navigate = useNavigate();
  const { drawerOpen, openAppDrawer } = useAppDrawer();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
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

  const { data } = useQuery({
    queryKey: ["unlockhitory"],
    queryFn: unlockTokensHistory,
  });
  const unlockHistory = data as unlockhistorytype[];

  // claim airdrop
  const { mutate: mutateClaimAirdrop } = useMutation({
    mutationFn: () => claimAirdrop(airdropId as string),
    onSuccess: () => {
      localStorage.removeItem("airdropId");

      invalidateQueries({ queryKey: ["getunlocked", "unlockhitory"] });
      showsuccesssnack("You Successfully claimed Airdrop Tokens");
      closeAppDialog();
    },
    onError: () => {
      localStorage.removeItem("airdropId");

      showerrorsnack("Sorry, the Airdrop did not work");
      closeAppDialog();
    },
  });

  const unlockedTokens = unlocked as unlockTokensType;

  const onShareApp = () => {
    navigate("/refer/unlock");
  };

  const onStake = () => {
    showerrorsnack("Staking coming soon...");
  };

  const goBack = () => {
    navigate("/app");
  };

  useEffect(() => {
    setTimeout(() => {
      setAnimationPlayed(true);
    }, 1000);
  }, []);

  useEffect(() => {
    if (id !== "nil") {
      openAppDialog("loading", "Claiming your Airdrop tokens, please wait");
      mutateClaimAirdrop();
    }
  }, [id]);

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
  }, [drawerOpen]);

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
          {formatUsd(Number(unlocked?.amount || 0) * Number(mantrausdval))}
          <Lock width={10} height={14} color={colors.danger} />
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
            Share
            <span>Share the app & unlock 1 OM</span>
          </p>
        </div>

        <div className="task" onClick={onStake}>
          <img src={staketokens} alt="rewards" />

          <p>
            Stake
            <span>Stake crypto asset(s) & unlock 4 OM</span>
          </p>
        </div>

        <div
          className="task"
          onClick={() => {
            openAppDrawer("unlocktransactions");
          }}
        >
          <img src={transaction} alt="transaction" />

          <p>
            Make a transaction
            <span>Perform a transaction & unlock 1 OM</span>
          </p>
        </div>
      </div>

      <div className="unlockedamount">
        <span className="desc">Unlocked Amount</span>
        <p className="available">
          {unlockedTokens?.unlocked} OM ~&nbsp;
          <span>
            {formatUsd(
              Number(unlockedTokens?.unlocked || 0) * Number(mantrausdval)
            )}
          </span>
        </p>
        <p className="aboutunlocked">
          Any unlocked amount is sent to your wallet
        </p>
      </div>

      <div className="history">
        {unlockHistory && unlockHistory[0]?.message?.length !== 0 && (
          <p className="title">History</p>
        )}

        {unlockHistory &&
          unlockHistory[0]?.message?.map((message, index) => {
            const datestr = message.split(" ").pop() as string;

            return (
              <p
                style={{
                  borderBottom:
                    index == unlockHistory[0]?.message?.length - 1
                      ? `1px solid ${colors.divider}`
                      : "",
                }}
                className="message"
                key={index}
              >
                {message.split(" ").slice(0, -1).join(" ")}&nbsp;
                {formatDateToStr(datestr)}&nbsp;
                <span>({dateDistance(datestr)})</span>
              </p>
            );
          })}
      </div>
    </section>
  );
}
