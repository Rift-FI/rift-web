import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiAlertCircle, FiInfo } from "react-icons/fi";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useWithdraw, SOURCE_CONFIGS } from "../context";
import useUser from "@/hooks/data/use-user";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useAnalytics from "@/hooks/use-analytics";
import ActionButton from "@/components/ui/action-button";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import useDesktopDetection from "@/hooks/use-desktop-detection";

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh",
  NGN: "\u20A6",
  UGX: "USh",
  TZS: "TSh",
  CDF: "FC",
  MWK: "MK",
  BRL: "R$",
  USD: "$",
};

export default function WithdrawAmountInput() {
  const navigate = useNavigate();
  const { withdrawData, updateWithdrawData, setCurrentStep } = useWithdraw();
  const { data: user } = useUser();
  const { logEvent } = useAnalytics();
  const isDesktop = useDesktopDetection();

  // Get selected source config
  const selectedSource = withdrawData.selectedSource;
  const sourceConfig = SOURCE_CONFIGS.find((s) => s.id === selectedSource);

  // Get payment account currency
  const paymentAccountCurrency: SupportedCurrency = (() => {
    const paymentAccount = user?.paymentAccount || user?.payment_account;
    if (paymentAccount) {
      try {
        return JSON.parse(paymentAccount).currency || "KES";
      } catch {
        return "KES";
      }
    }
    return "KES";
  })();

  const { data: balanceData, isLoading: balanceLoading } = useAggregateBalance({
    currency: paymentAccountCurrency,
  });

  // Get balance for the selected source only
  const sourceBalance = useMemo(() => {
    if (!balanceData?.breakdown || !sourceConfig) return 0;
    return (
      balanceData.breakdown.find(
        (b) => b.token === sourceConfig.token && b.chain === sourceConfig.chain
      )?.amount ?? 0
    );
  }, [balanceData?.breakdown, sourceConfig]);

  // Convert source USD balance to local currency
  const exchangeRate = balanceData?.exchangeRate || 1;
  const sourceLocalBalance = sourceBalance * exchangeRate;

  // Fetch fee preview from API
  const { data: feePreview, isLoading: feeLoading } = useOfframpFeePreview(paymentAccountCurrency);

  const [localAmount, setLocalAmount] = useState("");

  // Check if user has payment account configured
  const hasPaymentAccount = !!(user?.paymentAccount || user?.payment_account);

  const currencySymbol = CURRENCY_SYMBOLS[paymentAccountCurrency];
  const currencyCode = paymentAccountCurrency;

  // Get buying rate from fee preview
  const buyingRate = feePreview?.buying_rate || feePreview?.rate || null;
  const loadingRate = feeLoading;

  // Max withdrawable local amount (accounting for fees)
  const maxWithdrawableLocal = useMemo(() => {
    if (!feePreview || sourceBalance <= 0) return 0;
    const rate = feePreview.buying_rate || feePreview.rate;
    const feePercent = (feePreview.feeBps || 100) / 10000;
    return Math.floor((sourceBalance * rate) / (1 + feePercent));
  }, [feePreview, sourceBalance]);

  // Calculate fee breakdown when amount changes
  const feeBreakdown = useMemo(() => {
    const amount = parseFloat(localAmount);
    if (!feePreview || isNaN(amount) || amount <= 0) return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [localAmount, feePreview]);

  // Check if user has enough balance on the selected source
  const hasInsufficientBalance = useMemo(() => {
    if (!feeBreakdown) return false;
    return feeBreakdown.usdcNeeded > sourceBalance;
  }, [feeBreakdown, sourceBalance]);

  // Calculate minimum withdrawal: 0.3 USDC x buying_rate
  const minWithdrawalLocal = buyingRate ? Math.round(0.3 * buyingRate) : 10;

  const handleAmountChange = (value: string) => {
    const numericValue = parseFloat(value);
    if (value === "" || !isNaN(numericValue)) {
      setLocalAmount(value);
    }
  };

  const handleBack = () => setCurrentStep("source");

  const handleNext = () => {
    const amount = parseFloat(localAmount);

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount < minWithdrawalLocal) {
      toast.error(
        `Minimum withdrawal is ${currencySymbol} ${minWithdrawalLocal.toLocaleString()}`
      );
      return;
    }

    if (hasInsufficientBalance && feeBreakdown) {
      toast.error(
        `Insufficient balance on ${sourceConfig?.chainLabel}. You need $${feeBreakdown.usdcNeeded.toFixed(2)} but only have $${sourceBalance.toFixed(2)}.`
      );
      return;
    }

    logEvent("WITHDRAW_INITIATED", {
      amount_local: amount,
      amount_usd: feeBreakdown?.usdcAmount || amount / exchangeRate,
      currency: currencyCode,
      exchange_rate: exchangeRate,
      fee_local: feeBreakdown?.feeLocal || 0,
      fee_percentage: feeBreakdown?.feePercentage || 0,
      source: selectedSource,
      chain: sourceConfig?.sdkChain,
      token: sourceConfig?.token,
    });

    updateWithdrawData({
      amount,
      currency: currencyCode,
      feeBreakdown: feeBreakdown || undefined,
    });
    setCurrentStep("confirmation");
  };

  const handleSetupPaymentAccount = () => {
    navigate("/app/profile");
    toast.info("Please setup your withdrawal account in profile settings");
  };

  const isValidAmount =
    localAmount &&
    parseFloat(localAmount) >= minWithdrawalLocal &&
    !hasInsufficientBalance;

  if (!hasPaymentAccount) {
    return (
      <motion.div
        initial={{ x: -4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex flex-col h-full p-4 items-center justify-center"
      >
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
          <FiAlertCircle className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Setup Required</h2>
        <p className="text-text-subtle text-center mb-8 max-w-sm">
          You need to setup a withdrawal account before you can withdraw funds.
        </p>
        <div className="w-full max-w-sm space-y-3">
          <ActionButton onClick={handleSetupPaymentAccount} className="w-full">
            Setup Withdrawal Account
          </ActionButton>
          <ActionButton
            onClick={() => navigate("/app")}
            className="w-full bg-surface-subtle text-text-subtle"
          >
            Go Back
          </ActionButton>
        </div>
      </motion.div>
    );
  }

  // Selected source card
  const sourceInfo = sourceConfig && (
    <div className="flex items-center gap-3 bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-3">
      <img src={sourceConfig.icon} alt="" className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <p className="text-sm font-semibold">
          {sourceConfig.token} on {sourceConfig.chainLabel}
        </p>
        <p className="text-xs text-text-subtle">
          ${sourceBalance.toFixed(2)} available
          {paymentAccountCurrency !== "USD" &&
            ` (~${currencySymbol} ${Math.floor(sourceLocalBalance).toLocaleString()})`}
        </p>
      </div>
      <button
        onClick={handleBack}
        className="text-xs text-accent-primary font-medium hover:underline"
      >
        Change
      </button>
    </div>
  );

  const amountInput = (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-1 mb-2">
        <span className="text-lg font-medium">{currencySymbol}</span>
        <input
          type="number"
          value={localAmount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          className="text-4xl font-bold bg-transparent border-none outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{
            width: `${Math.max(2, (localAmount || "0").length + 0.5)}ch`,
          }}
          autoFocus
          inputMode="decimal"
        />
        {buyingRate &&
          paymentAccountCurrency !== "USD" &&
          parseFloat(localAmount) > 0 && (
            <span className="text-xs text-text-subtle whitespace-nowrap">
              ≈ ${(parseFloat(localAmount) / buyingRate).toFixed(2)}
            </span>
          )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <p className="text-xs text-text-subtle">
          Minimum {currencySymbol} {minWithdrawalLocal.toLocaleString()}
        </p>
        {maxWithdrawableLocal > 0 && (
          <>
            <span className="text-xs text-text-subtle">·</span>
            <button
              onClick={() => setLocalAmount(maxWithdrawableLocal.toString())}
              className="text-xs font-semibold text-accent-primary hover:underline"
            >
              Max {currencySymbol} {maxWithdrawableLocal.toLocaleString()}
            </button>
          </>
        )}
      </div>
    </div>
  );

  const quickButtons = (
    <div className="grid grid-cols-3 gap-2">
      {[minWithdrawalLocal, 100, 500, 1000, 2000, 5000]
        .filter((amount, index, arr) => arr.indexOf(amount) === index)
        .sort((a, b) => a - b)
        .slice(0, 6)
        .map((amount) => (
          <button
            key={amount}
            onClick={() => setLocalAmount(amount.toString())}
            className="p-3 bg-surface-subtle rounded-lg hover:bg-surface transition-colors text-sm font-medium"
          >
            {currencySymbol} {amount.toLocaleString()}
          </button>
        ))}
    </div>
  );

  const feeCard =
    feeBreakdown && parseFloat(localAmount) > 0 ? (
      <div className="bg-surface-subtle rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <FiInfo className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-medium">Fee Breakdown</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-subtle">You receive</span>
          <span className="font-medium">
            {currencySymbol} {feeBreakdown.localAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-subtle">
            Fee ({feeBreakdown.feePercentage}%)
          </span>
          <span className="font-medium text-yellow-600">
            + {currencySymbol} {feeBreakdown.feeLocal.toLocaleString()}
          </span>
        </div>
        <div className="border-t border-surface pt-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-subtle">Total deducted</span>
            <span className="font-bold">
              {currencySymbol}{" "}
              {feeBreakdown.totalLocalDeducted.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-text-subtle">
              {sourceConfig?.token} on {sourceConfig?.chainLabel}
            </span>
            <span
              className={
                hasInsufficientBalance
                  ? "text-red-500 font-medium"
                  : "text-green-600"
              }
            >
              ${sourceBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    ) : null;

  const insufficientWarning =
    hasInsufficientBalance && feeBreakdown ? (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <p className="text-sm text-red-700 dark:text-red-300">
          Insufficient balance on {sourceConfig?.chainLabel}. You need $
          {feeBreakdown.usdcNeeded.toFixed(2)} but only have $
          {sourceBalance.toFixed(2)} in {sourceConfig?.token}.
        </p>
      </div>
    ) : null;

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col h-full overflow-hidden"
    >
      {isDesktop ? (
        <div className="w-full max-w-2xl mx-auto p-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Enter Amount
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Withdrawing {sourceConfig?.token} from {sourceConfig?.chainLabel}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            {sourceInfo}
            <div className="w-full max-w-sm mx-auto space-y-4">
              {amountInput}
              {quickButtons}
              {feeCard}
              {insufficientWarning}
            </div>
            <div className="mt-2">
              <ActionButton
                onClick={handleNext}
                disabled={!isValidAmount || loadingRate}
                loading={loadingRate}
                className="w-full max-w-sm mx-auto rounded-2xl"
              >
                {loadingRate
                  ? "Loading..."
                  : hasInsufficientBalance
                  ? "Insufficient Balance"
                  : "Continue"}
              </ActionButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-4 flex-shrink-0">
            <button onClick={handleBack} className="p-2">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Enter Amount</h1>
            <div className="w-5 h-5" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
            {sourceInfo}
            {amountInput}
            {quickButtons}
            {feeCard}
            {insufficientWarning}
          </div>
          <div className="p-4">
            <ActionButton
              onClick={handleNext}
              disabled={!isValidAmount || loadingRate}
              loading={loadingRate}
              className="w-full rounded-2xl"
            >
              {loadingRate
                ? "Loading..."
                : hasInsufficientBalance
                ? "Insufficient Balance"
                : "Continue"}
            </ActionButton>
          </div>
        </div>
      )}
    </motion.div>
  );
}
