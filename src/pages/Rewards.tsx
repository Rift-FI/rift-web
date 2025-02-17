import { JSX, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useAppDrawer } from "../hooks/drawer";
import { useSnackbar } from "../hooks/snackbar";
import { useAppDialog } from "../hooks/dialog";
import { useTabs } from "../hooks/tabs";
import {
  claimAirdrop,
  getUnlockedTokens,
  unlockTokensHistory,
} from "../utils/api/airdrop";
import { formatUsd } from "../utils/formatters";
import { getMantraUsdVal } from "../utils/api/mantra";
import { dateDistance, formatDateToStr } from "../utils/dates";
import { ReferEarn } from "../components/rewards/ReferEarn";
import { Lock, Unlock } from "../assets/icons/actions";
import { colors } from "../constants";
import rewards from "../assets/images/labs/mantralogo.jpeg";
import staketokens from "../assets/images/icons/lendto.png";
import transaction from "../assets/images/obhehalfspend.png";
import dailycheckin from "../assets/images/icons/acc-recovery.png";
import "../styles/pages/rewards.scss";

export default function Rewards(): JSX.Element {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { drawerOpen, openAppDrawer } = useAppDrawer();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { switchtab } = useTabs();

  const [selectTab, setSelectTab] = useState<"tasks" | "history">("tasks");

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
    queryKey: ["unlockhistory"],
    queryFn: unlockTokensHistory,
  });

  // claim airdrop
  const { mutate: mutateClaimAirdrop } = useMutation({
    mutationFn: () => claimAirdrop(airdropId as string),

    onSuccess: () => {
      localStorage.removeItem("airdropId");
      showsuccesssnack("You Successfully claimed Airdrop Tokens");

      queryClient.invalidateQueries({ queryKey: ["unlockhistory"] });
      queryClient.invalidateQueries({ queryKey: ["getunlocked"] }).then(() => {
        closeAppDialog();
      });
    },
    onError: () => {
      localStorage.removeItem("airdropId");
      showerrorsnack("Sorry, the Airdrop did not work");

      queryClient.invalidateQueries({ queryKey: ["unlockhistory"] });
      queryClient.invalidateQueries({ queryKey: ["getunlocked"] }).then(() => {
        closeAppDialog();
      });
    },
  });

  const onStake = () => {
    showerrorsnack("Staking coming soon...");
  };

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useEffect(() => {
    if (id !== "nil") {
      openAppDialog("loading", "Claiming your Airdrop tokens, please wait");

      mutateClaimAirdrop();
    }
  }, [id, airdropId]);

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
      <div className="imgctr">
        <img src={rewards} alt="rewards" />
      </div>

      <div className="balances">
        <div>
          <Unlock width={12} height={17} color={colors.textprimary} />
          <p>
            Available
            <span>
              {unlocked?.unlocked || 0} OM ~&nbsp;
              {formatUsd(
                Number(unlocked?.unlocked || 0) * Number(mantrausdval)
              )}
            </span>
          </p>
        </div>

        <div>
          <Lock color={colors.textprimary} />
          <p>
            Locked
            <span>
              {unlocked?.amount || 0} OM ~&nbsp;
              {formatUsd(Number(unlocked?.amount || 0) * Number(mantrausdval))}
            </span>
          </p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={selectTab == "tasks" ? "activetab" : ""}
          onClick={() => setSelectTab("tasks")}
        >
          Tasks
        </button>
        <button
          className={selectTab == "history" ? "activetab" : ""}
          onClick={() => setSelectTab("history")}
        >
          Earn History
        </button>
      </div>

      {selectTab == "tasks" ? (
        <div className="tasks">
          <ReferEarn />

          <p className="tasks_title">Unlock more OM</p>

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

          <div className="task">
            <img src={dailycheckin} alt="transaction" />

            <p>
              Daily Check-in
              <span>Claim a daily check-in reward (1 OM)</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="history">
          {data ? (
            data[0]?.message?.map((message, index) => {
              const datestr = message.split(" ").pop() as string;

              return (
                <p
                  style={{
                    borderBottom:
                      index == data[0]?.message?.length - 1
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
            })
          ) : (
            <p className="nohistory">
              Your history will appear here as you complete tasks
            </p>
          )}
        </div>
      )}
    </section>
  );
}
