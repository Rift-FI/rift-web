import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { addDays, isAfter } from "date-fns";
import { useBackButton } from "../../hooks/backbutton";
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
import { Confetti } from "../../assets/animations";
import referearn from "../../assets/images/icons/refer.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import staketokens from "../../assets/images/icons/lendto.png";
import transaction from "../../assets/images/obhehalfspend.png";
import rewardsimg from "../../assets/images/icons/rewards.png";
import "../../styles/components/tabs/rewards.scss";
import { SubmitButton } from "../global/Buttons";

export const Rewards = (): JSX.Element => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { openAppDrawer } = useAppDrawer();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { switchtab } = useTabs();

  const airdropId = localStorage.getItem("airdropId");
  const airdropReferId = airdropId?.split("-")[1];
  const localdailycheckintime = localStorage.getItem("nextdailychekin");

  const [showanimation, setshowanimation] = useState<boolean>(false);

  const toggleAnimation = () => {
    setshowanimation(true);

    setTimeout(() => {
      setshowanimation(false);
    }, 1000);
  };

  const { data: mantrausdval } = useQuery({
    queryKey: ["mantrausd"],
    queryFn: getMantraUsdVal,
  });

  const { data: unlocked } = useQuery({
    queryKey: ["getunlocked"],
    queryFn: getUnlockedTokens,
  });

  const { data: unlockhistorydata } = useQuery({
    queryKey: ["unlockhistory"],
    queryFn: unlockTokensHistory,
  });

  // claim airdrop
  const { mutate: mutateClaimAirdrop } = useMutation({
    mutationFn: () => claimAirdrop(airdropId as string, airdropReferId),

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
        toggleAnimation();
      });
    },
  });

  const { data: referLink, mutate: mutateReferalLink } = useMutation({
    mutationFn: () => createReferralLink("unlock"),
  });

  // -> unlocked amount
  const [unlockedAmount, setUnlockedAmount] = useState<number>(
    unlocked?.amount || 0
  );

  const onStake = () => {
    navigate("/staking");
  };

  const onDailyCheckin = () => {
    if (
      localdailycheckintime == null ||
      isAfter(new Date(), new Date(localdailycheckintime))
    ) {
      const nextdailycheckin = addDays(new Date(), 1);
      localStorage.setItem("nextdailychekin", nextdailycheckin.toISOString());

      setUnlockedAmount(Number(unlocked?.amount) + 1);
      toggleAnimation();
    } else {
      const datediff = dateDistance(localdailycheckintime);
      showerrorsnack(
        `Check in again ${datediff.includes("in") ? datediff : "in" + datediff}`
      );
    }
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

  useBackButton(goBack);

  return (
    <section id="rewards">
      <div className="icon_ctr">
        <img src={rewardsimg} alt="rewards" />
      </div>

      <div className="locked_balances">
        <p className="icon_desc">
          <span>
            <Lock width={12} height={14} color={colors.textprimary} />
          </span>
          Locked Rewards Vault
        </p>

        <p className="locked_amount" key={unlockedAmount}>
          {unlockedAmount} <img src={mantralogo} alt="mantra" />
          &nbsp;~&nbsp;
          {formatUsd(Number(unlocked?.amount || 0) * Number(mantrausdval))}
        </p>

        <div className="progress" />
        <p className="progress_txt">
          <span className="value">30%</span>
          <span>Unlocks in 24 Hours</span>
        </p>

        <div className="boost" onClick={() => navigate("/premiums")}>
          <img src={mantralogo} alt="mantra" />
          <p>
            Boost
            <span>+100 OM</span>
          </p>
        </div>

        <SubmitButton
          text="Daily check-in"
          sxstyles={{ marginTop: "0.5rem" }}
          onclick={onDailyCheckin}
        />
      </div>

      <p className="tasks_title">
        Unlock More <img src={mantralogo} alt="mantra" />
      </p>

      <ReferTask referalUrl={referLink} />

      <UnlockTask
        image={staketokens}
        title="Stake"
        description="Stake crypto asset(s) & unlock"
        unlockamount={4}
        onclick={onStake}
      />

      <p className="tasks_title">
        Earn More <img src={mantralogo} alt="mantra" />
      </p>
      <UnlockTask
        image={transaction}
        title="Make a transaction"
        description="Perform a transaction & unlock"
        unlockamount={1}
        onclick={() => openAppDrawer("unlocktransactions")}
      />

      <div className="unlockedamount">
        <span className="desc">Unlocked</span>

        <p className="available">
          {unlocked?.unlocked}&nbsp;
          <img src={mantralogo} alt="mantra" />
          &nbsp;~&nbsp;
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

        {unlockhistorydata ? (
          unlockhistorydata[0]?.message?.map((message, index) => {
            const datestr = message.split(" ").pop() as string;

            return (
              <p
                style={{
                  borderBottom:
                    index == unlockhistorydata[0]?.message?.length - 1
                      ? `1px solid ${colors.divider}`
                      : "",
                }}
                className="message"
                key={index}
              >
                {message.split(" ").slice(0, -1).join(" ")}&nbsp;
                {formatDateToStr(datestr)} <br />
                <span>{dateDistance(datestr)}</span>
              </p>
            );
          })
        ) : (
          <p className="nohistory">
            Your history will appear here as you complete tasks
          </p>
        )}
      </div>

      {showanimation && (
        <div className="animation_ctr">
          <Confetti width="100%" height="100%" />
        </div>
      )}
    </section>
  );
};

const ReferTask = ({ referalUrl }: { referalUrl?: string }): JSX.Element => {
  const { showerrorsnack, showsuccesssnack } = useSnackbar();

  const onCopyLink = () => {
    if (typeof referalUrl == undefined) {
      showerrorsnack("Generating your link, please wait");
    } else {
      navigator.clipboard.writeText(referalUrl as string);
      showsuccesssnack("Link copied to clipboard...");
    }
  };

  const onShareTg = () => {
    if (typeof referalUrl == undefined) {
      showerrorsnack("Generating your link, please wait");
    } else {
      openTelegramLink(`https://t.me/share/url?url=${referalUrl}`);
    }
  };

  return (
    <div className="refer_task">
      <div className="_task">
        <img src={referearn} alt="refer" />

        <p>
          Refer & Earn
          <span>
            Earn 1&nbsp;
            <img src={mantralogo} alt="mantra" />
            &nbsp; from each successfull referral
          </span>
        </p>
      </div>

      <div className="task_actions">
        <span className="url">
          {referalUrl?.substring(0, 32) || "Creating your link"}...
        </span>

        <div className="actions">
          <button className="copy" onClick={onCopyLink}>
            <Copy width={16} height={18} color={colors.textsecondary} />
          </button>

          <button className="send_tg" onClick={onShareTg}>
            <Telegram width={20} height={20} color={colors.textprimary} />
          </button>
        </div>
      </div>
    </div>
  );
};

const UnlockTask = ({
  image,
  title,
  description,
  unlockamount,
  onclick,
}: {
  image: string;
  title: string;
  description: string;
  unlockamount: number;
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="unlock_task" onClick={onclick}>
      <img className="image" src={image} alt="rewards" />

      <p>
        {title}
        <span>
          {description}&nbsp;
          {unlockamount}&nbsp;
          <img src={mantralogo} alt="mantra" />
        </span>
      </p>
    </div>
  );
};
