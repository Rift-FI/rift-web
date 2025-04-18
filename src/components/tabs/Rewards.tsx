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
  unlockTokensHistory,
} from "../../utils/api/airdrop";
import { formatNumber } from "../../utils/formatters";
import { createReferralLink } from "../../utils/api/refer";
import {
  dateDistance,
  formatDateToStr,
  formatSeconds,
} from "../../utils/dates";
import { Copy, Stake, Telegram } from "../../assets/icons/actions";
import { Confetti, Loading } from "../../assets/animations";
import referearn from "../../assets/images/icons/refer.png";
import spherelogo from "../../assets/images/sphere.jpg";
import usdclogo from "../../assets/images/labs/usdc.png";
import walletout from "../../assets/images/wallet_out.png";
import transaction from "../../assets/images/obhehalfspend.png";
import "../../styles/components/tabs/rewards.scss";
import { colors } from "@/constants";

// --- API Response Types ---
interface ClaimInfoData {
  address: string;
  canClaim: boolean;
  timeUntilClaim: string; // Assuming this is seconds as string
  pendingWbera: string; // Treating as pending USDC
  lastBurnTimestamp: string;
}

interface ClaimInfoResponse {
  status: string;
  data: ClaimInfoData;
}

// --- Placeholder Type for Pending Unlock Data ---
// TODO: Replace with actual type from API

// --- Burn SPHR Response Type (Placeholder) ---
interface BurnResponse {
  // Define expected success response structure
  message: string;
}

