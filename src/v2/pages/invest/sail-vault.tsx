import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useKYCGuard from "@/hooks/use-kyc-guard";
import KYCRequiredModal from "@/components/kyc/KYCRequiredModal";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
} from "react-icons/fi";
import { IoWalletOutline, IoTrendingUp, IoTimeOutline } from "react-icons/io5";
import { CgSpinner } from "react-icons/cg";
import { Check, X } from "lucide-react";
import ActionButton from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  useVaultData,
  useVaultDeposit,
  useVaultWithdraw,
  useVaultClaimRewards,
  useVaultCancelWithdrawal,
  useVaultCancelClaim,
} from "@/hooks/data/use-vault";
import useCountryDetection, {
  SupportedCurrency,
} from "@/hooks/data/use-country-detection";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import rift from "@/lib/rift";

// Fee constants
const WITHDRAWAL_FEE_PERCENT = 0.002; // 0.2%
const PERFORMANCE_FEE_PERCENT = 0.02; // 2%

type ActionMode = "deposit" | "withdraw" | "claim" | null;
type ActionStep = "input" | "confirm" | "processing" | "success" | "failed";

// Currency symbols
const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

// Calculate countdown to next 29th
function getCountdownTo29th(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  let targetDate: Date;

  // If we're past the 29th this month, target next month
  if (currentDay >= 29) {
    // Next month's 29th
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    targetDate = new Date(nextYear, nextMonth, 29, 0, 0, 0);
  } else {
    // This month's 29th
    targetDate = new Date(currentYear, currentMonth, 29, 0, 0, 0);
  }

  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export default function SailVault() {
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [actionStep, setActionStep] = useState<ActionStep>("input");
  const [localAmount, setLocalAmount] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loadingRate, setLoadingRate] = useState(true);
  const [countdown, setCountdown] = useState(getCountdownTo29th());

  // Detect user's country/currency
  const { data: countryInfo } = useCountryDetection();

  // Get user's preferred currency from localStorage or detected country
  const userCurrency = useMemo((): SupportedCurrency => {
    const stored = localStorage.getItem("selected_currency");
    if (stored && stored in CURRENCY_SYMBOLS) {
      return stored as SupportedCurrency;
    }
    if (countryInfo?.currency && countryInfo.currency in CURRENCY_SYMBOLS) {
      return countryInfo.currency as SupportedCurrency;
    }
    return "USD";
  }, [countryInfo]);

  const currencySymbol = CURRENCY_SYMBOLS[userCurrency];

  // Vault data
  const {
    data: vaultData,
    isLoading: vaultLoading,
    refetch: refetchVault,
  } = useVaultData();

  // User's wallet balance (for deposit validation)
  const { data: walletBalance } = useBaseUSDCBalance({
    currency: userCurrency,
  });

  // Mutations
  const depositMutation = useVaultDeposit();
  const withdrawMutation = useVaultWithdraw();
  const claimMutation = useVaultClaimRewards();
  const cancelWithdrawMutation = useVaultCancelWithdrawal();
  const cancelClaimMutation = useVaultCancelClaim();

  const isLoading =
    depositMutation.isPending ||
    withdrawMutation.isPending ||
    claimMutation.isPending ||
    cancelWithdrawMutation.isPending ||
    cancelClaimMutation.isPending;

  // Fetch exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) {
          setLoadingRate(false);
          return;
        }

        rift.setBearerToken(authToken);

        if (userCurrency === "USD") {
          setExchangeRate(1);
          setLoadingRate(false);
          return;
        }

        const response = await rift.offramp.previewExchangeRate({
          currency: userCurrency as any,
        });

        setExchangeRate(response.rate);
      } catch {
        // Fallback rates
        const fallbackRates: Record<SupportedCurrency, number> = {
          KES: 136,
          ETB: 62.5,
          UGX: 3700,
          GHS: 15.8,
          NGN: 1580,
          USD: 1,
        };
        setExchangeRate(fallbackRates[userCurrency]);
      } finally {
        setLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, [userCurrency]);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdownTo29th());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle refresh with animation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchVault();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // KYC Guard
  const { checkKYC, showKYCModal, closeKYCModal, featureName, isUnderReview } =
    useKYCGuard();

  // Open action drawer
  const openActionDrawer = (mode: ActionMode) => {
    // Check KYC for all vault actions
    const featureNames: Record<string, string> = {
      deposit: "vault deposits",
      withdraw: "vault withdrawals",
      claim: "dividend collection",
    };
    if (mode && !checkKYC(featureNames[mode] || "this feature")) return;

    setActionMode(mode);
    setActionStep(mode === "claim" ? "confirm" : "input");
    setLocalAmount("");
  };

  // Close action drawer
  const closeActionDrawer = () => {
    setActionMode(null);
    setActionStep("input");
    setLocalAmount("");
  };

  // Convert local amount to USD for API
  const getUsdAmount = (local: string): string => {
    const localNum = parseFloat(local);
    if (isNaN(localNum) || localNum <= 0) return "0";
    const usd = localNum / exchangeRate;
    return usd.toFixed(2);
  };

  // Handle action execution
  const handleExecuteAction = async () => {
    setActionStep("processing");

    try {
      if (actionMode === "deposit") {
        const usdAmount = getUsdAmount(localAmount);
        await depositMutation.mutateAsync(usdAmount);
      } else if (actionMode === "withdraw") {
        const usdAmount = getUsdAmount(localAmount);
        await withdrawMutation.mutateAsync(usdAmount);
      } else if (actionMode === "claim") {
        await claimMutation.mutateAsync();
      }

      setActionStep("success");
      setTimeout(() => refetchVault(), 2000);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      setActionStep("failed");
    }
  };

  // Handle cancel pending operations
  const handleCancelWithdrawal = async () => {
    try {
      await cancelWithdrawMutation.mutateAsync();
      toast.success("Withdrawal cancelled");
      refetchVault();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel");
    }
  };

  const handleCancelClaim = async () => {
    try {
      await cancelClaimMutation.mutateAsync();
      toast.success("Claim cancelled");
      refetchVault();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel");
    }
  };

  // Format money in local currency
  const formatLocalMoney = (usdValue: string | number) => {
    const usd = typeof usdValue === "string" ? parseFloat(usdValue) : usdValue;
    if (isNaN(usd)) return `${currencySymbol}0`;
    const local = usd * exchangeRate;
    return `${currencySymbol}${local.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Format USD
  const formatUSD = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Get drawer title
  const getDrawerTitle = () => {
    switch (actionMode) {
      case "deposit":
        return "Add Money";
      case "withdraw":
        return "Withdraw";
      case "claim":
        return "Collect Dividends";
      default:
        return "";
    }
  };

  // Get success message
  const getSuccessMessage = () => {
    switch (actionMode) {
      case "deposit":
        return "Your money has been added to Senior Vault. You'll start earning returns from the next payout.";
      case "withdraw":
        return "Your withdrawal request has been submitted. Funds will be available within 24 hours.";
      case "claim":
        return "Your returns are being processed. They'll be in your account within 24 hours.";
      default:
        return "";
    }
  };

  const balance = parseFloat(vaultData?.balance || "0");
  const rewards = parseFloat(vaultData?.rewards || "0");
  const totalValue = balance + rewards;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-screen bg-app-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-surface-subtle">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full transition-colors hover:bg-surface-subtle"
        >
          <FiArrowLeft className="w-5 h-5 text-text-default" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-text-default">
            Senior Vault
          </h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || vaultLoading}
          className="p-2 -mr-2 rounded-full hover:bg-surface-subtle transition-colors disabled:opacity-50"
        >
          <FiRefreshCw
            className={`w-5 h-5 text-text-subtle ${
              isRefreshing || vaultLoading ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
          {/* Logo & Total Value */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-black flex items-center justify-center shadow-lg">
              <img
                src="https://www.liquidroyalty.com/sailr_logo.svg"
                alt="Senior Vault"
                className="w-14 h-14 object-contain"
              />
            </div>
            {vaultLoading || loadingRate ? (
              <div className="flex items-center justify-center gap-2">
                <CgSpinner className="animate-spin text-accent-primary" />
                <span className="text-text-subtle">Loading...</span>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-text-default mb-1">
                  {formatLocalMoney(totalValue)}
                </h2>
                <p className="text-sm text-text-subtle">
                  Your Portfolio • {formatUSD(totalValue)}
                </p>
              </>
            )}
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-surface-alt rounded-xl p-4 border border-surface-subtle">
              <div className="flex items-center gap-2 mb-2">
                <IoWalletOutline className="w-4 h-4 text-text-subtle" />
                <span className="text-xs text-text-subtle">Invested</span>
              </div>
              <p className="text-lg font-semibold text-text-default">
                {formatLocalMoney(balance)}
              </p>
              <p className="text-xs text-text-subtle">{formatUSD(balance)}</p>
            </div>

            <div className="bg-surface-alt rounded-xl p-4 border border-surface-subtle">
              <div className="flex items-center gap-2 mb-2">
                <IoTrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-text-subtle">Dividends</span>
              </div>
              <p className="text-lg font-semibold text-green-500">
                {formatLocalMoney(rewards)}
              </p>
              <p className="text-xs text-text-subtle">{formatUSD(rewards)}</p>
            </div>
          </div>

          {/* Pending Status Alerts */}
          {vaultData?.hasPendingWithdrawal && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">
                    Pending Withdrawal
                  </p>
                  <p className="text-xs text-amber-600/80">
                    {formatLocalMoney(vaultData.pendingWithdrawal)} • Processing
                    within 24h
                  </p>
                </div>
                <button
                  onClick={handleCancelWithdrawal}
                  disabled={cancelWithdrawMutation.isPending}
                  className="text-xs text-amber-600 font-medium hover:underline disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {vaultData?.hasPendingClaim && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Pending Dividend Claim
                  </p>
                  <p className="text-xs text-blue-600/80">
                    Processing within 24h
                  </p>
                </div>
                <button
                  onClick={handleCancelClaim}
                  disabled={cancelClaimMutation.isPending}
                  className="text-xs text-blue-600 font-medium hover:underline disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Countdown to 29th */}
          <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl p-4 mb-4 border border-accent-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <IoTimeOutline className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-default">
                  Next Dividend Payout
                </p>
                <p className="text-xs text-text-subtle">29th of every month</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                <p className="text-xl font-bold text-accent-primary">
                  {countdown.days}
                </p>
                <p className="text-xs text-text-subtle">Days</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                <p className="text-xl font-bold text-accent-primary">
                  {countdown.hours}
                </p>
                <p className="text-xs text-text-subtle">Hours</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                <p className="text-xl font-bold text-accent-primary">
                  {countdown.minutes}
                </p>
                <p className="text-xs text-text-subtle">Mins</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                <p className="text-xl font-bold text-accent-primary">
                  {countdown.seconds}
                </p>
                <p className="text-xs text-text-subtle">Secs</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => openActionDrawer("deposit")}
              className="flex flex-col items-center gap-2 p-4 bg-accent-primary rounded-xl text-white hover:opacity-90 transition-opacity active:scale-95"
            >
              <IoWalletOutline className="w-6 h-6" />
              <span className="text-sm font-medium">Add Money</span>
            </button>

            <button
              onClick={() => openActionDrawer("withdraw")}
              disabled={balance <= 0 || vaultData?.hasPendingWithdrawal}
              className="flex flex-col items-center gap-2 p-4 bg-surface-alt rounded-xl text-text-default border border-surface-subtle hover:bg-surface-subtle transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoWalletOutline className="w-6 h-6" />
              <span className="text-sm font-medium">Withdraw</span>
            </button>

            <button
              onClick={() => openActionDrawer("claim")}
              disabled={rewards <= 0 || vaultData?.hasPendingClaim}
              className="flex flex-col items-center gap-2 p-4 bg-green-500 rounded-xl text-white hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoTrendingUp className="w-6 h-6" />
              <span className="text-sm font-medium">Collect</span>
            </button>
          </div>

          {/* Collapsible Explanation */}
          <div className="bg-surface-alt rounded-xl border border-surface-subtle overflow-hidden">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-subtle transition-colors"
            >
              <span className="text-sm font-medium text-text-default">
                How does Senior Vault work?
              </span>
              {showExplanation ? (
                <FiChevronUp className="w-5 h-5 text-text-subtle" />
              ) : (
                <FiChevronDown className="w-5 h-5 text-text-subtle" />
              )}
            </button>

            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4 text-sm text-text-subtle">
                    {/* What is it */}
                    <div>
                      <p className="font-medium text-text-default mb-1">
                        What is Senior Vault?
                      </p>
                      <p>
                        Senior Vault is a dollar-denominated investment account that 
                        consistently delivers <span className="font-semibold text-green-500">around 10% APY</span> returns. 
                        Your money is held in stable US dollars, protecting your savings 
                        from local currency inflation.
                      </p>
                    </div>

                    {/* Why Dollar Denominated */}
                    <div className="bg-app-background rounded-lg p-3 space-y-2">
                      <p className="font-medium text-text-default text-xs">
                        💵 Why Dollar-Denominated?
                      </p>
                      <p className="text-xs">
                        When you save in local currency, inflation slowly eats away at your 
                        purchasing power. For example, if inflation is 10% and your savings 
                        earn 5%, you're actually <span className="text-red-500">losing 5%</span> in real value every year.
                      </p>
                      <p className="text-xs">
                        With Senior Vault, your money is stored in US dollars which are much 
                        more stable. Even if your local currency loses value, your dollar 
                        savings maintain their purchasing power — and you still earn around 10% on top!
                      </p>
                    </div>

                    {/* Expected Returns */}
                    <div className="bg-green-500/10 rounded-lg p-3">
                      <p className="font-medium text-green-600 text-xs mb-1">
                        📈 Expected Returns
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Around 10% APY</span> — settled every 30 days on the 29th. 
                        Your returns are automatically calculated and added to your account.
                      </p>
                    </div>

                    {/* Simple steps */}
                    <div>
                      <p className="font-medium text-text-default mb-2">
                        How it works:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary text-xs flex items-center justify-center font-medium">
                            1
                          </span>
                          <span>Add money to start earning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary text-xs flex items-center justify-center font-medium">
                            2
                          </span>
                          <span>Earn around 10% APY on your balance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary text-xs flex items-center justify-center font-medium">
                            3
                          </span>
                          <span>Returns settle every 30 days (29th)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary text-xs flex items-center justify-center font-medium">
                            4
                          </span>
                          <span>Withdraw anytime</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs italic text-center pt-2 border-t border-surface-subtle">
                      Protect your savings from inflation while earning consistent returns.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-text-subtle text-center">
            Investment involves risk. Past performance doesn't guarantee future
            returns.
          </p>
        </div>

      {/* Action Drawer */}
      <Drawer
        open={actionMode !== null}
        onClose={closeActionDrawer}
        onOpenChange={(open) => {
          if (!open) closeActionDrawer();
        }}
      >
        <DrawerContent className="min-h-fit max-h-[80vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{getDrawerTitle()}</DrawerTitle>
            <DrawerDescription>
              {actionMode === "deposit"
                ? "Add money to your Senior Vault"
                : actionMode === "withdraw"
                ? "Withdraw from your Senior Vault"
                : "Collect your earnings"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto">
            {/* Input Step */}
            {actionStep === "input" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-text-default">
                  {getDrawerTitle()}
                </h3>

                <div className="space-y-2">
                  <label className="text-sm text-text-subtle">
                    Amount ({userCurrency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      value={localAmount}
                      onChange={(e) => setLocalAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="text-lg pl-12"
                    />
                  </div>

                  {/* Show USD equivalent */}
                  {localAmount && parseFloat(localAmount) > 0 && (
                    <p className="text-xs text-text-subtle">
                      ≈ {formatUSD(getUsdAmount(localAmount))}
                    </p>
                  )}

                  {actionMode === "withdraw" && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-subtle">
                        Available: {formatLocalMoney(balance)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalAmount((balance * exchangeRate).toFixed(0))
                        }
                        className="text-xs text-accent-primary font-medium hover:underline"
                      >
                        Max
                      </button>
                    </div>
                  )}
                </div>

                {/* Deposit: Show wallet balance and validation */}
                {actionMode === "deposit" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-subtle">
                        Wallet Balance:{" "}
                        {formatLocalMoney(walletBalance?.usdcAmount || 0)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalAmount(
                            (
                              (walletBalance?.usdcAmount || 0) * exchangeRate
                            ).toFixed(0)
                          )
                        }
                        className="text-xs text-accent-primary font-medium hover:underline"
                      >
                        Max
                      </button>
                    </div>
                    {localAmount &&
                      parseFloat(getUsdAmount(localAmount)) >
                        (walletBalance?.usdcAmount || 0) && (
                        <p className="text-xs text-red-500">
                          ⚠️ Insufficient balance. You need{" "}
                          {formatLocalMoney(
                            parseFloat(getUsdAmount(localAmount))
                          )}{" "}
                          but only have{" "}
                          {formatLocalMoney(walletBalance?.usdcAmount || 0)}
                        </p>
                      )}
                  </div>
                )}

                <div className="text-xs text-text-subtle space-y-1">
                  {actionMode === "deposit" ? (
                    <p>
                      💡 This amount will be deducted from your wallet balance
                    </p>
                  ) : (
                    <>
                      <p>💡 A 0.2% withdrawal fee will be charged</p>
                      <p className="text-amber-500">
                        ⚠️ If you cancel after confirming, the 0.2% fee is
                        non-refundable
                      </p>
                    </>
                  )}
                </div>

                <ActionButton
                  onClick={() => setActionStep("confirm")}
                  disabled={
                    !localAmount ||
                    parseFloat(localAmount) <= 0 ||
                    (actionMode === "deposit" &&
                      parseFloat(getUsdAmount(localAmount)) >
                        (walletBalance?.usdcAmount || 0))
                  }
                >
                  Continue
                </ActionButton>
              </motion.div>
            )}

            {/* Confirm Step */}
            {actionStep === "confirm" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-text-default">
                  Confirm {getDrawerTitle()}
                </h3>

                <div className="bg-surface-alt rounded-xl p-4 space-y-3">
                  {actionMode === "claim" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-subtle">
                          Dividends to collect
                        </span>
                        <div className="text-right">
                          <span className="font-semibold text-text-default">
                            {formatLocalMoney(rewards)}
                          </span>
                          <p className="text-xs text-text-subtle">
                            {formatUSD(rewards)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">
                          Performance Fee (2%)
                        </span>
                        <span className="text-red-500">
                          -{formatLocalMoney(rewards * PERFORMANCE_FEE_PERCENT)}
                        </span>
                      </div>
                      <div className="border-t border-surface-subtle pt-2 flex justify-between">
                        <span className="font-medium text-text-default">
                          You'll receive
                        </span>
                        <span className="font-semibold text-green-500">
                          {formatLocalMoney(
                            rewards * (1 - PERFORMANCE_FEE_PERCENT)
                          )}
                        </span>
                      </div>
                    </>
                  ) : actionMode === "deposit" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-subtle">
                          Amount to deposit
                        </span>
                        <div className="text-right">
                          <span className="font-semibold text-text-default">
                            {currencySymbol}
                            {parseFloat(localAmount || "0").toLocaleString()}
                          </span>
                          <p className="text-xs text-text-subtle">
                            {formatUSD(getUsdAmount(localAmount))}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">
                          From wallet balance
                        </span>
                        <span className="text-text-default">
                          {formatLocalMoney(walletBalance?.usdcAmount || 0)}
                        </span>
                      </div>
                      <div className="border-t border-surface-subtle pt-2 flex justify-between">
                        <span className="font-medium text-text-default">
                          New investment total
                        </span>
                        <span className="font-semibold text-accent-primary">
                          {formatLocalMoney(
                            balance + parseFloat(getUsdAmount(localAmount))
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-subtle">
                          Withdrawal amount
                        </span>
                        <div className="text-right">
                          <span className="font-semibold text-text-default">
                            {currencySymbol}
                            {parseFloat(localAmount || "0").toLocaleString()}
                          </span>
                          <p className="text-xs text-text-subtle">
                            {formatUSD(getUsdAmount(localAmount))}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">
                          Withdrawal Fee (0.2%)
                        </span>
                        <span className="text-red-500">
                          -
                          {formatLocalMoney(
                            parseFloat(getUsdAmount(localAmount)) *
                              WITHDRAWAL_FEE_PERCENT
                          )}
                        </span>
                      </div>
                      <div className="border-t border-surface-subtle pt-2 flex justify-between">
                        <span className="font-medium text-text-default">
                          You'll receive
                        </span>
                        <span className="font-semibold text-green-500">
                          {formatLocalMoney(
                            parseFloat(getUsdAmount(localAmount)) *
                              (1 - WITHDRAWAL_FEE_PERCENT)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">
                          Remaining investment
                        </span>
                        <span className="text-text-default">
                          {formatLocalMoney(
                            balance - parseFloat(getUsdAmount(localAmount))
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Warning about non-refundable fees - only for withdrawals */}
                {actionMode === "withdraw" && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-xs text-amber-600 font-medium mb-1">
                      ⚠️ Important
                    </p>
                    <p className="text-xs text-amber-600/80">
                      The 0.2% withdrawal fee (
                      {formatLocalMoney(
                        parseFloat(getUsdAmount(localAmount)) *
                          WITHDRAWAL_FEE_PERCENT
                      )}
                      ) is charged immediately. If you cancel before settlement,
                      this fee is <strong>non-refundable</strong>.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <ActionButton
                    variant="ghost"
                    onClick={() =>
                      setActionStep(
                        actionMode === "claim" ? "confirm" : "input"
                      )
                    }
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {actionMode === "claim" ? "Cancel" : "Back"}
                  </ActionButton>
                  <ActionButton
                    onClick={handleExecuteAction}
                    disabled={isLoading}
                    loading={isLoading}
                    className="flex-1"
                  >
                    Confirm
                  </ActionButton>
                </div>
              </motion.div>
            )}

            {/* Processing Step */}
            {actionStep === "processing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <CgSpinner className="w-12 h-12 text-accent-primary animate-spin" />
                <p className="text-lg font-medium text-text-default">
                  Processing...
                </p>
                <p className="text-sm text-text-subtle text-center">
                  This may take a few moments. Please don't close this screen.
                </p>
              </motion.div>
            )}

            {/* Success Step */}
            {actionStep === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-default">
                  Success!
                </h3>
                <p className="text-sm text-text-subtle text-center max-w-xs">
                  {getSuccessMessage()}
                </p>

                <ActionButton onClick={closeActionDrawer} className="mt-4">
                  Done
                </ActionButton>
              </motion.div>
            )}

            {/* Failed Step */}
            {actionStep === "failed" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-default">
                  Something went wrong
                </h3>
                <p className="text-sm text-text-subtle text-center">
                  Please try again or contact support if the problem persists.
                </p>

                <div className="flex gap-3 w-full mt-4">
                  <ActionButton
                    variant="ghost"
                    onClick={closeActionDrawer}
                    className="flex-1"
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    onClick={() => setActionStep("input")}
                    className="flex-1"
                  >
                    Try Again
                  </ActionButton>
                </div>
              </motion.div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* KYC Required Modal */}
      <KYCRequiredModal
        isOpen={showKYCModal}
        onClose={closeKYCModal}
        featureName={featureName}
        isUnderReview={isUnderReview}
      />
    </motion.div>
  );
}
