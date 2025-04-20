import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { addDays, isAfter, formatDistanceToNowStrict } from "date-fns";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDialog } from "../../hooks/dialog";
import { useTabs } from "../../hooks/tabs";
import {
  claimAirdrop,
  getUnlockedTokens,
  performDailyCheckin,
} from "../../utils/api/airdrop";
import { formatNumber } from "../../utils/formatters";
import { createReferralLink } from "../../utils/api/refer";
import { Copy, Stake, Telegram } from "../../assets/icons/actions";
import { Confetti, Loading } from "../../assets/animations";
import referearn from "../../assets/images/icons/refer.png";
import spherelogo from "../../assets/images/sphere.jpg";

import walletout from "../../assets/images/wallet_out.png";
import transaction from "../../assets/images/obhehalfspend.png";
import "../../styles/components/tabs/rewards.scss";
import { colors } from "@/constants";

export const Rewards = (): JSX.Element => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { switchtab } = useTabs();

  const airdropId = localStorage.getItem("airdropId");
  const airdropUid = airdropId?.split("-")[1];
  const airdropReferId = airdropId?.split("-")[2];
  // const localdailycheckintime = localStorage.getItem("nextdailychekin");

  const [unlockedAmount, setUnlockedAmount] = useState<number>(0);
  const [showanimation, setshowanimation] = useState<boolean>(false);
  const [isCheckInDisabled, setIsCheckInDisabled] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [burnAmount, setBurnAmount] = useState<string>(""); // State for SPHR burn amount input

  const toggleAnimation = () => {
    setshowanimation(true);
    setTimeout(() => setshowanimation(false), 3000);
  };

  const { data: tokenData, isLoading: isTokenDataLoading } = useQuery({
    queryKey: ["getunlocked"],
    queryFn: getUnlockedTokens,
  });

  // --- NEW Burn and Reward Mutation ---
  const burnAndRewardMutation = useMutation<
    // Define more specific success type if available from /burnAndReward endpoint
    { message: string; burnTransactionHash?: string; rewardApiResponse?: any },
    Error,
    { amount: string }
  >({
    mutationFn: async ({ amount }: { amount: string }) => {
      const sphereToken = localStorage.getItem("spheretoken");
      if (!sphereToken) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Please enter a valid amount of SPHR to burn.");
      }

      const response = await fetch(
        `https://strato-vault.com/burnAndReward`, // New endpoint
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sphereToken}`, // Auth header
          },
          body: JSON.stringify({
            amountToBurn: amount, // Body structure as per backend endpoint
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Burn and Reward failed", response.status, responseData);
        throw new Error(responseData?.message || "Burn and Reward failed");
      }

      return responseData; // Return the success response
    },
    onSuccess: (data) => {
      showsuccesssnack(
        data.message || "Tokens burned and reward initiated successfully!"
      );
      setBurnAmount(""); // Clear input
      // Invalidate SPHR balance query
      queryClient.invalidateQueries({ queryKey: ["getunlocked"] });
      toggleAnimation(); // Optional: Keep confetti
    },
    onError: (error: Error) => {
      showerrorsnack(
        error.message || "Burn and reward failed. Please try again."
      );
    },
  });

  // Correctly define mutateClaimAirdrop separately
  const { mutate: mutateClaimAirdrop } = useMutation({
    mutationFn: () =>
      claimAirdrop(airdropUid as string, airdropReferId)
        .then((res) => {
          localStorage.removeItem("airdropId");
          showsuccesssnack("You Successfully claimed Airdrop Tokens (SPHR)");
          toggleAnimation();

          if (res?.status == 200) {
            queryClient.invalidateQueries({ queryKey: ["getunlocked"] });
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
    // Add onError/onSuccess if needed, otherwise keep it simple
  });

  const { data: referLink, mutate: mutateReferalLink } = useMutation({
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
            toggleAnimation();
            setIsCheckInDisabled(true);
            updateTimeRemaining();
          })
          .catch(() => {
            showerrorsnack(`Please check in again ${timeRemaining}`);
          }),
    });

  const onTransaction = () => {
    switchtab("sendcrypto");
  };

  const onDeposit = () => {
    navigate("/deposit");
  };

  const onDailyCheckin = () => {
    if (isCheckInDisabled) {
      showerrorsnack(`Check in again ${timeRemaining}`);
      return;
    } else {
      // should call backend endpoint to give users tokens
      mutateDailyCheckin();
    }
  };

  // --- Burn SPHR Handler (Simplified) ---
  const onBurnSphr = async () => {
    // Still async for potential future awaits, but simpler now
    const amountToBurn = parseFloat(burnAmount);
    if (isNaN(amountToBurn) || amountToBurn <= 0) {
      showerrorsnack("Please enter a valid positive amount of SPHR to burn.");
      return;
    }
    if (amountToBurn > sphrBalance) {
      showerrorsnack("Insufficient SPHR balance to burn this amount.");
      return;
    }

    // Directly call the new mutation
    burnAndRewardMutation.mutate({ amount: burnAmount });

    // Removed allowance logic and related try/catch/finally
  };

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

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onExchangeRate = () => {
    localStorage.setItem("prev_page", "rewards");
    navigate("/coininfo");
  };

  useEffect(() => {
    if (airdropId !== null) {
      openAppDialog("loading", "Claiming your Airdrop tokens, please wait...");
      mutateClaimAirdrop();
    }
    mutateReferalLink();
    updateTimeRemaining();

    const timer = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(timer);
  }, [airdropId, mutateReferalLink]); // Added mutateReferalLink dependency

  useBackButton(goBack);

  const sphrBalance = Number(tokenData?.amount || 0) + unlockedAmount;

  return (
    <section
      id="rewards"
      className="flex flex-col bg-[#0e0e0e] text-[#f6f7f9] px-4 py-6 space-y-3 overflow-y-auto pb-20"
    >
      {/* Locked SPHR Card */}
      <div className="bg-[#2a2e2c] rounded-2xl p-6 shadow-lg border border-[#34404f]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-[#f6f7f9] text-xl font-bold">
                Earn SPHR Tokens
              </h2>
              <p className="text-gray-400 text-xs">
                Complete tasks to earn SPHR tokens
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#212523] rounded-xl p-4 mb-4 border border-[#34404f]">
          {isTokenDataLoading ? (
            <div className="h-12 w-32 mx-auto bg-[#34404f] rounded animate-pulse"></div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2" key={sphrBalance}>
                <span className="text-[#f6f7f9] text-3xl font-bold">
                  {formatNumber(sphrBalance)}
                </span>
                <img
                  src={spherelogo}
                  alt="SPHR Token"
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <span className="text-gray-400">SPHR Balance</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDailyCheckin}
            disabled={dailycheckingpending}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center h-16 ${
              isCheckInDisabled
                ? "bg-[#34404f] text-gray-500 cursor-not-allowed"
                : "bg-[#ffb386] text-[#212523] hover:opacity-90"
            }`}
          >
            {dailycheckingpending ? (
              <Loading width="1rem" height="1rem" />
            ) : isCheckInDisabled ? (
              <span className="text-xs text-center">Claim {timeRemaining}</span>
            ) : (
              <>
                <span className="font-semibold">Daily Check-in</span>
                <span className="text-xs flex items-center gap-1 justify-center">
                  +1 SPHR
                  <img
                    src={spherelogo}
                    alt="SPHR"
                    className="w-3 h-3 rounded-full"
                  />
                </span>
              </>
            )}
          </button>
          <button
            onClick={() => navigate("/premiums?returnPath=rewards")}
            className="flex-1 bg-[#2a2e2c] hover:bg-[#34404f] border border-[#34404f] text-[#ffb386] py-3 px-4 rounded-xl text-sm font-medium transition-all h-16"
          >
            x2 Boost
          </button>
        </div>
      </div>

      <span className="sphrexchangerate" onClick={onExchangeRate}>
        SPHR / USDC Exchange Rate <Stake color={colors.accent} />
      </span>

      {/* Earn More SPHR Tasks Card */}
      <div className="bg-[#2a2e2c] rounded-2xl p-6 shadow-lg border border-[#34404f]">
        <h3 className="text-[#f6f7f9] text-lg font-bold mb-2">
          Earn More SPHR Tokens
        </h3>
        <p className="text-gray-400 text-sm mb-6 flex items-center gap-1">
          Complete tasks to earn additional SPHR tokens.
        </p>

        <div className="space-y-4">
          <div className="bg-[#212523] rounded-xl p-4 border border-[#34404f]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={referearn}
                  alt="Refer"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="text-[#f6f7f9] font-medium">Refer & Earn</div>
                  <div className="text-gray-400 text-xs">
                    Earn 10 SPHR for each successful referral
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <div className="flex items-center gap-1">
                  <span className="text-[#f6f7f9] text-sm">+10</span>
                  <img
                    src={spherelogo}
                    alt="SPHR"
                    className="w-4 h-4 rounded-full"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-[#2a2e2c] rounded-lg px-3 py-2 text-xs text-gray-400 truncate border border-[#34404f]">
                {!referLink
                  ? "Creating your link..."
                  : referLink?.referral_link}
              </div>
              <button
                onClick={() => {
                  if (!referLink) {
                    showerrorsnack("Generating your link, please wait");
                  } else {
                    navigator.clipboard.writeText(referLink.referral_link);
                    showsuccesssnack("Link copied!");
                  }
                }}
                className="p-2 rounded-lg bg-[#2a2e2c] hover:bg-[#34404f] transition-colors border border-[#34404f]"
              >
                <Copy width={16} height={16} color="#f6f7f9" />
              </button>
              <button
                onClick={() => {
                  if (!referLink) {
                    showerrorsnack("Generating your link, please wait");
                  } else {
                    openTelegramLink(
                      `https://t.me/share/url?url=${referLink.referral_link}&text=Join%20me%20on%20Sphere!`
                    );
                  }
                }}
                className="p-2 rounded-lg bg-[#2a2e2c] hover:bg-[#34404f] transition-colors border border-[#34404f]"
              >
                <Telegram width={16} height={16} color="#f6f7f9" />
              </button>
            </div>
          </div>

          {/* Moved Task: Deposit Crypto */}
          <div
            className="bg-[#212523] rounded-xl p-4 border border-[#34404f] cursor-pointer hover:bg-[#2f3331] transition-colors"
            onClick={onDeposit}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={transaction} // Using transaction icon for deposit
                  alt="Deposit"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="text-[#f6f7f9] font-medium">
                    Deposit Crypto
                  </div>
                  <div className="text-gray-400 text-xs">
                    Deposit assets to earn SPHR
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <div className="flex items-center gap-1">
                  <span className="text-[#f6f7f9] text-sm">+15</span>
                  <img
                    src={spherelogo}
                    alt="SPHR"
                    className="w-4 h-4 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Moved Task: Make a Transaction */}
          <div
            className="bg-[#212523] rounded-xl p-4 border border-[#34404f] cursor-pointer hover:bg-[#2f3331] transition-colors"
            onClick={onTransaction}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={walletout} // Using wallet out icon for transaction
                  alt="Transaction"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="text-[#f6f7f9] font-medium">
                    Make a Transaction
                  </div>
                  <div className="text-gray-400 text-xs">
                    Perform a transaction to earn SPHR
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <div className="flex items-center gap-1">
                  <span className="text-[#f6f7f9] text-sm">+10</span>{" "}
                  {/* Updated reward */}
                  <img
                    src={spherelogo}
                    alt="SPHR"
                    className="w-4 h-4 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- New Section: Burn SPHR for USDC --- */}
      <div className="bg-[#2a2e2c] rounded-2xl p-6 shadow-lg border border-[#34404f]">
        <h3 className="text-[#f6f7f9] text-lg font-bold mb-2">
          Unlock USDC Rewards
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Burn your SPHR tokens to start the unlock process for USDC. Check the
          exchange rate first!
        </p>
        {/* SPHR Balance Display */}
        <div className="mb-4 p-3 bg-[#212523] rounded-lg border border-[#34404f]">
          <p className="text-xs text-gray-400 mb-1">Your SPHR Balance</p>
          <div className="flex items-center gap-2">
            <span className="text-[#f6f7f9] text-lg font-semibold">
              {formatNumber(sphrBalance)}
            </span>
            <img src={spherelogo} alt="SPHR" className="w-5 h-5 rounded-full" />
          </div>
        </div>

        {/* Burn Amount Input */}
        <div className="mb-4 relative">
          <input
            type="number"
            value={burnAmount}
            onChange={(e) => setBurnAmount(e.target.value)}
            placeholder="Amount of SPHR to Burn"
            min="0" // Prevent negative numbers in browser UI
            step="any" // Allow decimals
            className="w-full py-3 px-4 rounded-xl bg-[#212523] border border-[#34404f] text-[#f6f7f9] focus:outline-none focus:ring-2 focus:ring-[#ffb386] placeholder-gray-500 text-sm"
          />
          {/* Optional: Add a 'Max' button */}
          <button
            onClick={() => setBurnAmount(sphrBalance.toString())}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-[#34404f] hover:bg-[#4a5261] text-[#ffb386] px-2 py-1 rounded"
            disabled={sphrBalance <= 0}
          >
            Max
          </button>
        </div>

        <button
          onClick={onBurnSphr}
          disabled={
            burnAndRewardMutation.isPending ||
            !burnAmount ||
            parseFloat(burnAmount) <= 0 ||
            parseFloat(burnAmount) > sphrBalance
          }
          className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            burnAndRewardMutation.isPending
              ? "bg-[#34404f] text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-[#ff8a50] to-[#ffb386] text-[#212523] hover:opacity-90"
          }`}
        >
          {burnAndRewardMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <Loading width="1rem" height="1rem" /> Processing Burn...
            </div>
          ) : (
            "Burn SPHR for USDC"
          )}
        </button>
      </div>
      {/* ---------------------------------------- */}

      {/* Confetti Animation */}
      {showanimation && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti width="100%" height="100%" />
        </div>
      )}
    </section>
  );
};
