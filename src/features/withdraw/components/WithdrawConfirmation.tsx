import { useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useWithdraw, SOURCE_CONFIGS } from "../context";
import useUser from "@/hooks/data/use-user";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCreateWithdrawalOrder from "@/hooks/data/use-create-withdrawal-order";
import useAnalytics from "@/hooks/use-analytics";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

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

export default function WithdrawConfirmation() {
  const navigate = useNavigate();
  const { withdrawData, setCurrentStep, setCreatedOrder } = useWithdraw();
  const { data: user } = useUser();
  const { logEvent, updatePersonProperties } = useAnalytics();
  const isDesktop = useDesktopDetection();

  const withdrawCurrency = (withdrawData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[withdrawCurrency];

  // Source is already selected from the source step
  const selectedSource = withdrawData.selectedSource!;
  const sourceConfig = SOURCE_CONFIGS.find((s) => s.id === selectedSource)!;

  const { data: balanceData, isLoading: balanceLoading } = useAggregateBalance({
    currency: withdrawCurrency,
  });
  const createOrderMutation = useCreateWithdrawalOrder();

  const { data: feePreview, isLoading: feeLoading } = useOfframpFeePreview(withdrawCurrency);

  const feeBreakdown = useMemo(() => {
    if (withdrawData.feeBreakdown) return withdrawData.feeBreakdown;
    const amount = withdrawData.amount || 0;
    if (!feePreview || amount <= 0) return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [withdrawData.feeBreakdown, withdrawData.amount, feePreview]);

  const fallbackFeeBreakdown = useMemo(() => {
    if (feeBreakdown) return null;
    if (!balanceData?.exchangeRate || !withdrawData.amount) return null;
    const amount = withdrawData.amount;
    const feePercentage = 1;
    const feeLocal = Math.ceil(amount * (feePercentage / 100));
    const totalLocalDeducted = amount + feeLocal;
    const usdcAmount = Math.ceil((amount / balanceData.exchangeRate) * 1e6) / 1e6;
    const usdcNeeded = Math.ceil((totalLocalDeducted / balanceData.exchangeRate) * 1e6) / 1e6;
    return { localAmount: amount, feeLocal, totalLocalDeducted, usdcAmount, usdcNeeded, exchangeRate: balanceData.exchangeRate, feePercentage, feeBps: 100 };
  }, [feeBreakdown, balanceData?.exchangeRate, withdrawData.amount]);

  const displayFeeBreakdown = feeBreakdown || fallbackFeeBreakdown;

  // Get source balance
  const sourceBalance = useMemo(() => {
    if (!balanceData?.breakdown || !sourceConfig) return 0;
    return (
      balanceData.breakdown.find(
        (b) => b.token === sourceConfig.token && b.chain === sourceConfig.chain
      )?.amount ?? 0
    );
  }, [balanceData?.breakdown, sourceConfig]);

  const handleBack = () => setCurrentStep("amount");

  const executeWithdrawal = async () => {
    if (!balanceData?.exchangeRate || !withdrawData.amount) {
      toast.error("Missing withdrawal information");
      return;
    }

    const localAmount = withdrawData.amount;
    const feeData = displayFeeBreakdown;
    const paymentAccount = user?.paymentAccount || user?.payment_account;
    if (!paymentAccount) {
      toast.error("No withdrawal account configured");
      return;
    }

    const usdAmountToSend = feeData?.usdcAmount || Math.round((localAmount / balanceData.exchangeRate) * 1e6) / 1e6;
    const lockError = checkAndSetTransactionLock("withdraw", usdAmountToSend, paymentAccount, withdrawCurrency);
    if (lockError) {
      toast.error(lockError);
      return;
    }

    try {
      const response = await createOrderMutation.mutateAsync({
        token: sourceConfig.token as any,
        amount: usdAmountToSend,
        currency: withdrawCurrency as any,
        chain: sourceConfig.sdkChain as any,
        recipient: paymentAccount,
      });

      logEvent("WITHDRAW_COMPLETED", {
        amount_usd: usdAmountToSend,
        amount_local: localAmount,
        currency: withdrawCurrency,
        exchange_rate: balanceData.exchangeRate,
        fee_local: feeData?.feeLocal || 0,
        fee_percentage: feeData?.feePercentage || 0,
        source: selectedSource,
        chain: sourceConfig.sdkChain,
        token: sourceConfig.token,
      });

      updatePersonProperties({ has_withdrawn: true });
      setCreatedOrder(response.order);
      setCurrentStep("success");
      toast.success("Withdrawal order created successfully!");
    } catch (error: any) {
      logEvent("WITHDRAW_FAILED", {
        amount_usd: usdAmountToSend,
        amount_local: localAmount,
        currency: withdrawCurrency,
        error: error.message || "Unknown error",
        source: selectedSource,
      });

      const isKYC = error.error === "KYC verification required" || error.message?.toLowerCase().includes("kyc");
      toast.error(
        isKYC
          ? "You've reached the transaction limit. Verify your identity to continue."
          : (error.message || "Failed to create withdrawal order. Please try again."),
        isKYC ? { action: { label: "Verify now", onClick: () => navigate("/kyc") } } : undefined
      );
    }
  };

  const getPaymentAccountDisplay = () => {
    const paymentAccount = user?.paymentAccount || user?.payment_account;
    if (!paymentAccount) return "Not configured";
    try {
      const account = JSON.parse(paymentAccount);
      return `${account.institution}${account.type ? ` (${account.type})` : ''}: ${account.accountIdentifier}${
        account.accountNumber ? ` - ${account.accountNumber}` : ""
      }${account.accountName ? ` - ${account.accountName}` : ""}`;
    } catch {
      return "Account configured";
    }
  };

  const localAmount = withdrawData.amount || 0;
  const isLoading = balanceLoading || feeLoading;

  // Fee card
  const feeCard = displayFeeBreakdown && (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <FiInfo className="w-5 h-5 text-amber-600" />
        <span className="font-semibold text-amber-700 dark:text-amber-400">Transaction Fee</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-subtle">You receive</span>
          <span className="font-medium">{currencySymbol} {displayFeeBreakdown.localAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-subtle">Service fee ({displayFeeBreakdown.feePercentage}%)</span>
          <span className="font-semibold text-amber-600">+ {currencySymbol} {displayFeeBreakdown.feeLocal.toLocaleString()}</span>
        </div>
        <div className="border-t border-amber-500/30 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="font-medium">Total deducted</span>
            <span className="font-bold text-lg">{currencySymbol} {displayFeeBreakdown.totalLocalDeducted.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Source info card
  const sourceCard = (
    <div className="flex items-center gap-3 bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-3">
      <img src={sourceConfig.icon} alt="" className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <p className="text-sm font-semibold">Withdrawing from</p>
        <p className="text-xs text-text-subtle">
          {sourceConfig.token} on {sourceConfig.chainLabel} — ${sourceBalance.toFixed(2)} available
        </p>
      </div>
    </div>
  );

  const detailsCard = (
    <div className="bg-surface-subtle rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-text-subtle">You Receive</span>
        <span className="font-bold text-lg">{currencySymbol} {localAmount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-start pt-2 border-t border-surface">
        <span className="text-text-subtle">Withdrawal Account</span>
        <div className="text-right max-w-[60%]">
          <div className="font-medium text-sm break-words">{getPaymentAccountDisplay()}</div>
        </div>
      </div>
    </div>
  );

  const content = (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`flex flex-col h-full overflow-hidden ${isDesktop ? "p-8" : ""}`}
    >
      {isDesktop ? (
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Confirm Withdrawal</h1>
              <p className="text-sm text-gray-600 mt-1">Review and confirm your withdrawal details</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            {sourceCard}
            {feeCard}
            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-sm text-gray-600">Loading fee information...</p></div>
            )}
            {detailsCard}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">Withdrawal will be processed to your configured withdrawal account ({withdrawCurrency}). Processing may take a few minutes.</p>
            </div>
            <div className="pt-4">
              <button
                onClick={executeWithdrawal}
                disabled={isLoading || createOrderMutation.isPending}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createOrderMutation.isPending || isLoading) ? (<><CgSpinner className="w-4 h-4 animate-spin" /><span>Processing...</span></>) : "Confirm Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 pt-4 pb-6 flex-shrink-0">
            <button onClick={handleBack} className="p-2"><FiArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-semibold">Confirm Withdrawal</h1>
            <div className="w-5 h-5" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
            {sourceCard}
            {feeCard && <div>{feeCard}</div>}
            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-surface-subtle rounded-lg p-4 text-center"><p className="text-sm text-text-subtle">Loading fee information...</p></div>
            )}
            {detailsCard}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">Withdrawal will be processed to your configured withdrawal account ({withdrawCurrency}). Processing may take a few minutes.</p>
            </div>
          </div>
          <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-gradient-to-t from-app-background via-app-background/90 to-transparent">
            <button
              onClick={executeWithdrawal}
              disabled={isLoading || createOrderMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createOrderMutation.isPending || isLoading) ? (<><CgSpinner className="w-4 h-4 animate-spin" /><span>Processing...</span></>) : "Confirm Withdrawal"}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {isDesktop ? <DesktopPageLayout maxWidth="lg" className="h-full">{content}</DesktopPageLayout> : content}
    </div>
  );
}
