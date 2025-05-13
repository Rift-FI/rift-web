import { JSX, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { Skeleton } from "@mui/material";
import { addDays, formatDistanceToNowStrict, isAfter } from "date-fns";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { useAppDialog } from "../../hooks/dialog";
import {
  burnSphereAndReward,
  claimAirdrop,
  getUnlockedTokens,
  performDailyCheckin,
} from "../../utils/api/airdrop";
import { createReferralLink } from "../../utils/api/refer";
import { OutlinedTextInput } from "../global/Inputs";
import { ArrowRight, Rotate, List, Copy, Telegram } from "../../assets/icons";
import { colors } from "../../constants";
import spherelogo from "../../assets/images/icons/sphere.png";
import refericon from "../../assets/images/icons/refer.png";
import walleticon from "../../assets/images/icons/wallet.png";
import "../../styles/components/tabs/rewards.scss";

export const Rewards = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const queryClient = useQueryClient();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDrawer } = useAppDrawer();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [unlockedAmount, setUnlockedAmount] = useState<number>(0);
  const [isCheckInDisabled, setIsCheckInDisabled] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [burnQty, setBurnQty] = useState<string>("");

  const airdropId = localStorage.getItem("airdropId");
  const airdropUid = airdropId?.split("-")[1];
  const airdropReferId = airdropId?.split("-")[2];
  const txverified = localStorage.getItem("txverified");

  const updateTimeRemaining = () => {
    const nextCheckinTime = localStorage.getItem("nextdailychekin");
    if (nextCheckinTime && isAfter(new Date(nextCheckinTime), new Date())) {
      const remaining = formatDistanceToNowStrict(new Date(nextCheckinTime), {
        addSuffix: true,
      });
      setTimeRemaining(remaining);
      setIsCheckInDisabled(true);
    } else {
      setTimeRemaining("");
      setIsCheckInDisabled(false);
    }
  };

  const { data: tokenData, isLoading: isTokenDataLoading } = useQuery({
    queryKey: ["getunlocked"],
    queryFn: getUnlockedTokens,
  });

  const { mutate: mutateClaimAirdrop } = useMutation({
    mutationFn: () =>
      claimAirdrop(airdropUid as string, airdropReferId)
        .then((res) => {
          localStorage.removeItem("airdropId");
          showsuccesssnack("Successfully claimed your Airdrop tokens");

          if (res?.status == 200) {
            queryClient
              .invalidateQueries({ queryKey: ["getunlocked"] })
              .then(() => {
                closeAppDialog();
              });
          } else {
            localStorage.removeItem("airdropId");
            showerrorsnack("Sorry, the Airdrop did not work");
            closeAppDialog();
          }
        })
        .catch(() => {
          localStorage.removeItem("airdropId");
          showerrorsnack("Sorry, the Airdrop did not work");
          closeAppDialog();
        }),
  });

  const {
    mutate: mutateReferalLink,
    data: referLink,
    isPending: referLinkPending,
  } = useMutation({
    mutationFn: () => createReferralLink(),
  });

  const { mutate: mutateDailyCheckin, isPending: dailycheckingpending } =
    useMutation({
      mutationFn: () =>
        performDailyCheckin()
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["getunlocked"] });

            const nextdailycheckin = addDays(new Date(), 1);
            localStorage.setItem(
              "nextdailychekin",
              nextdailycheckin.toISOString()
            );

            setUnlockedAmount(unlockedAmount);
            setIsCheckInDisabled(true);
            updateTimeRemaining();

            showsuccesssnack("Successfully claimed 1 SPHR");
          })
          .catch(() => {
            showerrorsnack(`Please check in again ${timeRemaining}`);
          }),
    });

  const { mutate: burnAndRewardMutation, isPending: burnSphrPending } =
    useMutation({
      mutationFn: () =>
        burnSphereAndReward(burnQty)
          .then((res) => {
            if (res?.status == 200 || res?.status == 201) {
              showsuccesssnack("Transaction completed successfully");
              queryClient.invalidateQueries({ queryKey: ["getunlocked"] });
            } else {
              showerrorsnack("Transaction failed, please try again");
            }
          })
          .catch(() => {
            showerrorsnack("Transaction failed, please try again");
          }),
    });

  const onDailyCheckin = () => {
    if (isCheckInDisabled) {
      showerrorsnack(`Check in again ${timeRemaining}`);
      return;
    } else {
      mutateDailyCheckin();
    }
  };

  const onBurnSphr = () => {
    const amountToBurn = parseFloat(burnQty);

    if (isNaN(amountToBurn) || amountToBurn <= 0) {
      showerrorsnack("Please enter a valid amount");
      return;
    }

    if (amountToBurn > sphrBalance) {
      showerrorsnack("Please try a lower amount");
      return;
    }

    if (txverified == null) {
      openAppDrawer("verifytxwithotp");
      return;
    }

    showsuccesssnack("Processing...");
    burnAndRewardMutation();
  };

  const goBack = () => {
    switchtab("home");
  };

  const goToXRate = () => {
    navigate("/sphere-rate");
  };

  const goToDeposit = () => {
    navigate("/deposit/ETH");
  };

  const goToTransact = () => {
    navigate("/send-crypto-methods/ETH/unlock");
  };

  const sphrBalance = Number(tokenData?.amount || 0) + unlockedAmount;

  useEffect(() => {
    if (airdropId !== null) {
      openAppDialog("loading", "Claiming your Airdrop tokens, please wait...");
      mutateClaimAirdrop();
    }

    mutateReferalLink();
    updateTimeRemaining();

    const timer = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(timer);
  }, [airdropId, mutateReferalLink]);

  useBackButton(goBack);

  return (
    <section id="rewards">
      <div className="balance-xrate">
        <div className="balance">
          <p>Your Balance</p>

          {isTokenDataLoading ? (
            <Skeleton
              variant="text"
              width={80}
              height={40}
              animation="pulse"
              sx={{ backgroundColor: colors.divider }}
            />
          ) : (
            <p className="bal">
              {sphrBalance} <img src={spherelogo} alt="SPHR" />
              <span>(SPHR)</span>
            </p>
          )}
        </div>

        <div className="xrate" onClick={goToXRate}>
          <span>SPHR/USDC Exchange Rate</span>
          <ArrowRight color={colors.textsecondary} />
        </div>
      </div>

      <button
        className="daily-checkin"
        disabled={dailycheckingpending || isCheckInDisabled}
        onClick={onDailyCheckin}
      >
        {dailycheckingpending ? (
          "Please wait..."
        ) : isCheckInDisabled ? (
          `Check in again ${timeRemaining}`
        ) : (
          <>
            Daily Check-in <Rotate color={colors.textprimary} />
          </>
        )}
      </button>

      <div className="earn-more">
        <p className="earn-title">
          Earn More SPHR
          <span> Complete tasks, earn $SPHR & convert to USDC</span>
        </p>

        <ReferTask
          referralLink={referLink?.referral_link as string}
          isLoading={referLinkPending}
        />

        <CompleteTask
          image={walleticon}
          title="Deposit Crypto"
          description="Earn 10 SPHR when you deposit crypto in your Sphere wallet"
          onclick={goToDeposit}
        />

        <CompleteTask
          image={walleticon}
          title="Make a transaction"
          description="Earn 10 SPHR when you perform a transaction on Sphere"
          onclick={goToTransact}
        />
      </div>

      <div className="unlock">
        <p className="title">
          Unlock Rewards <span>Burn your earned SPHR for USDC</span>
        </p>
        <OutlinedTextInput
          inputType="number"
          inputState={burnQty}
          setInputState={setBurnQty}
          inputlabalel="Burn SPHR"
          placeholder="1 SPHR"
          hasError={Number(burnQty) > sphrBalance}
          sxstyles={{ margin: "0" }}
        />

        <button
          className="submit-burn"
          disabled={isTokenDataLoading || burnSphrPending}
          onClick={onBurnSphr}
        >
          {txverified == null
            ? "Verify to Unlock"
            : burnSphrPending
            ? "Please wait..."
            : "Unlock Now"}
        </button>
      </div>
    </section>
  );
};

