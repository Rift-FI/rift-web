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
import { Confetti } from "../../assets/animations";
import referearn from "../../assets/images/icons/refer.png";
import mantralogo from "../../assets/images/sphere.jpg";
import staketokens from "../../assets/images/icons/lendto.png";
import transaction from "../../assets/images/obhehalfspend.png";
import rewardsimg from "../../assets/images/icons/rewards.png";

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
    localStorage.setItem("stakeintent", "unlock");
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

  return (
    <section className="min-h-screen bg-[#0e0e0e] px-4 py-6 overflow-y-auto space-y-6">
      {/* Locked Rewards Card */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ffb386]/10 flex items-center justify-center">
              <img
                src={rewardsimg}
                alt="rewards"
                className="w-8 h-8 rounded-full"
              />
            </div>
            <div>
              <h2 className="text-[#f6f7f9] text-xl font-bold">
                Locked Rewards
              </h2>
              <p className="text-gray-400 text-xs">Your rewards vault</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs mb-1">Unlocked</p>
            {isUnlockedLoading || isMantraUsdLoading ? (
              <div className="flex items-center gap-2 animate-pulse py-1 px-2 rounded-full bg-[#2a2a2a] justify-center">
                <div className="h-2 w-2 bg-[#ffb386] rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-[#ffb386] rounded-full animate-bounce delay-75"></div>
                <div className="h-2 w-2 bg-[#ffb386] rounded-full animate-bounce delay-150"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#f6f7f9] text-lg font-bold">
                    {unlocked ? unlocked?.unlocked : 0}
                  </span>
                  <img
                    src={mantralogo}
                    alt="OM"
                    className="w-5 h-5 rounded-full"
                  />
                </div>
                <span className="text-gray-400 text-sm">
                  ≈{" "}
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

        <div className="bg-[#2a2a2a] rounded-xl p-4 mb-6">
          {isUnlockedLoading || isMantraUsdLoading ? (
            <div className="flex items-center justify-center gap-3 animate-pulse rounded-2xl">
              <div className="h-8 w-24 bg-[#212121] rounded"></div>
              <img
                src={mantralogo}
                alt="OM Token"
                className="w-6 h-6 rounded-full"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div
                className="flex items-center gap-2 mb-2"
                key={unlockedAmount}
              >
                <span className="text-[#f6f7f9] text-3xl font-bold">
                  {unlocked ? Number(unlocked?.amount) + unlockedAmount : 0}
                </span>
                <img
                  src={mantralogo}
                  alt="OM Token"
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <span className="text-gray-400">
                ≈{" "}
                {formatUsd(
                  unlocked
                    ? Number(unlocked?.amount || 0) * Number(mantrausdval)
                    : 0
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDailyCheckin}
            disabled={isCheckInDisabled}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              isCheckInDisabled
                ? "bg-[#2a2a2a] text-gray-400"
                : "bg-[#ffb386] text-[#0e0e0e] hover:bg-[#ffb386]/90"
            }`}
          >
            <div className="flex flex-col">
              {!isCheckInDisabled && (
                <>
                  <span className="font-semibold">Daily Check-in</span>
                  <span className="text-xs flex items-center gap-1 justify-center">
                    +1 Locked{" "}
                    <img
                      src={mantralogo}
                      alt="OM"
                      className="w-3 h-3 rounded-full"
                    />
                  </span>
                </>
              )}
              {isCheckInDisabled && (
                <span className="text-xs mt-1">
                  Next Check-in: {timeRemaining}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => navigate("/premiums?returnPath=rewards")}
            className="flex-1 bg-[#2a2a2a] hover:bg-[#2a2a2a]/80 text-[#ffb386] py-3 px-4 rounded-xl text-sm font-medium transition-all"
          >
            x2 Boost
          </button>
        </div>
      </div>

      {/* Earn More Tasks Card */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg">
        <h3 className="text-[#f6f7f9] text-lg font-bold mb-2">
          Earn More Tokens
        </h3>
        <p className="text-gray-400 text-sm mb-6 flex items-center gap-1">
          Complete tasks to earn additional locked tokens in your rewards vault
        </p>

        <div className="space-y-4">
          <div className="bg-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={referearn}
                  alt="Refer"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="text-[#f6f7f9] font-medium">Refer & Earn</div>
                  <div className="text-gray-400 text-sm">
                    Earn tokens for each successful referral
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-[#f6f7f9]">1</span>
                  <img
                    src={mantralogo}
                    alt="OM"
                    className="w-4 h-4 rounded-full"
                  />
                </div>
                <span className="text-xs text-[#ffb386] px-2 py-1 rounded-full bg-[#ffb386]/10">
                  Locked
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-[#212121] rounded-lg px-4 py-2 text-sm text-gray-400 truncate">
                {!referLink
                  ? "Creating your link..."
                  : referLink?.referral_link?.substring(0, 32) + "..."}
              </div>
              <button
                onClick={() => {
                  if (!referLink) {
                    showerrorsnack("Generating your link, please wait");
                  } else {
                    navigator.clipboard.writeText(referLink.referral_link);
                    showsuccesssnack("Link copied to clipboard...");
                  }
                }}
                className="p-2 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] transition-colors"
              >
                <Copy width={16} height={18} color="#f6f7f9" />
              </button>
              <button
                onClick={() => {
                  if (!referLink) {
                    showerrorsnack("Generating your link, please wait");
                  } else {
                    openTelegramLink(
                      `https://t.me/share/url?url=${referLink.referral_link}`
                    );
                  }
                }}
                className="p-2 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] transition-colors"
              >
                <Telegram width={20} height={20} color="#f6f7f9" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unlock Tasks Card */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg">
        <h3 className="text-[#f6f7f9] text-lg font-bold mb-2">Unlock Tokens</h3>
        <p className="text-gray-400 text-sm mb-6 flex items-center gap-1">
          Complete these tasks to unlock tokens directly to your wallet
        </p>

        <div className="space-y-4">
          <div
            onClick={() => onStake()}
            className="bg-[#2a2a2a] rounded-xl p-4 cursor-pointer hover:bg-[#2a2a2a]/80 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <img
                  src={staketokens}
                  alt="Stake"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="text-[#f6f7f9] font-medium">Stake</div>
                  <div className="text-gray-400 text-sm">
                    Stake crypto asset(s) & unlock
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-[#f6f7f9]">3</span>
                  <img
                    src={mantralogo}
                    alt="OM"
                    className="w-4 h-4 rounded-full"
                  />
                </div>
                <span className="text-xs text-[#ffb386] px-2 py-1 rounded-full bg-[#ffb386]/10">
                  Unlocked
                </span>
              </div>
            </div>
          </div>

          <div
            onClick={() => onTransaction()}
            className="bg-[#2a2a2a] rounded-xl p-4 cursor-pointer hover:bg-[#2a2a2a]/80 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <img
                  src={transaction}
                  alt="Transaction"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="text-[#f6f7f9] font-medium">
                    Make a transaction
                  </div>
                  <div className="text-gray-400 text-sm">
                    Perform a transaction & unlock
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-[#f6f7f9]">1</span>
                  <img
                    src={mantralogo}
                    alt="OM"
                    className="w-4 h-4 rounded-full"
                  />
                </div>
                <span className="text-xs text-[#ffb386] px-2 py-1 rounded-full bg-[#ffb386]/10">
                  Unlocked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg">
        <h3 className="text-[#f6f7f9] text-lg font-bold mb-4">History</h3>
        <div className="space-y-4">
          {unlockhistorydata && unlockhistorydata[0]?.message?.length > 0 ? (
            unlockhistorydata[0]?.message?.map((message, index) => {
              const datestr = message.split(" ").pop() as string;
              return (
                <div
                  key={index}
                  className="border-b border-[#2a2a2a] pb-4 last:border-0 last:pb-0"
                >
                  <div className="text-[#f6f7f9] mb-1">
                    {message.split(" ").slice(0, -1).join(" ")}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">
                      {formatDateToStr(datestr)}
                    </span>
                    <span className="text-[#ffb386]">
                      {dateDistance(datestr)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 py-8">
              No history available
            </div>
          )}
        </div>
      </div>

      {/* Confetti Animation */}
      {showanimation && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti width="100%" height="100%" />
        </div>
      )}
    </section>
  );
};
