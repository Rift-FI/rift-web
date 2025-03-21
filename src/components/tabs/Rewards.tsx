import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { addDays, isAfter } from "date-fns";
import { useBackButton } from "../../hooks/backbutton";
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
import { Copy, Telegram } from "../../assets/icons/actions";
import { colors } from "../../constants";
import { Confetti } from "../../assets/animations";
import referearn from "../../assets/images/icons/refer.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import staketokens from "../../assets/images/icons/lendto.png";
import transaction from "../../assets/images/obhehalfspend.png";
import rewardsimg from "../../assets/images/icons/rewards.png";
import "../../styles/components/tabs/rewards.scss";

export const Rewards = (): JSX.Element => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { switchtab } = useTabs();

  const airdropId = localStorage.getItem("airdropId");
  const airdropUid = airdropId?.split("-")[1];
  const airdropReferId = airdropId?.split("-")[2];
  const localdailycheckintime = localStorage.getItem("nextdailychekin");

  // -> unlocked amount -> daily checkin
  const [unlockedAmount, setUnlockedAmount] = useState<number>(0);
  const [showanimation, setshowanimation] = useState<boolean>(false);
  const [isCheckInDisabled, setIsCheckInDisabled] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  const toggleAnimation = () => {
    setshowanimation(true);

    setTimeout(() => {
      setshowanimation(false);
    }, 3000);
  };

  const { data: mantrausdval, isLoading: isMantraUsdLoading } = useQuery({
    queryKey: ["mantrausd"],
    queryFn: getMantraUsdVal,
  });

  const { data: unlocked, isLoading: isUnlockedLoading } = useQuery({
    queryKey: ["getunlocked"],
    queryFn: getUnlockedTokens,
  });

  const { data: unlockhistorydata } = useQuery({
    queryKey: ["unlockhistory"],
    queryFn: unlockTokensHistory,
  });

  // claim airdrop
  const { mutate: mutateClaimAirdrop } = useMutation({
    mutationFn: () => claimAirdrop(airdropUid as string, airdropReferId),

    onSuccess: () => {
      localStorage.removeItem("airdropId");
      showsuccesssnack("You Successfully claimed Airdrop Tokens");
      toggleAnimation();

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

  const { data: referLink, mutate: mutateReferalLink } = useMutation({
    mutationFn: () => createReferralLink(),
  });

  const onStake = () => {
    switchtab("earn");
  };

  const onTransaction = () => {
    switchtab("sendcrypto");
  };

  const onDailyCheckin = () => {
    if (isCheckInDisabled) {
      showerrorsnack(`Check in again ${timeRemaining}`);
      return;
    }

    const nextdailycheckin = addDays(new Date(), 1);
    localStorage.setItem("nextdailychekin", nextdailycheckin.toISOString());

    setUnlockedAmount(unlockedAmount + 1);
    toggleAnimation();
    setIsCheckInDisabled(true);
    updateTimeRemaining();
  };

  const updateTimeRemaining = () => {
    if (
      localdailycheckintime &&
      isAfter(new Date(localdailycheckintime), new Date())
    ) {
      const datediff = dateDistance(localdailycheckintime);
      setTimeRemaining(datediff.includes("in") ? datediff : "in " + datediff);
      setIsCheckInDisabled(true);
    } else {
      setTimeRemaining("");
      setIsCheckInDisabled(false);
    }
  };

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useEffect(() => {
    if (airdropId !== null) {
      openAppDialog("loading", "Claiming your Airdrop tokens, please wait...");
      mutateClaimAirdrop();
    }

    mutateReferalLink();
    updateTimeRemaining();

    const timer = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airdropId, localdailycheckintime]);

  useBackButton(goBack);

  const referralLinkSection = (
    <div className="referral-actions">
      <div className="referral-link">
        {!referLink
          ? "Creating your link..."
          : `${referLink?.referral_link?.substring(0, 32)}...`}
      </div>
      <div className="referral-buttons">
        <button
          className="copy-btn"
          onClick={() => {
            if (!referLink) {
              showerrorsnack("Generating your link, please wait");
            } else {
              navigator.clipboard.writeText(referLink.referral_link);
              showsuccesssnack("Link copied to clipboard...");
            }
          }}
        >
          <Copy width={16} height={18} color={colors.textprimary} />
        </button>
        <button
          className="share-btn"
          onClick={() => {
            if (!referLink) {
              showerrorsnack("Generating your link, please wait");
            } else {
              openTelegramLink(
                `https://t.me/share/url?url=${referLink.referral_link}`
              );
            }
          }}
        >
          <Telegram width={20} height={20} color={colors.textprimary} />
        </button>
      </div>
    </div>
  );

  return (
    <section id="rewards">
      {/* Locked Rewards Card */}
      <div className="rewards-vault-card">
        <div className="vault-header">
          <div className="vault-icon">
            <img src={rewardsimg} alt="rewards" className="gift-box" />
          </div>
          <h2>Locked Rewards</h2>

          <div className="unlocked-stats">
            <div className="stat-label">Total Unlocked</div>
            {isUnlockedLoading || isMantraUsdLoading ? (
              <div className="stat-value loading">
                <div className="loading-animation">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            ) : (
              <div className="stat-value">
                {unlocked ? unlocked?.unlocked : 0}
                <img src={mantralogo} alt="OM" />
                <span className="usd-equivalent">
                  ≈
                  {formatUsd(
                    unlocked
                      ? Number(unlocked?.unlocked || 0) * Number(mantrausdval)
                      : 0
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="vault-content">
          {isUnlockedLoading || isMantraUsdLoading ? (
            <div className="token-amount-loading">
              <div className="loading-pulse"></div>
              <img src={mantralogo} alt="OM Token" className="om-token" />
            </div>
          ) : (
            <>
              <div className="token-amount" key={unlockedAmount}>
                <span className="amount-value">
                  {unlocked ? Number(unlocked?.amount) + unlockedAmount : 0}
                </span>
                <img src={mantralogo} alt="OM Token" className="om-token" />
              </div>
              <div className="usd-value">
                ≈
                {formatUsd(
                  unlocked
                    ? Number(unlocked?.amount || 0) * Number(mantrausdval)
                    : 0
                )}
              </div>
            </>
          )}
        </div>

        <div className="vault-actions">
          <button
            className={`daily-checkin-btn ${
              isCheckInDisabled ? "disabled" : ""
            }`}
            onClick={onDailyCheckin}
            disabled={isCheckInDisabled}
          >
            <span>
              Daily Check-in{" "}
              <small className="inline-small">
                +1 Locked <img src={mantralogo} alt="OM" />
              </small>
              {isCheckInDisabled && (
                <div className="countdown">Next Check-in: {timeRemaining}</div>
              )}
            </span>
          </button>

          <button
            className="boost-btn"
            onClick={() => navigate("/premiums?returnPath=rewards")}
          >
            <span>x2 Boost</span>
          </button>
        </div>
      </div>

      {/* Unlock Tasks Card */}
      <div className="missions-card">
        <h3 className="missions-title">Unlock Tasks</h3>
        <p className="missions-description">
          Complete tasks to unlock{" "}
          <img src={mantralogo} alt="OM" className="inline-om-icon" /> tokens to
          your wallet
        </p>

        <div className="mission-list">
          <div className="mission-item refer-mission">
            <div className="mission-info">
              <img src={referearn} alt="Refer" className="mission-icon" />
              <div className="mission-details">
                <div className="mission-name">Refer & Earn</div>
                <div className="mission-description">
                  Earn from each successful referral
                </div>
              </div>
            </div>
            <div className="mission-reward">
              <span>1</span>
              <img src={mantralogo} alt="OM" />
            </div>
          </div>

          {referralLinkSection}

          <div className="mission-item" onClick={() => onStake()}>
            <div className="mission-info">
              <img src={staketokens} alt="Stake" className="mission-icon" />
              <div className="mission-details">
                <div className="mission-name">Stake</div>
                <div className="mission-description">
                  Stake crypto asset(s) & unlock
                </div>
              </div>
            </div>
            <div className="mission-reward">
              <span>3</span>
              <img src={mantralogo} alt="OM" />
            </div>
          </div>

          <div className="mission-item" onClick={() => onTransaction()}>
            <div className="mission-info">
              <img
                src={transaction}
                alt="Transaction"
                className="mission-icon"
              />
              <div className="mission-details">
                <div className="mission-name">Make a transaction</div>
                <div className="mission-description">
                  Perform a transaction & unlock
                </div>
              </div>
            </div>
            <div className="mission-reward">
              <span>1</span>
              <img src={mantralogo} alt="OM" />
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="history-section">
        <h3 className="history-title">History</h3>
        <div className="history-content">
          {unlockhistorydata && unlockhistorydata[0]?.message?.length > 0 ? (
            unlockhistorydata[0]?.message?.map((message, index) => {
              const datestr = message.split(" ").pop() as string;
              return (
                <div className="history-item" key={index}>
                  <div className="history-message">
                    {message.split(" ").slice(0, -1).join(" ")}
                  </div>
                  <div className="history-date">
                    {formatDateToStr(datestr)}
                    <span className="history-time">
                      {dateDistance(datestr)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-history">No history available</div>
          )}
        </div>
      </div>

      {/* Confetti Animation */}
      {showanimation && (
        <div className="confetti-animation">
          <Confetti width="100%" height="100%" />
        </div>
      )}
    </section>
  );
};