const ReferTask = ({
  referralLink,
  isLoading,
}: {
  referralLink: string;
  isLoading: boolean;
}): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const onCopyLink = () => {
    if (isLoading) {
      showerrorsnack("Please wait");
    } else {
      navigator.clipboard.writeText(referralLink);
      showsuccesssnack("Link copied to clipboard");
    }
  };

  const onShareTg = () => {
    if (isLoading) {
      showerrorsnack("Please wait");
    } else {
      openTelegramLink(
        `https://t.me/share/url?url=${referralLink}&text=Join%20me%20on%20Sphere!`
      );
    }
  };

  return (
    <div className="refer-task">
      <div className="lo1">
        <img src={refericon} alt="refer" />
        <p>
          Refer & Earn <span>Earn 10 SPHR from each successfull referral</span>
        </p>
      </div>

      <div className="lo2">
        <div className="link-icon">
          <span className="icon">
            <List color={colors.textsecondary} />
          </span>
          <span className="link">
            {isLoading ? "Please wait" : referralLink?.substring(0, 17)}...
          </span>
        </div>

        <div className="actions">
          <button className="copy" onClick={onCopyLink}>
            Copy <Copy color={colors.textsecondary} />
          </button>

          <button className="tg" onClick={onShareTg}>
            <Telegram width={18} height={15} color={colors.textprimary} />
          </button>
        </div>
      </div>
    </div>
  );
};

const CompleteTask = ({
  image,
  title,
  description,
  onclick,
}: {
  image: string;
  title: string;
  description: string;
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="complete-task" onClick={onclick}>
      <img src={image} alt="task" />

      <p>
        {title}
        <span>{description}</span>
      </p>
    </div>
  );
};
