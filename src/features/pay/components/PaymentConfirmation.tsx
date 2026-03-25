import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import usePayment from "@/hooks/data/use-payment";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";
import { SOURCE_CONFIGS } from "@/features/withdraw/context";
import TransactionVerification from "@/components/ui/transaction-verification";
import { addPendingWithdrawal } from "@/lib/pending-withdrawal";

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

export default function PaymentConfirmation() {
  const navigate = useNavigate();
  const { paymentData, setCurrentStep, resetPayment } = usePay();
  const [showVerification, setShowVerification] = useState(false);
  const paymentMutation = usePayment();
  const isDesktop = useDesktopDetection();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Source is already selected from the source step
  const selectedSource = paymentData.selectedSource!;
  const sourceConfig = SOURCE_CONFIGS.find((s) => s.id === selectedSource)!;

  const { data: balanceData, isLoading: balanceLoading } = useAggregateBalance({ currency });
  const { data: feePreview, isLoading: feeLoading, error: feeError } = useOfframpFeePreview(currency);

  const feeBreakdown = useMemo(() => {
    if (paymentData.feeBreakdown) return paymentData.feeBreakdown;
    const amount = paymentData.amount || 0;
    if (!feePreview || amount <= 0) return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [paymentData.feeBreakdown, paymentData.amount, feePreview]);

  const exchangeRate = feeBreakdown?.exchangeRate || balanceData?.exchangeRate || null;
  const isLoading = balanceLoading || feeLoading;

  const fallbackFeeBreakdown = useMemo(() => {
    if (feeBreakdown) return null;
    if (!balanceData?.exchangeRate || !paymentData.amount) return null;
    const amount = paymentData.amount;
    const feePercentage = 1;
    const feeLocal = Math.ceil(amount * (feePercentage / 100));
    const totalLocalDeducted = amount + feeLocal;
    const usdcAmount = Math.ceil((amount / balanceData.exchangeRate) * 1e6) / 1e6;
    const usdcNeeded = Math.ceil((totalLocalDeducted / balanceData.exchangeRate) * 1e6) / 1e6;
    return { localAmount: amount, feeLocal, totalLocalDeducted, usdcAmount, usdcNeeded, exchangeRate: balanceData.exchangeRate, feePercentage, feeBps: 100 };
  }, [feeBreakdown, balanceData?.exchangeRate, paymentData.amount]);

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

  const handleBack = () => setCurrentStep("recipient");

  const handlePayClick = () => {
    setShowVerification(true);
  };

  const executePayment = async (verification: { otpCode?: string; password?: string }) => {
    setShowVerification(false);

    if (!paymentData.amount || !paymentData.recipient) {
      toast.error("Missing payment information");
      return;
    }

    if (!sourceConfig) {
      toast.error("No payment source selected");
      return;
    }

    const localAmount = paymentData.amount;
    const feeData = displayFeeBreakdown;
    const usdAmountToSend = feeData?.usdcAmount || (currency === "USD"
      ? localAmount
      : exchangeRate
        ? Math.round((localAmount / exchangeRate) * 1e6) / 1e6
        : localAmount);

    const recipientString = JSON.stringify(paymentData.recipient);

    const lockError = checkAndSetTransactionLock("pay", usdAmountToSend, recipientString, currency);
    if (lockError) {
      toast.error(lockError);
      return;
    }

    try {
      const paymentRequest = {
        token: sourceConfig.token as any,
        amount: usdAmountToSend,
        currency: currency as any,
        chain: sourceConfig.sdkChain as any,
        recipient: recipientString,
        ...verification,
      };

      await paymentMutation.mutateAsync(paymentRequest as any);

      addPendingWithdrawal({
        amount: localAmount,
        currency: currency,
      });

      resetPayment();
      navigate("/app", { replace: true });
    } catch (error: any) {
      const isKYC = error.error === "KYC verification required" || error.message?.toLowerCase().includes("kyc");
      toast.error(
        isKYC
          ? "You've reached the transaction limit. Verify your identity to continue."
          : (error.message || "Failed to process payment. Please try again."),
        isKYC ? { action: { label: "Verify now", onClick: () => navigate("/kyc") } } : undefined
      );
    }
  };

  const getPaymentTypeLabel = () => {
    if (currency === "KES") {
      switch (paymentData.type) {
        case "MOBILE": return "Send Money";
        case "BANK": return "Bank Transfer";
        case "PAYBILL": return "Paybill Payment";
        case "BUY_GOODS": return "Buy Goods Payment";
        default: return "Payment";
      }
    }
    const countryNames: Record<string, string> = {
      KES: "Kenya", NGN: "Nigeria", UGX: "Uganda", TZS: "Tanzania", CDF: "DR Congo", MWK: "Malawi", BRL: "Brazil", USD: "International",
    };
    return `Send to ${countryNames[currency]}`;
  };

  const getRecipientDisplay = () => {
    if (!paymentData.recipient) return "";
    const { accountIdentifier, accountNumber, accountName, type } = paymentData.recipient;
    if (currency === "KES" && type === "PAYBILL") {
      return `${accountIdentifier} - ${accountNumber}${accountName ? ` (${accountName})` : ""}`;
    }
    return `${accountIdentifier}${accountName ? ` (${accountName})` : ""}`;
  };

  const localAmount = paymentData.amount || 0;

  // Fee card
  const feeCard = displayFeeBreakdown && (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <FiInfo className="w-5 h-5 text-amber-600" />
        <span className="font-semibold text-amber-700 dark:text-amber-400">Transaction Fee</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-subtle">Recipient receives</span>
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
  const sourceCard = sourceConfig && (
    <div className="flex items-center gap-3 bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-3">
      <img src={sourceConfig.icon} alt="" className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <p className="text-sm font-semibold">Paying from</p>
        <p className="text-xs text-text-subtle">
          {sourceConfig.token} on {sourceConfig.chainLabel} — ${sourceBalance.toFixed(2)} available
        </p>
      </div>
    </div>
  );

  const detailsCard = (
    <div className="bg-surface-subtle rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-text-subtle">Payment Type</span>
        <span className="font-medium">{getPaymentTypeLabel()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-subtle">Recipient Gets</span>
        <span className="font-bold text-lg">{currencySymbol} {localAmount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-start pt-2 border-t border-surface">
        <span className="text-text-subtle">To</span>
        <div className="text-right max-w-[60%]">
          <div className="font-medium text-sm break-words">{getRecipientDisplay()}</div>
          <div className="text-xs text-text-subtle">via {paymentData.recipient?.institution}</div>
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
              <h1 className="text-2xl font-semibold text-gray-900">Confirm Payment</h1>
              <p className="text-sm text-gray-600 mt-1">Review and confirm your payment details</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            {sourceCard}
            {feeCard}
            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-sm text-gray-600">Loading fee information...</p></div>
            )}
            {detailsCard}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please verify the recipient details carefully. Payments cannot be reversed once processed.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={handlePayClick}
                disabled={isLoading || paymentMutation.isPending}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(paymentMutation.isPending || isLoading) ? (<><CgSpinner className="w-4 h-4 animate-spin" /><span>Processing...</span></>) : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 pt-4 pb-6 flex-shrink-0">
            <button onClick={handleBack} className="p-2"><FiArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-semibold">Confirm Payment</h1>
            <div className="w-5 h-5" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
            {sourceCard}
            {feeCard && <div>{feeCard}</div>}
            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-surface-subtle rounded-lg p-4 text-center"><p className="text-sm text-text-subtle">Loading fee information...</p></div>
            )}
            {detailsCard}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please verify the recipient details carefully. Payments cannot be reversed once processed.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-gradient-to-t from-app-background via-app-background/90 to-transparent">
            <button
              onClick={handlePayClick}
              disabled={isLoading || paymentMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(paymentMutation.isPending || isLoading) ? (<><CgSpinner className="w-4 h-4 animate-spin" /><span>Processing...</span></>) : "Confirm & Send"}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {isDesktop ? <DesktopPageLayout maxWidth="lg" className="h-full">{content}</DesktopPageLayout> : content}
      <TransactionVerification
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        onVerified={executePayment}
        title="Verify Payment"
      />
    </div>
  );
}
