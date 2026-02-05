import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiAlertCircle, FiInfo } from "react-icons/fi";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useWithdraw } from "../context";
import useUser from "@/hooks/data/use-user";
import useBaseUSDCBalance, { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useAnalaytics from "@/hooks/use-analytics";
import ActionButton from "@/components/ui/action-button";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import rift from "@/lib/rift";
import useDesktopDetection from "@/hooks/use-desktop-detection";

// Currency symbols map
const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

export default function WithdrawAmountInput() {
  const navigate = useNavigate();
  const { updateWithdrawData, setCurrentStep } = useWithdraw();
  const { data: user } = useUser();
  const { logEvent } = useAnalaytics();
  const isDesktop = useDesktopDetection();
  
  // Get payment account currency
  const paymentAccountCurrency: SupportedCurrency = (() => {
    const paymentAccount = user?.paymentAccount || user?.payment_account;
    if (paymentAccount) {
      try {
        const account = JSON.parse(paymentAccount);
        return account.currency || "KES";
      } catch {
        return "KES";
      }
    }
    return "KES";
  })();

  const { data: balanceData, isLoading: balanceLoading } = useBaseUSDCBalance({
    currency: paymentAccountCurrency,
  });
  
  // Fetch fee preview from API
  const { data: feePreview, isLoading: feeLoading } = useOfframpFeePreview(paymentAccountCurrency);
  
  const [localAmount, setLocalAmount] = useState("");

  // Check if user has payment account configured
  const hasPaymentAccount = !!(user?.paymentAccount || user?.payment_account);

  // Get balance in local currency and USDC
  const localBalance = balanceData?.localAmount || 0;
  const usdcBalance = balanceData?.usdcAmount || 0;
  const currencySymbol = CURRENCY_SYMBOLS[paymentAccountCurrency];
  const currencyCode = paymentAccountCurrency;
  
  // Get buying rate from fee preview
  const buyingRate = feePreview?.buying_rate || feePreview?.rate || null;
  const loadingRate = feeLoading;

  // Calculate fee breakdown when amount changes
  const feeBreakdown = useMemo(() => {
    const amount = parseFloat(localAmount);
    if (!feePreview || isNaN(amount) || amount <= 0) return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [localAmount, feePreview]);

  // Check if user has enough USDC balance (including fee)
  const hasInsufficientBalance = useMemo(() => {
    if (!feeBreakdown) return false;
    return feeBreakdown.usdcNeeded > usdcBalance;
  }, [feeBreakdown, usdcBalance]);

  // Calculate minimum withdrawal: 0.3 USDC × buying_rate
  const minWithdrawalLocal = buyingRate ? Math.round(0.3 * buyingRate) : 10;

  const handleAmountChange = (value: string) => {
    const numericValue = parseFloat(value);

    // Allow empty input or valid numbers
    if (value === "" || !isNaN(numericValue)) {
      setLocalAmount(value);
    }
  };

  const handleNext = () => {
    const amount = parseFloat(localAmount);

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount < minWithdrawalLocal) {
      toast.error(
        `Minimum withdrawal is ${currencySymbol} ${minWithdrawalLocal.toLocaleString()} (0.3 USDC)`
      );
      return;
    }

    // Check if user has sufficient USDC balance (including fee)
    if (hasInsufficientBalance && feeBreakdown) {
      toast.error(
        `Insufficient balance. You need ${feeBreakdown.usdcNeeded.toFixed(4)} USDC (includes ${currencySymbol} ${feeBreakdown.feeLocal.toLocaleString()} fee) but only have ${usdcBalance.toFixed(4)} USDC.`
      );
      return;
    }

    // Track withdrawal initiation
    const usdAmount = feeBreakdown?.usdcAmount || (amount / (balanceData?.exchangeRate || 1));
    logEvent("WITHDRAW_INITIATED", {
      amount_local: amount,
      amount_usd: usdAmount,
      currency: currencyCode,
      exchange_rate: balanceData?.exchangeRate || 1,
      fee_local: feeBreakdown?.feeLocal || 0,
      fee_percentage: feeBreakdown?.feePercentage || 0,
      total_deducted_local: feeBreakdown?.totalLocalDeducted || amount,
    });

    // Pass fee breakdown to context for confirmation screen
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

  const isValidAmount = localAmount && parseFloat(localAmount) >= minWithdrawalLocal && !hasInsufficientBalance;

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

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col h-full overflow-hidden"
    >
      {isDesktop ? (
        <div className="w-full max-w-2xl mx-auto p-8">
          {/* Desktop Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/app")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Withdraw Funds</h1>
              <p className="text-sm text-gray-600 mt-1">
                Withdrawing in {currencyCode} to your linked account
              </p>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Enter Amount</h2>
              <p className="text-sm text-gray-600">How much do you want to withdraw?</p>
            </div>

            {/* Withdrawal Account Info */}
            {hasPaymentAccount && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💳 Linked Account:{" "}
                  {(() => {
                    const paymentAccount = user?.paymentAccount || user?.payment_account;
                    if (paymentAccount) {
                      try {
                        const account = JSON.parse(paymentAccount);
                        return `${account.institution} (${account.currency})`;
                      } catch {
                        return "Account configured";
                      }
                    }
                    return "";
                  })()}
                </p>
              </div>
            )}

            {/* Balance Display */}
            {!balanceLoading && localBalance > 0 && (
              <div className="bg-surface-subtle rounded-lg p-4">
                <div className="text-center">
                  <p className="text-text-subtle text-sm">Available Balance</p>
                  <p className="text-xl font-bold">
                    {currencySymbol} {localBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {balanceLoading && (
              <div className="bg-surface-subtle rounded-lg p-4">
                <div className="text-center">
                  <p className="text-text-subtle text-sm">Available Balance</p>
                  <p className="text-xl font-bold">Loading...</p>
                </div>
              </div>
            )}

            <div className="w-full max-w-sm mx-auto">
              {/* Amount input */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-lg font-medium mr-2">{currencySymbol}</span>
                  <input
                    type="number"
                    value={localAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="text-4xl font-bold bg-transparent border-none outline-none text-center w-full"
                    autoFocus
                    max={localBalance || undefined}
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
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

              {/* Fee Breakdown */}
              {feeBreakdown && parseFloat(localAmount) > 0 && (
                <div className="bg-surface-subtle rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
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
                        {currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-text-subtle">Your balance</span>
                      <span
                        className={
                          hasInsufficientBalance ? "text-red-500 font-medium" : "text-green-600"
                        }
                      >
                        {currencySymbol} {localBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Insufficient Balance Warning */}
              {hasInsufficientBalance && feeBreakdown && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ Insufficient balance. You need {currencySymbol}{" "}
                    {feeBreakdown.totalLocalDeducted.toLocaleString()} but only have{" "}
                    {currencySymbol} {localBalance.toLocaleString()}.
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Bottom Button */}
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
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-6 flex-shrink-0">
            <button onClick={() => navigate("/app")} className="p-2">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Withdraw Funds</h1>
            <div className="w-5 h-5" />
          </div>

          {/* Mobile Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-medium mb-2">Enter Amount</h2>
              <p className="text-text-subtle">How much do you want to withdraw?</p>
              <p className="text-xs text-text-subtle mt-2">
                Withdrawing in {currencyCode} to your linked account
              </p>
            </div>

            {/* Balance Display */}
            {!balanceLoading && localBalance > 0 && (
              <div className="bg-surface-subtle rounded-xl p-4 text-center">
                <p className="text-text-subtle text-sm">Available Balance</p>
                <p className="text-xl font-bold">
                  {currencySymbol} {localBalance.toLocaleString()}
                </p>
              </div>
            )}

            {balanceLoading && (
              <div className="bg-surface-subtle rounded-xl p-4 text-center">
                <p className="text-text-subtle text-sm">Available Balance</p>
                <p className="text-xl font-bold">Loading...</p>
              </div>
            )}

            {/* Amount input */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-lg font-medium mr-2">{currencySymbol}</span>
                <input
                  type="number"
                  value={localAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="text-4xl font-bold bg-transparent border-none outline-none text-center w-full"
                  max={localBalance || undefined}
                  inputMode="decimal"
                />
              </div>
              <p className="text-xs text-text-subtle">
                Minimum {currencySymbol} {minWithdrawalLocal.toLocaleString()} (0.3 USDC)
              </p>
            </div>

            {/* Quick Amount Buttons */}
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

            {/* Fee Breakdown */}
            {feeBreakdown && parseFloat(localAmount) > 0 && (
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
                      {currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-text-subtle">Your balance</span>
                    <span
                      className={
                        hasInsufficientBalance ? "text-red-500 font-medium" : "text-green-600"
                      }
                    >
                      {currencySymbol} {localBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance && feeBreakdown && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Insufficient balance. You need {currencySymbol}{" "}
                  {feeBreakdown.totalLocalDeducted.toLocaleString()} but only have {currencySymbol}{" "}
                  {localBalance.toLocaleString()}.
                </p>
              </div>
            )}
          </div>

          {/* Mobile Bottom Button */}
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
