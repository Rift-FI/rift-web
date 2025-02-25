import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton, openTelegramLink } from "@telegram-apps/sdk-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useAppDrawer } from "../../hooks/drawer";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDialog } from "../../hooks/dialog";
import { useTabs } from "../../hooks/tabs";
import {
  claimAirdrop,
  getUnlockedTokens,
  unlockTokensHistory,
} from "../../utils/api/airdrop";
import { formatUsd } from "../../utils/formatters";
import { getMantraUsdVal } from "../../utils/api/mantra";
import { createReferralLink } from "../../utils/api/refer";
import { dateDistance, formatDateToStr } from "../../utils/dates";
import { Copy, Lock, Telegram } from "../../assets/icons/actions";
import { colors } from "../../constants";
import referearn from "../../assets/images/icons/refer.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import rewardsicon from "../../assets/images/icons/rewards.png";
import staketokens from "../../assets/images/icons/lendto.png";
import transaction from "../../assets/images/obhehalfspend.png";
import dailycheckin from "../../assets/images/icons/acc-recovery.png";
import "../../styles/components/tabs/rewards.scss";

export const Rewards = (): JSX.Element => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { openAppDrawer } = useAppDrawer();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { switchtab } = useTabs();

  const airdropId = localStorage.getItem("airdropId");

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

  const {
    data: referLink,
    mutate: mutateReferalLink,
    isPending,
  } = useMutation({
    mutationFn: () => createReferralLink("unlock"),
  });

  const onCopyLink = () => {
    if (isPending) {
      showerrorsnack("Generating your link, please wait");
    } else {
      navigator.clipboard.writeText(referLink as string);
      showsuccesssnack("Link copied to clipboard...");
    }
  };

  const onShareTg = () => {
    if (isPending) {
      showerrorsnack("Generating your link, please wait");
    } else {
      openTelegramLink(`https://t.me/share/url?url=${referLink}`);
    }
  };

  const onStake = () => {
    navigate("/staking");
  };

  const goBack = () => {
    switchtab("home");
  };

  useEffect(() => {
    if (airdropId !== null) {
      openAppDialog("loading", "Claiming your Airdrop tokens, please wait...");
      mutateClaimAirdrop();
    }

    mutateReferalLink();
  }, [airdropId]);

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
      <div className="locked_balances">
        <div className="icon_ctr">
          <span className="icon">
            <img src={rewardsicon} alt="rewards" />
          </span>
        </div>

        <div className="locked_amount">
          <p>
            Locked <Lock width={12} height={14} color={colors.danger} />
          </p>

          <span>
            {unlocked?.amount || 0} OM <img src={mantralogo} alt="mantra" />
            ~&nbsp;
            {formatUsd(Number(unlocked?.amount || 0) * Number(mantrausdval))}
          </span>
        </div>
      </div>

      <div className="tasks">
        <p className="tasks_title">Unlock more OM</p>

        <div className="task refer_task">
          <span className="_task">
            <img src={referearn} alt="refer" />

            <p>
              Refer & Earn
              <span>
                Refer & earn&nbsp;
                <em>
                  1 OM <img src={mantralogo} alt="mantra" />
                </em>
              </span>
            </p>
          </span>

          <div className="task_actions">
            <button className="copy" onClick={onCopyLink}>
              <Copy width={16} height={18} color={colors.textprimary} />
            </button>

            <button className="send_tg" onClick={onShareTg}>
              <Telegram width={20} height={20} color={colors.textprimary} />
            </button>
          </div>
        </div>

        <div className="task" onClick={onStake}>
          <img src={staketokens} alt="rewards" />

          <p>
            Stake
            <span>
              Stake crypto asset(s) & unlock&nbsp;
              <em>
                4 OM <img src={mantralogo} alt="mantra" />
              </em>
            </span>
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
            <span>
              Perform a transaction & unlock&nbsp;
              <em>
                1 OM <img src={mantralogo} alt="mantra" />
              </em>
            </span>
          </p>
        </div>

        <div className="task">
          <img src={dailycheckin} alt="transaction" />

          <p>
            Daily Check-in
            <span>
              Claim a daily check-in reward of&nbsp;
              <em>
                1 OM <img src={mantralogo} alt="mantra" />
              </em>
            </span>
          </p>
        </div>
      </div>

      <div className="unlockedamount">
        <span className="desc">Unlocked Amount</span>
        <p className="available">
          {unlocked?.unlocked} OM ~&nbsp;
          <span>
            {formatUsd(Number(unlocked?.unlocked || 0) * Number(mantrausdval))}
          </span>
        </p>
        <p className="aboutunlocked">
          Any unlocked amount is sent to your wallet
        </p>
      </div>

      <div className="history">
        <p className="history_title">History</p>

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
                {formatDateToStr(datestr)} <br />
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
    </section>
  );
};
