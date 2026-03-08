import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiCheck, FiInfo } from "react-icons/fi";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

type OfframpSource = "base-usdc" | "celo-usdt";

export default function PaymentConfirmation() {
  const navigate = useNavigate();
  const { paymentData, setCurrentStep, resetPayment } = usePay();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const paymentMutation = usePayment();
  const isDesktop = useDesktopDetection();

  // Source selection state
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<OfframpSource | null>(null);

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const { data: balanceData, isLoading: balanceLoading } = useAggregateBalance({ currency });
  const localBalance = balanceData?.localAmount || 0;
  const usdcBalance = balanceData?.totalUsd || 0;

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

  // Get specific balances from breakdown
  const baseUsdcBalance = balanceData?.breakdown.find(b => b.token === "USDC" && b.chain === "BASE")?.amount ?? 0;
  const celoUsdtBalance = balanceData?.breakdown.find(b => b.token === "USDT" && b.chain === "CELO")?.amount ?? 0;
  const usdcNeeded = displayFeeBreakdown?.usdcNeeded ?? 0;

  const ROUNDING_TOLERANCE = 0.01;
  const baseUsdcSufficient = baseUsdcBalance >= usdcNeeded - ROUNDING_TOLERANCE;
  const celoUsdtSufficient = celoUsdtBalance >= usdcNeeded - ROUNDING_TOLERANCE;
  const totalAvailable = balanceData?.totalUsd ?? 0;
  const hasInsufficientBalance = usdcNeeded > 0 && !baseUsdcSufficient && !celoUsdtSufficient;

  // Find best chain to convert from
  const bestConvertSource = useMemo(() => {
    if (!balanceData?.breakdown) return null;
    const otherUsdcBalances = balanceData.breakdown
      .filter(b => b.token === "USDC" && b.chain !== "BASE" && b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    if (otherUsdcBalances.length > 0) return otherUsdcBalances[0];
    const otherUsdtBalances = balanceData.breakdown
      .filter(b => b.token === "USDT" && b.chain !== "CELO" && b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    if (otherUsdtBalances.length > 0) return otherUsdtBalances[0];
    return null;
  }, [balanceData?.breakdown]);

  const executePayment = async (source: OfframpSource) => {
    if (!paymentData.amount || !paymentData.recipient) {
      toast.error("Missing payment information");
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
      const token = source === "base-usdc" ? "USDC" : "USDT";
      const chain = source === "base-usdc" ? "base" : "celo";

      const paymentRequest = {
        token: token as any,
        amount: usdAmountToSend,
        currency: currency as any,
        chain: chain as any,
        recipient: recipientString,
      };

      await paymentMutation.mutateAsync(paymentRequest);

      setPaymentSuccess(true);
      toast.success("Payment initiated successfully!");

      setTimeout(() => {
        resetPayment();
        navigate("/app");
      }, 3000);
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

  const handleConfirmPayment = async () => {
    if (!paymentData.amount || !paymentData.recipient) {
      toast.error("Missing payment information");
      return;
    }

    if (selectedSource) {
      await executePayment(selectedSource);
      return;
    }

    if (baseUsdcSufficient && celoUsdtSufficient) {
      setShowSourcePicker(true);
      return;
    }

    if (baseUsdcSufficient) {
      await executePayment("base-usdc");
      return;
    }

    if (celoUsdtSufficient) {
      await executePayment("celo-usdt");
      return;
    }

    if (totalAvailable >= usdcNeeded) {
      setShowConvertModal(true);
      return;
    }

    toast.error(`Insufficient balance. You need $${usdcNeeded.toFixed(2)} but only have $${totalAvailable.toFixed(2)} across all chains.`);
  };

  const handleSourceSelect = async (source: OfframpSource) => {
    setSelectedSource(source);
    setShowSourcePicker(false);
    await executePayment(source);
  };

  const handleGoToConvert = () => {
    const shortfall = usdcNeeded - baseUsdcBalance;
    const convertAmount = Math.ceil(shortfall * 100) / 100;
    const sourceChain = bestConvertSource?.chain || "ETHEREUM";
    const token = bestConvertSource?.token || "USDC";
    navigate(`/app/convert?sourceChain=${sourceChain}&destChain=BASE&token=${token}&amount=${convertAmount}`);
  };

  const handleBack = () => {
    navigate("/app");
  };

  const getPaymentTypeLabel = () => {
    if (currency === "KES") {
      switch (paymentData.type) {
        case "MOBILE": return "Send Money";
        case "PAYBILL": return "Paybill Payment";
        case "BUY_GOODS": return "Buy Goods Payment";
        default: return "Payment";
      }
    }
    const countryNames: Record<SupportedCurrency, string> = {
      KES: "Kenya", ETB: "Ethiopia", UGX: "Uganda", GHS: "Ghana", NGN: "Nigeria", USD: "International",
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

  // Source picker drawer
  const sourcePickerDrawer = (
    <Drawer open={showSourcePicker} onClose={() => setShowSourcePicker(false)} onOpenChange={(o) => !o && setShowSourcePicker(false)}>
      <DrawerContent className="bg-surface">
        <DrawerHeader className="p-4">
          <DrawerTitle>Choose wallet</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-2">
          <p className="text-sm text-text-subtle mb-3">Which wallet would you like to pay from?</p>
          <button
            onClick={() => handleSourceSelect("base-usdc")}
            className="flex items-center justify-between w-full p-4 rounded-xl bg-surface-subtle hover:bg-surface-subtle/80 border border-border transition-colors"
          >
            <div className="flex items-center gap-3">
              <img src="https://coin-images.coingecko.com/coins/images/6319/small/usdc.png" alt="" className="w-8 h-8 rounded-full" />
              <div className="text-left">
                <p className="text-sm font-semibold text-text-default">USDC</p>
                <p className="text-xs text-text-subtle">${baseUsdcBalance.toFixed(2)} available</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleSourceSelect("celo-usdt")}
            className="flex items-center justify-between w-full p-4 rounded-xl bg-surface-subtle hover:bg-surface-subtle/80 border border-border transition-colors"
          >
            <div className="flex items-center gap-3">
              <img src="https://coin-images.coingecko.com/coins/images/325/small/Tether.png" alt="" className="w-8 h-8 rounded-full" />
              <div className="text-left">
                <p className="text-sm font-semibold text-text-default">USDT</p>
                <p className="text-xs text-text-subtle">${celoUsdtBalance.toFixed(2)} available</p>
              </div>
            </div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );

  // Convert-first drawer
  const convertModalDrawer = (
    <Drawer open={showConvertModal} onClose={() => setShowConvertModal(false)} onOpenChange={(o) => !o && setShowConvertModal(false)}>
      <DrawerContent className="bg-surface">
        <DrawerHeader className="p-4">
          <DrawerTitle>Not enough in one wallet</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4">
          <p className="text-sm text-text-subtle">
            Your USDC and USDT are spread across different networks. Move them into one wallet to continue.
          </p>
          <div className="bg-surface-subtle rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-subtle">You need</span>
              <span className="font-semibold">${usdcNeeded.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-subtle">USDC balance</span>
              <span className="font-medium">${baseUsdcBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-subtle">USDT balance</span>
              <span className="font-medium">${celoUsdtBalance.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleGoToConvert}
            className="w-full py-3 px-4 rounded-2xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors"
          >
            Move funds to USDC
          </button>
          <button
            onClick={() => setShowConvertModal(false)}
            className="w-full py-2.5 px-4 rounded-2xl font-medium text-text-subtle hover:bg-surface-subtle transition-colors"
          >
            Cancel
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );

  if (paymentSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col h-full p-4 items-center justify-center"
      >
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <FiCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Payment Initiated!</h2>
        <p className="text-text-subtle text-center mb-4">
          Your payment is being processed. You'll receive a confirmation shortly.
        </p>
        <div className="bg-surface-subtle rounded-lg p-4 w-full max-w-sm">
          <div className="text-center">
            <p className="text-sm text-text-subtle">Amount Sent</p>
            <p className="text-xl font-bold">
              {currencySymbol} {(paymentData.amount || 0).toLocaleString()} ({currency})
            </p>
            <p className="text-sm text-text-subtle mt-1">
              To: {getRecipientDisplay()}
            </p>
          </div>
        </div>
        <p className="text-sm text-text-subtle mt-6 text-center">Redirecting to home...</p>
      </motion.div>
    );
  }

  const content = (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`flex flex-col h-full ${isDesktop ? "p-8" : "p-4"}`}
    >
      {isDesktop ? (
        <div className="w-full max-w-2xl mx-auto">
          {/* Desktop Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Confirm Payment</h1>
              <p className="text-sm text-gray-600 mt-1">Review and confirm your payment details</p>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            {/* Fee Breakdown */}
            {displayFeeBreakdown && (
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
            )}

            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">Loading fee information...</p>
              </div>
            )}

            {feeError && !displayFeeBreakdown && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Could not load fee information. A 1% service fee will apply.
                </p>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-subtle">Payment Type</span>
                  <span className="font-medium">{getPaymentTypeLabel()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-subtle">Recipient Gets</span>
                  <span className="font-bold text-lg">
                    {currencySymbol} {(paymentData.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-start pt-2 border-t border-gray-200">
                  <span className="text-text-subtle">
                    {currency === "KES" && paymentData.type === "MOBILE" && "To"}
                    {currency === "KES" && paymentData.type === "PAYBILL" && "Paybill"}
                    {currency === "KES" && paymentData.type === "BUY_GOODS" && "Till"}
                    {currency !== "KES" && "To"}
                  </span>
                  <div className="text-right max-w-[60%]">
                    <div className="font-medium break-words">{getRecipientDisplay()}</div>
                    <div className="text-sm text-text-subtle">via {paymentData.recipient?.institution}</div>
                  </div>
                </div>

                {/* Source balances */}
                {balanceData && (
                  <>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-text-subtle text-sm">Base USDC</span>
                      <span className={`text-sm font-medium ${baseUsdcSufficient ? 'text-green-600' : 'text-text-subtle'}`}>
                        ${baseUsdcBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-subtle text-sm">Celo USDT</span>
                      <span className={`text-sm font-medium ${celoUsdtSufficient ? 'text-green-600' : 'text-text-subtle'}`}>
                        ${celoUsdtBalance.toFixed(2)}
                      </span>
                    </div>
                    {selectedSource && (
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-text-subtle text-sm">Paying from</span>
                        <span className="text-sm font-semibold text-accent-primary">
                          {selectedSource === "base-usdc" ? "USDC on Base" : "USDT on Celo"}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Convert needed warning */}
            {hasInsufficientBalance && totalAvailable >= usdcNeeded && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your funds are spread across different networks. Tap below to move them into one wallet so you can pay.
                </p>
              </div>
            )}

            {/* Truly insufficient */}
            {hasInsufficientBalance && totalAvailable < usdcNeeded && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Insufficient balance. You need {currencySymbol} {displayFeeBreakdown?.totalLocalDeducted.toLocaleString()}{" "}
                  but only have {currencySymbol} {localBalance.toLocaleString()} available.
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please verify the recipient details carefully. Payments cannot be reversed once processed.
              </p>
            </div>

            {/* Desktop Button */}
            <div className="pt-4">
              <button
                onClick={handleConfirmPayment}
                disabled={isLoading || (hasInsufficientBalance && totalAvailable < usdcNeeded) || paymentMutation.isPending}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(paymentMutation.isPending || isLoading) ? (
                  <>
                    <CgSpinner className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : hasInsufficientBalance && totalAvailable < usdcNeeded ? (
                  "Insufficient Balance"
                ) : hasInsufficientBalance ? (
                  "Move Funds First"
                ) : (
                  "Confirm & Send"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={handleBack} className="p-2">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Confirm Payment</h1>
            <div className="w-5 h-5" />
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-medium mb-2">Review Details</h2>
              <p className="text-text-subtle">Please confirm your payment details</p>
            </div>

            {/* Mobile Fee Breakdown */}
            {displayFeeBreakdown && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FiInfo className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Transaction Fee</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-subtle">Recipient receives</span>
                  <span className="font-medium">{currencySymbol} {displayFeeBreakdown.localAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-subtle">Service fee ({displayFeeBreakdown.feePercentage}%)</span>
                  <span className="font-semibold text-amber-600">+ {currencySymbol} {displayFeeBreakdown.feeLocal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-amber-500/30 pt-2">
                  <span className="font-medium">Total deducted</span>
                  <span className="font-bold text-lg">{currencySymbol} {displayFeeBreakdown.totalLocalDeducted.toLocaleString()}</span>
                </div>
              </div>
            )}

            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">Loading fee information...</p>
              </div>
            )}

            {feeError && !displayFeeBreakdown && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Could not load fee information. A 1% service fee will apply.
                </p>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-subtle">Payment Type</span>
                <span className="font-medium">{getPaymentTypeLabel()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-subtle">Recipient Gets</span>
                <span className="font-bold text-lg">{currencySymbol} {(paymentData.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-start text-sm">
                <span className="text-text-subtle">To</span>
                <div className="text-right max-w-[60%]">
                  <div className="font-medium break-words">{getRecipientDisplay()}</div>
                  <div className="text-xs text-text-subtle">via {paymentData.recipient?.institution}</div>
                </div>
              </div>

              {/* Source balances */}
              {balanceData && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-text-subtle text-sm">Base USDC</span>
                    <span className={`text-sm font-medium ${baseUsdcSufficient ? 'text-green-600' : 'text-text-subtle'}`}>
                      ${baseUsdcBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle text-sm">Celo USDT</span>
                    <span className={`text-sm font-medium ${celoUsdtSufficient ? 'text-green-600' : 'text-text-subtle'}`}>
                      ${celoUsdtBalance.toFixed(2)}
                    </span>
                  </div>
                  {selectedSource && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-text-subtle text-sm">Paying from</span>
                      <span className="text-sm font-semibold text-accent-primary">
                        {selectedSource === "base-usdc" ? "USDC on Base" : "USDT on Celo"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Convert needed */}
            {hasInsufficientBalance && totalAvailable >= usdcNeeded && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your funds are spread across different networks. Tap below to move them into one wallet so you can pay.
                </p>
              </div>
            )}

            {/* Truly insufficient */}
            {hasInsufficientBalance && totalAvailable < usdcNeeded && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Insufficient balance. You need {currencySymbol} {displayFeeBreakdown?.totalLocalDeducted.toLocaleString()}{" "}
                  but only have {currencySymbol} {localBalance.toLocaleString()}.
                </p>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please verify the recipient details carefully. Payments cannot be reversed once processed.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={handleConfirmPayment}
              disabled={isLoading || (hasInsufficientBalance && totalAvailable < usdcNeeded) || paymentMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(paymentMutation.isPending || isLoading) ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : hasInsufficientBalance && totalAvailable < usdcNeeded ? (
                "Insufficient Balance"
              ) : hasInsufficientBalance ? (
                "Move Funds First"
              ) : (
                "Confirm & Send"
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
        <DesktopPageLayout maxWidth="lg" className="h-full">
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
      {sourcePickerDrawer}
      {convertModalDrawer}
    </div>
  );
}
