import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { IoSwapHorizontalOutline } from "react-icons/io5";
import { toast } from "sonner";
import { usePay } from "../context";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";
import RiftLoader from "@/components/ui/rift-loader";
import { SOURCE_CONFIGS } from "@/features/withdraw/context";
import useAccountDeployed from "@/hooks/wallet/use-account-deployed";

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

export default function AmountInput() {
  const { paymentData, updatePaymentData, setCurrentStep } = usePay();
  const [localAmount, setLocalAmount] = useState("");
  const isDesktop = useDesktopDetection();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Get selected source config
  const selectedSource = paymentData.selectedSource;
  const sourceConfig = SOURCE_CONFIGS.find((s) => s.id === selectedSource);

  // Fetch fee preview from API
  const { data: feePreview, isLoading: feeLoading } = useOfframpFeePreview(currency, currency !== "USD");

  // Get user's balance
  const { data: balanceData } = useAggregateBalance({ currency });

  // Get balance for selected source only
  const sourceBalance = useMemo(() => {
    if (!balanceData?.breakdown || !sourceConfig) return 0;
    return (
      balanceData.breakdown.find(
        (b) => b.token === sourceConfig.token && b.chain === sourceConfig.chain
      )?.amount ?? 0
    );
  }, [balanceData?.breakdown, sourceConfig]);

  const exchangeRate = balanceData?.exchangeRate || 1;
  const sourceLocalBalance = sourceBalance * exchangeRate;

  // Get buying rate from fee preview
  const buyingRate = feePreview?.buying_rate || feePreview?.rate || (currency === "USD" ? 1 : null);
  const loadingRate = feeLoading && currency !== "USD";

  // Max payable local amount (accounting for fees)
  const maxPayableLocal = useMemo(() => {
    if (!feePreview || sourceBalance <= 0) return 0;
    const rate = feePreview.buying_rate || feePreview.rate;
    const feePercent = (feePreview.feeBps || 100) / 10000;
    return Math.floor((sourceBalance * rate) / (1 + feePercent));
  }, [feePreview, sourceBalance]);

  // Calculate fee breakdown when amount changes
  const feeBreakdown = useMemo(() => {
    const amount = parseFloat(localAmount);
    if (!feePreview || isNaN(amount) || amount <= 0 || currency === "USD") return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [localAmount, feePreview, currency]);

  // Check if user has enough balance on the selected source
  const hasInsufficientBalance = useMemo(() => {
    if (!feeBreakdown) {
      if (currency === "USD") {
        const amount = parseFloat(localAmount);
        return !isNaN(amount) && amount > sourceBalance;
      }
      return false;
    }
    return feeBreakdown.usdcNeeded > sourceBalance;
  }, [feeBreakdown, sourceBalance, localAmount, currency]);

  // The first transfer on any new chain has to cover one-time smart-account
  // deployment, so we enforce a $3 minimum only when the user's smart account
  // isn't yet deployed on the source chain. Once deployed, any non-zero amount
  // is allowed.
  const MIN_USD_TXN_FIRST_TIME = 3;
  const { isDeployed, chainLabel } = useAccountDeployed(sourceConfig?.chain);
  const requiresFirstTimeMin = isDeployed !== true;
  const minPaymentLocal = requiresFirstTimeMin
    ? buyingRate
      ? Math.ceil(MIN_USD_TXN_FIRST_TIME * buyingRate)
      : MIN_USD_TXN_FIRST_TIME
    : 0;

  const handleBack = () => setCurrentStep("source");

  const handleNext = () => {
    const amount = parseFloat(localAmount);

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (requiresFirstTimeMin && amount < minPaymentLocal) {
      toast.error(
        `Your first send from ${chainLabel || sourceConfig?.chainLabel || "this network"} needs at least $${MIN_USD_TXN_FIRST_TIME} (≈ ${currencySymbol} ${minPaymentLocal.toLocaleString()}). This sets up your wallet on that network — receiving funds doesn't count. After this first one, any amount works.`
      );
      return;
    }

    if (hasInsufficientBalance && feeBreakdown) {
      toast.error(
        `Insufficient balance on ${sourceConfig?.chainLabel || "selected chain"}. You need $${feeBreakdown.usdcNeeded.toFixed(2)} but only have $${sourceBalance.toFixed(2)}.`
      );
      return;
    }

    updatePaymentData({
      amount: amount,
      feeBreakdown: feeBreakdown || undefined,
    });
    setCurrentStep("recipient");
  };

  const enteredAmount = parseFloat(localAmount);
  const hasEntered = !!localAmount && !isNaN(enteredAmount) && enteredAmount > 0;
  const belowMin =
    hasEntered &&
    requiresFirstTimeMin &&
    enteredAmount < minPaymentLocal;

  const isValidAmount =
    hasEntered &&
    (!requiresFirstTimeMin || enteredAmount >= minPaymentLocal) &&
    !hasInsufficientBalance;

  const getPaymentTypeLabel = () => {
    if (paymentData.type === "MOBILE") return "Send Money";
    if (paymentData.type === "PAYBILL") return "Paybill Payment";
    if (paymentData.type === "BUY_GOODS") return "Buy Goods Payment";
    
    // For non-Kenya countries
    const countryNames: Record<string, string> = {
      KES: "Kenya",
      NGN: "Nigeria",
      UGX: "Uganda",
      TZS: "Tanzania",
      CDF: "DR Congo",
      MWK: "Malawi",
      BRL: "Brazil",
      USD: "International",
    };
    return `Send to ${countryNames[currency]}`;
  };

  // Dynamic quick amounts based on currency. When a first-time minimum is
  // enforced, surface it as the cheapest chip and drop any preset below it.
  // When no minimum is needed (account already deployed) we just show the
  // standard presets.
  const getQuickAmounts = () => {
    const presets: Record<string, number[]> = {
      KES: [100, 500, 1000, 2000, 5000],
      NGN: [1000, 5000, 10000, 50000, 100000],
      UGX: [5000, 10000, 50000, 100000, 500000],
      TZS: [5000, 10000, 50000, 100000, 500000],
      CDF: [5000, 10000, 50000, 100000, 500000],
      MWK: [1000, 5000, 10000, 50000, 100000],
      BRL: [20, 50, 100, 500, 1000],
      USD: [3, 5, 10, 20, 50, 100],
    };
    const list = presets[currency] || [100, 500, 1000, 2000, 5000];
    if (!requiresFirstTimeMin) return list.slice(0, 6);
    const min = minPaymentLocal;
    const above = list.filter((v) => v >= min);
    return Array.from(new Set([min, ...above])).slice(0, 6);
  };

  const content = (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`h-full overflow-y-auto overscroll-contain flex flex-col ${isDesktop ? "p-6 md:p-8" : "p-4 pb-8"}`}
    >
      {isDesktop ? (
        <div className="w-full max-w-3xl mx-auto">
          {/* Desktop Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-text-subtle hover:bg-white hover:text-text-default transition-colors cursor-pointer"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="px-3 py-1.5 rounded-full bg-white border border-surface text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle">
              Step 3 of 5
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div>
              <h1
                className="text-[32px] font-semibold text-text-default leading-[1.1] mb-2 tracking-[-0.02em]"
                style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
              >
                {getPaymentTypeLabel()}
              </h1>
              <p className="text-[15px] text-text-subtle/90 mb-6">
                Enter how much you want to send in {currency}.
              </p>

              {/* Selected source card */}
              {sourceConfig && (
                <div className="flex items-center gap-3 bg-white border border-surface rounded-2xl p-3 mb-5 shadow-sm">
                  <img src={sourceConfig.icon} alt="" className="w-9 h-9 rounded-full" />
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-text-default">
                      {sourceConfig.token} on {sourceConfig.chainLabel}
                    </p>
                    <p className="text-[12px] text-text-subtle/80 tabular-numeric">
                      ${sourceBalance.toFixed(2)} available
                      {currency !== "USD" &&
                        ` · ${currencySymbol} ${Math.floor(sourceLocalBalance).toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    onClick={handleBack}
                    className="text-[12px] font-semibold text-accent-primary hover:underline px-2 py-1"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Amount Input Field */}
              <div className="bg-white rounded-2xl border border-surface shadow-sm p-8 mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle/70 mb-3 text-center">
                  Sending in {currency}
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span
                    className="text-[28px] font-semibold text-accent-primary/70 tabular-numeric"
                    style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
                  >
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={localAmount}
                    onChange={(e) => setLocalAmount(e.target.value)}
                    placeholder="0"
                    className="text-[56px] font-semibold bg-transparent border-none outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-text-default placeholder:text-text-subtle/25 tabular-numeric tracking-[-0.02em]"
                    style={{
                      width: `${Math.max(2, (localAmount || "0").length + 0.5)}ch`,
                      fontFamily: '"Clash Display", "Satoshi", sans-serif',
                    }}
                    autoFocus
                  />
                </div>
                {buyingRate && currency !== "USD" && parseFloat(localAmount) > 0 && (
                  <div className="text-center mt-3 text-[12px] text-text-subtle tabular-numeric">
                    &asymp; ${(parseFloat(localAmount) / buyingRate).toFixed(2)} USD
                  </div>
                )}
                {buyingRate && currency !== "USD" && (
                  <div className="flex items-center justify-center gap-1 mt-4 text-[11px] text-text-subtle/70">
                    <IoSwapHorizontalOutline className="w-3 h-3" />
                    <span className="tabular-numeric">
                      1 USD = {buyingRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-6 gap-2 mb-5">
                {getQuickAmounts()
                  .filter((amount, index, arr) => arr.indexOf(amount) === index)
                  .sort((a, b) => a - b)
                  .slice(0, 6)
                  .map((amount) => {
                    const isActive = localAmount === amount.toString();
                    return (
                      <button
                        key={amount}
                        onClick={() => setLocalAmount(amount.toString())}
                        className={`h-10 rounded-xl text-[13px] font-semibold tabular-numeric transition-all cursor-pointer ${
                          isActive
                            ? "bg-accent-primary text-white shadow-sm"
                            : "bg-white border border-surface text-text-default hover:border-accent-primary/30"
                        }`}
                      >
                        {amount.toLocaleString()}
                      </button>
                    );
                  })}
              </div>

              {/* Fee Breakdown */}
              {feeBreakdown && parseFloat(localAmount) > 0 && (
                <div className="bg-white rounded-2xl border border-surface shadow-sm p-5 mb-5 space-y-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <FiInfo className="w-4 h-4 text-accent-primary" />
                    <span className="text-[13px] font-semibold text-text-default">Breakdown</span>
                  </div>

                  <div className="flex justify-between text-[14px]">
                    <span className="text-text-subtle">Recipient receives</span>
                    <span className="font-semibold text-text-default tabular-numeric">
                      {currencySymbol} {feeBreakdown.localAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-[14px]">
                    <span className="text-text-subtle">Fee ({feeBreakdown.feePercentage}%)</span>
                    <span className="font-semibold text-accent-primary tabular-numeric">
                      + {currencySymbol} {feeBreakdown.feeLocal.toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t border-surface pt-3 mt-1">
                    <div className="flex justify-between text-[14px]">
                      <span className="font-semibold text-text-default">Total deducted</span>
                      <span className="font-bold text-accent-primary text-[15px] tabular-numeric">
                        {currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {hasInsufficientBalance && feeBreakdown && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
                  <p className="text-[13px] text-red-700 leading-relaxed">
                    Insufficient balance. You need {currencySymbol}{" "}
                    {feeBreakdown.totalLocalDeducted.toLocaleString()} but only have{" "}
                    {currencySymbol} {sourceLocalBalance.toLocaleString()}.
                  </p>
                </div>
              )}

              {belowMin && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
                  <p className="text-[13px] text-amber-900 leading-relaxed">
                    <span className="font-semibold">Amount too low.</span> This
                    is your first time sending from{" "}
                    {chainLabel || sourceConfig?.chainLabel || "this network"},
                    so we need at least{" "}
                    <span className="font-semibold">
                      {currencySymbol} {minPaymentLocal.toLocaleString()}
                    </span>{" "}
                    (≈ ${MIN_USD_TXN_FIRST_TIME}) to set up your wallet on this
                    network. Receiving funds doesn't count — only outgoing
                    transfers. After this first one, any amount works.
                  </p>
                </div>
              )}

              {/* Desktop Next Button */}
              <div>
                <button
                  onClick={handleNext}
                  disabled={!isValidAmount || loadingRate}
                  className="w-full sm:w-auto min-w-[220px] inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-semibold bg-accent-primary text-white shadow-sm hover:bg-accent-primary/92 hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loadingRate ? (
                    <>
                      <RiftLoader size="sm" />
                      <span>Loading...</span>
                    </>
                  ) : hasInsufficientBalance ? (
                    "Insufficient Balance"
                  ) : belowMin ? (
                    `Below minimum (${currencySymbol} ${minPaymentLocal.toLocaleString()})`
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </div>

            {/* Summary sidebar */}
            <aside className="lg:sticky lg:top-0 space-y-4">
              <div className="bg-white rounded-2xl border border-surface/70 shadow-sm p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle/70 mb-3">
                  Quick amounts
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {getQuickAmounts()
                    .filter((amount, index, arr) => arr.indexOf(amount) === index)
                    .sort((a, b) => a - b)
                    .slice(0, 6)
                    .map((amount) => (
                      <button
                        key={`aside-${amount}`}
                        onClick={() => setLocalAmount(amount.toString())}
                        className="h-9 rounded-lg text-[12px] font-semibold tabular-numeric bg-surface/70 text-text-default hover:bg-accent-primary/10 hover:text-accent-primary transition-colors cursor-pointer"
                      >
                        {amount >= 1000 ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k` : amount}
                      </button>
                    ))}
                </div>
                {maxPayableLocal > 0 && (
                  <button
                    onClick={() => setLocalAmount(maxPayableLocal.toString())}
                    className="w-full mt-3 py-2 rounded-lg text-[12px] font-semibold text-accent-primary hover:bg-accent-primary/5 transition-colors cursor-pointer tabular-numeric"
                  >
                    Max: {currencySymbol} {maxPayableLocal.toLocaleString()}
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <FiArrowLeft className="w-5 h-5 text-text-default" />
            </button>
            <h1
              className="text-[17px] font-semibold text-text-default tracking-[-0.015em]"
              style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
            >
              {getPaymentTypeLabel()}
            </h1>
            <div className="w-9 h-9" />
          </div>

          {/* Mobile Source Card */}
          {sourceConfig && (
            <div className="flex items-center gap-3 bg-white border border-surface/70 rounded-2xl p-3 mb-4 shadow-sm">
              <img src={sourceConfig.icon} alt="" className="w-9 h-9 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-default truncate">
                  {sourceConfig.token} on {sourceConfig.chainLabel}
                </p>
                <p className="text-[11px] text-text-subtle/80 tabular-numeric">
                  ${sourceBalance.toFixed(2)} available
                  {currency !== "USD" &&
                    ` · ${currencySymbol} ${Math.floor(sourceLocalBalance).toLocaleString()}`}
                </p>
              </div>
              <button
                onClick={handleBack}
                className="text-[12px] font-semibold text-accent-primary hover:underline px-2 py-1"
              >
                Change
              </button>
            </div>
          )}

          {/* Mobile Amount Input */}
          <div className="w-full">
            <div className="text-center mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle/70 mb-2">
                Sending in {currency}
              </div>
              <div className="flex items-baseline justify-center gap-1.5 mb-2">
                <span
                  className="text-[22px] font-semibold text-accent-primary/70 tabular-numeric"
                  style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={localAmount}
                  onChange={(e) => setLocalAmount(e.target.value)}
                  placeholder="0"
                  className="text-[48px] font-semibold bg-transparent border-none outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-text-default placeholder:text-text-subtle/25 tabular-numeric tracking-[-0.02em]"
                  style={{
                    width: `${Math.max(2, (localAmount || "0").length + 0.5)}ch`,
                    fontFamily: '"Clash Display", "Satoshi", sans-serif',
                  }}
                  autoFocus
                />
              </div>
              {buyingRate && currency !== "USD" && parseFloat(localAmount) > 0 && (
                <div className="text-[12px] text-text-subtle tabular-numeric">
                  &asymp; ${(parseFloat(localAmount) / buyingRate).toFixed(2)} USD
                </div>
              )}
              {maxPayableLocal > 0 && (
                <button
                  onClick={() => setLocalAmount(maxPayableLocal.toString())}
                  className="mt-2 text-[12px] font-semibold text-accent-primary hover:underline tabular-numeric"
                >
                  Use max &middot; {currencySymbol} {maxPayableLocal.toLocaleString()}
                </button>
              )}
            </div>

            {/* Mobile Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {getQuickAmounts()
                .filter((amount, index, arr) => arr.indexOf(amount) === index)
                .sort((a, b) => a - b)
                .slice(0, 6)
                .map((amount) => {
                  const isActive = localAmount === amount.toString();
                  return (
                    <button
                      key={amount}
                      onClick={() => setLocalAmount(amount.toString())}
                      className={`h-10 rounded-xl text-[13px] font-semibold tabular-numeric transition-all cursor-pointer ${
                        isActive
                          ? "bg-accent-primary text-white shadow-sm"
                          : "bg-white border border-surface text-text-default hover:border-accent-primary/30"
                      }`}
                    >
                      {amount.toLocaleString()}
                    </button>
                  );
                })}
            </div>

            {/* Mobile Fee Breakdown */}
            {feeBreakdown && parseFloat(localAmount) > 0 && (
              <div className="bg-white border border-surface/70 shadow-sm rounded-2xl p-4 mb-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <FiInfo className="w-4 h-4 text-accent-primary" />
                  <span className="text-[13px] font-semibold text-text-default">Breakdown</span>
                </div>

                <div className="flex justify-between text-[13px]">
                  <span className="text-text-subtle">Recipient gets</span>
                  <span className="font-semibold text-text-default tabular-numeric">
                    {currencySymbol} {feeBreakdown.localAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-[13px]">
                  <span className="text-text-subtle">Fee ({feeBreakdown.feePercentage}%)</span>
                  <span className="font-semibold text-accent-primary tabular-numeric">
                    + {currencySymbol} {feeBreakdown.feeLocal.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-surface pt-2 mt-1 flex justify-between text-[13px]">
                  <span className="font-semibold text-text-default">Total</span>
                  <span className="font-bold text-accent-primary tabular-numeric">
                    {currencySymbol} {feeBreakdown.totalLocalDeducted.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {hasInsufficientBalance && feeBreakdown && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4">
                <p className="text-[12px] text-red-700 leading-relaxed">
                  Insufficient balance. You need {currencySymbol}{" "}
                  {feeBreakdown.totalLocalDeducted.toLocaleString()} but only have{" "}
                  {currencySymbol} {sourceLocalBalance.toLocaleString()}.
                </p>
              </div>
            )}

            {belowMin && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
                <p className="text-[12px] text-amber-900 leading-relaxed">
                  <span className="font-semibold">Amount too low.</span> First
                  send from {chainLabel || sourceConfig?.chainLabel || "this network"} needs at
                  least <span className="font-semibold">{currencySymbol}{" "}
                  {minPaymentLocal.toLocaleString()}</span> (≈ ${MIN_USD_TXN_FIRST_TIME})
                  to set up your wallet here. Receiving doesn't count. After
                  this, any amount works.
                </p>
              </div>
            )}
          </div>

          {/* Mobile Next Button */}
          <div className="mt-auto pt-5">
            <button
              onClick={handleNext}
              disabled={!isValidAmount || loadingRate}
              className="w-full inline-flex items-center justify-center gap-2 h-12 px-4 rounded-2xl font-semibold bg-accent-primary text-white shadow-sm hover:bg-accent-primary/92 active:scale-[0.985] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loadingRate ? (
                <>
                  <RiftLoader size="sm" />
                  <span>Loading...</span>
                </>
              ) : hasInsufficientBalance ? (
                "Insufficient Balance"
              ) : belowMin ? (
                `Below minimum (${currencySymbol} ${minPaymentLocal.toLocaleString()})`
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="lg" className="h-full" noScroll>
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}