export const Rewards = (): JSX.Element => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { switchtab } = useTabs();

  const ethAddress = localStorage.getItem("ethaddress");
  const airdropId = localStorage.getItem("airdropId");
  const airdropUid = airdropId?.split("-")[1];
  const airdropReferId = airdropId?.split("-")[2];
  // const localdailycheckintime = localStorage.getItem("nextdailychekin");

  const [unlockedAmount, setUnlockedAmount] = useState<number>(0);
  const [showanimation, setshowanimation] = useState<boolean>(false);
  const [isCheckInDisabled, setIsCheckInDisabled] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [claimCooldownRemaining, setClaimCooldownRemaining] =
    useState<string>(""); // State for formatted cooldown
  const [burnAmount, setBurnAmount] = useState<string>(""); // State for SPHR burn amount input

  const toggleAnimation = () => {
    setshowanimation(true);
    setTimeout(() => setshowanimation(false), 3000);
  };

  const { data: tokenData, isLoading: isTokenDataLoading } = useQuery({
    queryKey: ["getunlocked"],
    queryFn: getUnlockedTokens,
  });

  const { data: unlockhistorydata } = useQuery({
    queryKey: ["unlockhistory"],
    queryFn: unlockTokensHistory,
  });

  // --- Fetch Claim Info Query ---
  const claimInfoQuery = useQuery<ClaimInfoData, Error>({
    queryKey: ["claimInfo", ethAddress],
    queryFn: async () => {
      if (!ethAddress) throw new Error("Ethereum address not found");
      const response = await fetch(
        `https://rewardsvault-production.up.railway.app/api/exchange/claim-info/${ethAddress}`
      );
      if (!response.ok) {
        // Handle non-2xx responses appropriately
        console.error("Failed to fetch claim info", response.status);
        throw new Error("Failed to fetch claim info");
      }
      const result: ClaimInfoResponse = await response.json();
      if (result.status !== "success") {
        throw new Error(
          result.data?.toString() || "Failed to fetch claim info data"
        );
      }
      return result.data;
    },
    enabled: !!ethAddress, // Only run if ethAddress exists
    refetchInterval: 30000, // Refetch every 30 seconds to update cooldown
  });

  // --- Claim Mutation ---
  const claimMutation = useMutation<any, Error>({
    // Replace 'any' with a more specific success type if available
    mutationFn: async () => {
      alert("claimMutation");
      if (!ethAddress) throw new Error("Ethereum address not found");
      const response = await fetch(
        `https://rewardsvault-production.up.railway.app/api/exchange/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address: ethAddress }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        console.error("Claim failed", response.status, errorData);
        throw new Error(errorData?.message || "Claim failed");
      }
      return response.json(); // Or handle success response structure
    },
    onSuccess: () => {
      showsuccesssnack("USDC claimed successfully!");
      queryClient.invalidateQueries({ queryKey: ["claimInfo", ethAddress] });
      queryClient.invalidateQueries({ queryKey: ["getunlocked"] }); // Refresh withdrawable balance
    },
    onError: (error) => {
      showerrorsnack(`Claim failed: ${error.message}`);
    },
  });

  // --- Burn SPHR Mutation ---
  const burnMutation = useMutation<BurnResponse, Error, { amount: string }>({
    mutationFn: async ({ amount }: { amount: string }) => {
      const privateKey = import.meta.env.VITE_APP_BURNER_PRIVATE_KEY;
      if (!ethAddress) throw new Error("Ethereum address not found");
      if (!privateKey) {
        console.error("Burner private key not found in environment variables.");
        throw new Error("Configuration error: Unable to proceed with burn.");
      }
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Please enter a valid amount of SPHR to burn.");
      }

      const response = await fetch(
        `https://rewardsvault-production.up.railway.app/api/exchange/burn`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            privateKey: privateKey,
            address: ethAddress,
            sphrAmount: amount, // Send the amount from the input
          }),
        }
      );

      const responseData = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        console.error("Burn failed", response.status, responseData);
        // Use message from API response if available
        throw new Error(responseData?.message || "Burn failed");
      }

      // Assuming successful response includes a message field
      return responseData as BurnResponse;
    },
    onSuccess: (data: BurnResponse) => {
      showsuccesssnack(
        data.message || "SPHR burned successfully! USDC unlock initiated."
      );
      setBurnAmount(""); // Clear input on success
      queryClient.invalidateQueries({ queryKey: ["claimInfo", ethAddress] });
      queryClient.invalidateQueries({ queryKey: ["getunlocked"] });
      toggleAnimation();
    },
    onError: (error: Error) => {
      // Error message should now come from the throw in mutationFn
      showerrorsnack(error.message || "Burn failed. Please try again.");
    },
  });

  // Correctly define mutateClaimAirdrop separately
  const { mutate: mutateClaimAirdrop } = useMutation({
    mutationFn: () =>
      claimAirdrop(airdropUid as string, airdropReferId)
        .then(() => {
          localStorage.removeItem("airdropId");
          showsuccesssnack("You Successfully claimed Airdrop Tokens (SPHR)");
          toggleAnimation();
          queryClient.invalidateQueries({ queryKey: ["unlockhistory"] });
          queryClient
            .invalidateQueries({ queryKey: ["getunlocked"] })
            .then(() => {
              closeAppDialog();
            });
        })
        .catch(() => {
          localStorage.removeItem("airdropId");
          showerrorsnack("Sorry, the Airdrop did not work");
          queryClient.invalidateQueries({ queryKey: ["unlockhistory"] });
          queryClient
            .invalidateQueries({ queryKey: ["getunlocked"] })
            .then(() => {
              closeAppDialog();
            });
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
            queryClient.invalidateQueries({ queryKey: ["unlockhistory"] });
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

  // --- Burn SPHR Handler ---
  const onBurnSphr = () => {
    const amountToBurn = parseFloat(burnAmount);
    if (isNaN(amountToBurn) || amountToBurn <= 0) {
      showerrorsnack("Please enter a valid positive amount of SPHR to burn.");
      return;
    }
    if (amountToBurn > sphrBalance) {
      showerrorsnack("Insufficient SPHR balance to burn this amount.");
      return;
    }

    // Pass the amount string to the mutation
    burnMutation.mutate({ amount: burnAmount });
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

  const onWithdraw = () => {
    // Check if withdrawal is allowed based on claimInfo data (after burn cooldown)
    if (!claimInfoQuery.data?.canClaim) {
      showerrorsnack(
        `Withdrawal not ready yet. Cooldown: ${
          claimCooldownRemaining || "Calculating..."
        }`
      );
      return;
    }
    claimMutation.mutate();
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

  // Effect to format cooldown time
  useEffect(() => {
    if (claimInfoQuery.data && !claimInfoQuery.data.canClaim) {
      const seconds = parseInt(claimInfoQuery.data.timeUntilClaim, 10);
      if (!isNaN(seconds) && seconds > 0) {
        setClaimCooldownRemaining(formatSeconds(seconds));
      } else {
        setClaimCooldownRemaining("Calculating..."); // Or handle 0/error case
      }
    } else {
      setClaimCooldownRemaining("");
    }
  }, [claimInfoQuery.data]);

  useBackButton(goBack);

  const sphrBalance = Number(tokenData?.amount || 0) + unlockedAmount;
  const unlockedUsdcBalance = Number(tokenData?.unlocked || 0);
  const pendingUsdcAmount = Number(claimInfoQuery.data?.pendingWbera || 0); // Use data from claimInfoQuery

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

          <div className="text-right">
            <p className="text-gray-400 text-xs mb-1">Claimed USDC</p>
            {isTokenDataLoading ? (
              <div className="h-6 w-16 bg-[#34404f] rounded animate-pulse"></div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#f6f7f9] text-lg font-bold">
                    {formatNumber(unlockedUsdcBalance)}
                  </span>
                  <img
                    src={usdclogo}
                    alt="USDC"
                    className="w-5 h-5 rounded-full"
                  />
                </div>
              </div>
            )}
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
            burnMutation.isPending ||
            !burnAmount ||
            parseFloat(burnAmount) <= 0 ||
            parseFloat(burnAmount) > sphrBalance // Disable if input > balance
          }
          className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            burnMutation.isPending ||
            !burnAmount ||
            parseFloat(burnAmount) <= 0 ||
            parseFloat(burnAmount) > sphrBalance
              ? "bg-[#34404f] text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-[#ff8a50] to-[#ffb386] text-[#212523] hover:opacity-90"
          }`}
        >
          {burnMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <Loading width="1rem" height="1rem" /> Burning SPHR...
            </div>
          ) : (
            "Burn SPHR for USDC"
          )}
        </button>
        {/* Optional: Add info about minimum burn amount or link to exchange rate */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          Burning SPHR initiates a cooldown period before USDC can be claimed.
        </p>
      </div>
      {/* ---------------------------------------- */}

      {/* Pending Unlocks Section - Updated with API data */}
      <div className="bg-[#2a2e2c] rounded-2xl p-6 shadow-lg border border-[#34404f]">
        <h3 className="text-[#f6f7f9] text-lg font-bold mb-4">
          Pending Unlocks & Withdrawals
        </h3>
        {claimInfoQuery.isLoading ? (
          <div className="text-center text-gray-400 py-8">
            Loading pending unlocks...
          </div>
        ) : claimInfoQuery.isError ? (
          <div className="text-center text-red-400 py-8">
            Error loading pending unlocks.
          </div>
        ) : pendingUsdcAmount > 0 ? ( // Check if there's a pending amount
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#212523] rounded-lg border border-[#34404f]">
              <div className="flex items-center gap-3">
                <img
                  src={spherelogo}
                  alt="USDC"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm text-[#f6f7f9] font-medium">
                    {formatNumber(pendingUsdcAmount)} USDC
                  </p>
                  <p className="text-xs text-gray-400">Pending Withdrawal</p>
                </div>
              </div>
              {claimInfoQuery.data?.canClaim ? (
                <button
                  onClick={onWithdraw}
                  disabled={claimMutation.isPending}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-opacity ${
                    claimMutation.isPending
                      ? "bg-[#34404f] text-gray-500 cursor-not-allowed"
                      : "bg-[#ffb386] text-[#212523] hover:opacity-90"
                  }`}
                >
                  {claimMutation.isPending ? "Withdrawing..." : "Withdraw"}
                </button>
              ) : (
                <span className="text-xs text-gray-400 text-right">
                  Ready in {claimCooldownRemaining || "..."}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No pending unlocks. Complete tasks to unlock USDC.
            {/* Removed Coming Soon text as functionality is added */}
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="bg-[#2a2e2c] rounded-2xl p-6 shadow-lg border border-[#34404f]">
        <h3 className="text-[#f6f7f9] text-lg font-bold mb-4">History</h3>
        <div className="space-y-4">
          {unlockhistorydata && unlockhistorydata[0]?.message?.length > 0 ? (
            unlockhistorydata[0]?.message?.map(
              (message: string, index: number) => {
                const parts = message.split(" ");
                const potentialDate = parts[parts.length - 1];
                let dateStr = "";
                let description = message;
                // Basic date check - might need refinement
                if (
                  potentialDate &&
                  potentialDate.includes("-") &&
                  !isNaN(Date.parse(potentialDate))
                ) {
                  dateStr = potentialDate;
                  description = parts.slice(0, -1).join(" ");
                } else {
                  description = message;
                }

                return (
                  <div
                    key={index}
                    className="border-b border-[#34404f] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="text-[#f6f7f9] text-sm mb-1">
                      {description}
                    </div>
                    {dateStr && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">
                          {formatDateToStr(dateStr)}
                        </span>
                        <span className="text-[#ffb386]">
                          {dateDistance(dateStr)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
            )
          ) : (
            <div className="text-center text-gray-400 py-8">
              No history available yet.
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
