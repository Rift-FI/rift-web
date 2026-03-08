import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useWithdraw } from "../context";
import useUser from "@/hooks/data/use-user";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCreateWithdrawalOrder from "@/hooks/data/use-create-withdrawal-order";
import useAnalaytics from "@/hooks/use-analytics";
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

// Currency symbols map
const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

type OfframpSource = "base-usdc" | "celo-usdt";

export default function WithdrawConfirmation() {
  const navigate = useNavigate();
  const { withdrawData, setCurrentStep, setCreatedOrder } = useWithdraw();
  const { data: user } = useUser();
  const { logEvent, updatePersonProperties } = useAnalaytics();
  const isDesktop = useDesktopDetection();

  const withdrawCurrency = (withdrawData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[withdrawCurrency];

  const { data: balanceData, isLoading: balanceLoading } = useAggregateBalance({
    currency: withdrawCurrency,
  });
  const createOrderMutation = useCreateWithdrawalOrder();

  // Source selection state
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<OfframpSource | null>(null);

  // Always fetch fee preview
  const { data: feePreview, isLoading: feeLoading, error: feeError } = useOfframpFeePreview(withdrawCurrency);

  // Calculate fee breakdown
  const feeBreakdown = useMemo(() => {
    if (withdrawData.feeBreakdown) return withdrawData.feeBreakdown;
    const amount = withdrawData.amount || 0;
    if (!feePreview || amount <= 0) return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [withdrawData.feeBreakdown, withdrawData.amount, feePreview]);

  // Fallback fee
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

  // Get specific balances from breakdown
  const baseUsdcBalance = balanceData?.breakdown.find(b => b.token === "USDC" && b.chain === "BASE")?.amount ?? 0;
  const celoUsdtBalance = balanceData?.breakdown.find(b => b.token === "USDT" && b.chain === "CELO")?.amount ?? 0;
  const usdcNeeded = displayFeeBreakdown?.usdcNeeded ?? 0;

  // Determine which sources can cover the withdrawal (small tolerance for rounding)
  const ROUNDING_TOLERANCE = 0.01;
  const baseUsdcSufficient = baseUsdcBalance >= usdcNeeded - ROUNDING_TOLERANCE;
  const celoUsdtSufficient = celoUsdtBalance >= usdcNeeded - ROUNDING_TOLERANCE;
  const totalAvailable = balanceData?.totalUsd ?? 0;
  const hasInsufficientBalance = usdcNeeded > 0 && !baseUsdcSufficient && !celoUsdtSufficient;

  // Find best chain to convert from (for convert modal)
  const bestConvertSource = useMemo(() => {
    if (!balanceData?.breakdown) return null;
    // Find the chain with the most USDC (excluding Base)
    const otherUsdcBalances = balanceData.breakdown
      .filter(b => b.token === "USDC" && b.chain !== "BASE" && b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    if (otherUsdcBalances.length > 0) return otherUsdcBalances[0];
    // Otherwise find the chain with most USDT (excluding Celo)
    const otherUsdtBalances = balanceData.breakdown
      .filter(b => b.token === "USDT" && b.chain !== "CELO" && b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    if (otherUsdtBalances.length > 0) return otherUsdtBalances[0];
    return null;
  }, [balanceData?.breakdown]);

  const handleBack = () => {
    setCurrentStep("amount");
  };

  const executeWithdrawal = async (source: OfframpSource) => {
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
      const token = source === "base-usdc" ? "USDC" : "USDT";
      const chain = source === "base-usdc" ? "base" : "celo";

      const withdrawalRequest = {
        token: token as any,
        amount: usdAmountToSend,
        currency: withdrawCurrency as any,
        chain: chain as any,
        recipient: paymentAccount,
      };

      const response = await createOrderMutation.mutateAsync(withdrawalRequest);

      logEvent("WITHDRAW_COMPLETED", {
        amount_usd: usdAmountToSend,
        amount_local: localAmount,
        currency: withdrawCurrency,
        exchange_rate: balanceData.exchangeRate,
        fee_local: feeData?.feeLocal || 0,
        fee_percentage: feeData?.feePercentage || 0,
        source: source,
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
        source: source,
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

  const handleConfirmWithdrawal = async () => {
    if (!balanceData?.exchangeRate || !withdrawData.amount) {
      toast.error("Missing withdrawal information");
      return;
    }

    // If user already picked a source (from picker), use it
    if (selectedSource) {
      await executeWithdrawal(selectedSource);
      return;
    }

    // Both sources can cover it — let user choose
    if (baseUsdcSufficient && celoUsdtSufficient) {
      setShowSourcePicker(true);
      return;
    }

    // Only Base USDC can cover it
    if (baseUsdcSufficient) {
      await executeWithdrawal("base-usdc");
      return;
    }

    // Only Celo USDT can cover it
    if (celoUsdtSufficient) {
      await executeWithdrawal("celo-usdt");
      return;
    }

    // Neither sufficient — check if total balance could cover it (needs conversion)
    if (totalAvailable >= usdcNeeded) {
      setShowConvertModal(true);
      return;
    }

    // Truly insufficient
    toast.error(`Insufficient balance. You need $${usdcNeeded.toFixed(2)} but only have $${totalAvailable.toFixed(2)} across all chains.`);
  };

  const handleSourceSelect = async (source: OfframpSource) => {
    setSelectedSource(source);
    setShowSourcePicker(false);
    await executeWithdrawal(source);
  };

  const handleGoToConvert = () => {
    const shortfall = usdcNeeded - baseUsdcBalance;
    const convertAmount = Math.ceil(shortfall * 100) / 100;
    const sourceChain = bestConvertSource?.chain || "ETHEREUM";
    const token = bestConvertSource?.token || "USDC";
    navigate(`/app/convert?sourceChain=${sourceChain}&destChain=BASE&token=${token}&amount=${convertAmount}`);
  };

  // Parse payment account for display
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
  const availableLocalBalance = balanceData?.localAmount || 0;
  const isLoading = balanceLoading || feeLoading;

  // Source picker drawer
  const sourcePickerDrawer = (
    <Drawer open={showSourcePicker} onClose={() => setShowSourcePicker(false)} onOpenChange={(o) => !o && setShowSourcePicker(false)}>
      <DrawerContent className="bg-surface">
        <DrawerHeader className="p-4">
          <DrawerTitle>Choose wallet</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-2">
          <p className="text-sm text-text-subtle mb-3">Which wallet would you like to withdraw from?</p>
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

  const content = (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`flex flex-col h-full overflow-hidden ${isDesktop ? "p-8" : ""}`}
    >
      {isDesktop ? (
        <div className="w-full max-w-2xl mx-auto">
          {/* Desktop Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Confirm Withdrawal</h1>
              <p className="text-sm text-gray-600 mt-1">Review and confirm your withdrawal details</p>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            {/* Fee Breakdown Card */}
            {displayFeeBreakdown && (
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

            {/* Withdrawal Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-subtle">You Receive</span>
                  <span className="font-bold text-lg">
                    {currencySymbol} {localAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-start pt-2 border-t border-surface">
                  <span className="text-text-subtle">Withdrawal Account</span>
                  <div className="text-right max-w-[60%]">
                    <div className="font-medium text-sm break-words">
                      {getPaymentAccountDisplay()}
                    </div>
                  </div>
                </div>

                {/* Source balances */}
                {balanceData && (
                  <>
                    <div className="flex justify-between items-center pt-2 border-t border-surface">
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
                      <div className="flex justify-between items-center pt-2 border-t border-surface">
                        <span className="text-text-subtle text-sm">Withdrawing from</span>
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
                  Your funds are spread across different networks. Tap below to move them into one wallet so you can withdraw.
                </p>
              </div>
            )}

            {/* Truly insufficient */}
            {hasInsufficientBalance && totalAvailable < usdcNeeded && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Insufficient balance. You need {currencySymbol} {displayFeeBreakdown?.totalLocalDeducted.toLocaleString() || localAmount.toLocaleString()}{" "}
                  but only have {currencySymbol} {availableLocalBalance.toLocaleString()} available.
                </p>
              </div>
            )}

            {/* Processing Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Withdrawal will be processed to your configured withdrawal account ({withdrawCurrency}).
                Processing may take a few minutes.
              </p>
            </div>

            {/* Desktop Button */}
            <div className="pt-4">
              <button
                onClick={handleConfirmWithdrawal}
                disabled={isLoading || (hasInsufficientBalance && totalAvailable < usdcNeeded) || createOrderMutation.isPending}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createOrderMutation.isPending || isLoading) ? (
                  <>
                    <CgSpinner className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : hasInsufficientBalance && totalAvailable < usdcNeeded ? (
                  "Insufficient Balance"
                ) : hasInsufficientBalance ? (
                  "Move Funds First"
                ) : (
                  "Confirm Withdrawal"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-6 flex-shrink-0">
            <button onClick={handleBack} className="p-2">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Confirm Withdrawal</h1>
            <div className="w-5 h-5" />
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium mb-2">Review Details</h2>
              <p className="text-text-subtle">
                Please confirm your withdrawal details
              </p>
            </div>

            {/* Fee Breakdown Card */}
            {displayFeeBreakdown && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
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
            )}

            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-surface-subtle rounded-lg p-4 mb-4 text-center">
                <p className="text-sm text-text-subtle">Loading fee information...</p>
              </div>
            )}

            {feeError && !displayFeeBreakdown && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Could not load fee information. A 1% service fee will apply.
                </p>
              </div>
            )}

            {/* Withdrawal Summary */}
            <div className="bg-surface-subtle rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-subtle">You Receive</span>
                  <span className="font-bold text-lg">
                    {currencySymbol} {localAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-start pt-2 border-t border-surface">
                  <span className="text-text-subtle">Withdrawal Account</span>
                  <div className="text-right max-w-[60%]">
                    <div className="font-medium text-sm break-words">
                      {getPaymentAccountDisplay()}
                    </div>
                  </div>
                </div>

                {/* Source balances */}
                {balanceData && (
                  <>
                    <div className="flex justify-between items-center pt-2 border-t border-surface">
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
                      <div className="flex justify-between items-center pt-2 border-t border-surface">
                        <span className="text-text-subtle text-sm">Withdrawing from</span>
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
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your funds are spread across different networks. Tap below to move them into one wallet so you can withdraw.
                </p>
              </div>
            )}

            {/* Truly insufficient */}
            {hasInsufficientBalance && totalAvailable < usdcNeeded && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Insufficient balance. You need {currencySymbol} {displayFeeBreakdown?.totalLocalDeducted.toLocaleString() || localAmount.toLocaleString()}{" "}
                  but only have {currencySymbol} {availableLocalBalance.toLocaleString()} available.
                </p>
              </div>
            )}

            {/* Processing Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Withdrawal will be processed to your configured withdrawal account ({withdrawCurrency}).
                Processing may take a few minutes.
              </p>
            </div>
          </div>

          {/* Mobile Button */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-gradient-to-t from-app-background via-app-background/90 to-transparent">
            <button
              onClick={handleConfirmWithdrawal}
              disabled={isLoading || (hasInsufficientBalance && totalAvailable < usdcNeeded) || createOrderMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createOrderMutation.isPending || isLoading) ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : hasInsufficientBalance && totalAvailable < usdcNeeded ? (
                "Insufficient Balance"
              ) : hasInsufficientBalance ? (
                "Move Funds First"
              ) : (
                "Confirm Withdrawal"
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
