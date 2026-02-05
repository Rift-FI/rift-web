import { useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useWithdraw } from "../context";
import useUser from "@/hooks/data/use-user";
import useBaseUSDCBalance, { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCreateWithdrawalOrder from "@/hooks/data/use-create-withdrawal-order";
import useAnalaytics from "@/hooks/use-analytics";
import ActionButton from "@/components/ui/action-button";
import RiftLoader from "@/components/ui/rift-loader";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

// Currency symbols map
const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

export default function WithdrawConfirmation() {
  const navigate = useNavigate();
  const { withdrawData, setCurrentStep, setCreatedOrder } = useWithdraw();
  const { data: user } = useUser();
  const { logEvent, updatePersonProperties } = useAnalaytics();
  const isDesktop = useDesktopDetection();
  
  // Get withdrawal currency from withdraw data
  const withdrawCurrency = (withdrawData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[withdrawCurrency];
  
  const { data: balanceData, isLoading: balanceLoading } = useBaseUSDCBalance({
    currency: withdrawCurrency,
  });
  const createOrderMutation = useCreateWithdrawalOrder();
  
  // Always fetch fee preview to show fees even if not passed from context
  const { data: feePreview, isLoading: feeLoading, error: feeError } = useOfframpFeePreview(withdrawCurrency);
  
  // Calculate fee breakdown - use from context if available, otherwise calculate here
  const feeBreakdown = useMemo(() => {
    // If we have it from context, use it
    if (withdrawData.feeBreakdown) {
      return withdrawData.feeBreakdown;
    }
    // Otherwise calculate it here
    const amount = withdrawData.amount || 0;
    if (!feePreview || amount <= 0) return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [withdrawData.feeBreakdown, withdrawData.amount, feePreview]);
  
  // Calculate fallback fee if API fails but we have balance data
  const fallbackFeeBreakdown = useMemo(() => {
    if (feeBreakdown) return null; // Don't need fallback if we have real data
    if (!balanceData?.exchangeRate || !withdrawData.amount) return null;
    
    const amount = withdrawData.amount;
    const feePercentage = 1; // Default 1% fee
    const feeLocal = Math.ceil(amount * (feePercentage / 100));
    const totalLocalDeducted = amount + feeLocal;
    const usdcAmount = Math.ceil((amount / balanceData.exchangeRate) * 1e6) / 1e6; // Amount to send to backend
    const usdcNeeded = Math.ceil((totalLocalDeducted / balanceData.exchangeRate) * 1e6) / 1e6; // For balance check
    
    return {
      localAmount: amount,
      feeLocal,
      totalLocalDeducted,
      usdcAmount,    // Send this to backend
      usdcNeeded,    // Use this for balance check
      exchangeRate: balanceData.exchangeRate,
      feePercentage,
      feeBps: 100,
    };
  }, [feeBreakdown, balanceData?.exchangeRate, withdrawData.amount]);
  
  // Use real fee breakdown or fallback
  const displayFeeBreakdown = feeBreakdown || fallbackFeeBreakdown;

  const handleBack = () => {
    setCurrentStep("amount");
  };

  const handleConfirmWithdrawal = async () => {
    if (!balanceData?.exchangeRate || !withdrawData.amount) {
      toast.error("Missing withdrawal information");
      return;
    }

    const localAmount = withdrawData.amount;
    const feeData = displayFeeBreakdown;
    const availableUsdBalance = balanceData.usdcAmount || 0;
    
    // Check if user has sufficient balance (amount + fee)
    if (feeData && feeData.usdcNeeded > availableUsdBalance) {
      toast.error(`Insufficient balance. You need ${feeData.usdcNeeded.toFixed(4)} USDC but only have ${availableUsdBalance.toFixed(4)} USDC.`);
      return;
    }

    // Get user's payment account
    const paymentAccount = user?.paymentAccount || user?.payment_account;
    if (!paymentAccount) {
      toast.error("No withdrawal account configured");
      return;
    }

    // Amount to send to backend (WITHOUT fee - backend will deduct fee)
    const usdAmountToSend = feeData?.usdcAmount || Math.round((localAmount / balanceData.exchangeRate) * 1e6) / 1e6;

    // Check for duplicate transaction
    const lockError = checkAndSetTransactionLock(
      "withdraw",
      usdAmountToSend,
      paymentAccount,
      withdrawCurrency
    );
    if (lockError) {
      toast.error(lockError);
      return;
    }

    try {
      const withdrawalRequest = {
        token: "USDC" as const,
        amount: usdAmountToSend, // Send USD amount WITHOUT fee - backend will deduct fee
        currency: withdrawCurrency,
        chain: "base" as const,
        recipient: paymentAccount,
      };

      const response = await createOrderMutation.mutateAsync(withdrawalRequest);

      // Track successful withdrawal
      logEvent("WITHDRAW_COMPLETED", {
        amount_usd: usdAmountToSend,
        amount_local: localAmount,
        currency: withdrawCurrency,
        exchange_rate: balanceData.exchangeRate,
        fee_local: feeData?.feeLocal || 0,
        fee_percentage: feeData?.feePercentage || 0,
        total_deducted_local: feeData?.totalLocalDeducted || localAmount,
        payment_account_type: paymentAccount ? "configured" : "none",
      });

      // Update person property
      updatePersonProperties({ has_withdrawn: true });

      setCreatedOrder(response.order);
      setCurrentStep("success");
      toast.success("Withdrawal order created successfully!");
    } catch (error: any) {
      // Track withdrawal failure
      logEvent("WITHDRAW_FAILED", {
        amount_usd: usdAmountToSend,
        amount_local: localAmount,
        currency: withdrawCurrency,
        error: error.message || "Unknown error",
      });
      
      toast.error("Failed to create withdrawal order. Please try again.");
    }
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
  
  // Use fee breakdown for USDC amount if available, otherwise calculate
  const usdAmount = displayFeeBreakdown?.usdcNeeded || 
    (balanceData?.exchangeRate
      ? Math.round((localAmount / balanceData.exchangeRate) * 1e6) / 1e6
      : 0);
  
  const availableLocalBalance = balanceData?.localAmount || 0;
  const availableUsdBalance = balanceData?.usdcAmount || 0;
  
  // Check balance against USDC needed (including fee)
  const hasInsufficientBalance = displayFeeBreakdown 
    ? displayFeeBreakdown.usdcNeeded > availableUsdBalance
    : localAmount > availableLocalBalance;
    
  const isLoading = balanceLoading || feeLoading;

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
            {/* Fee Breakdown Card - Always show prominently */}
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
            
            {/* Loading fee info */}
            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">Loading fee information...</p>
              </div>
            )}
            
            {/* Error loading fee - show warning but allow to proceed */}
            {feeError && !displayFeeBreakdown && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ Could not load fee information. A 1% service fee will apply.
                </p>
              </div>
            )}

            {/* Withdrawal Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
        <div className="space-y-3">
          {/* Amount User Receives */}
          <div className="flex justify-between items-center">
            <span className="text-text-subtle">You Receive</span>
            <span className="font-bold text-lg">
              {currencySymbol} {localAmount.toLocaleString()}
            </span>
          </div>

          {/* Withdrawal Account */}
          <div className="flex justify-between items-start pt-2 border-t border-surface">
            <span className="text-text-subtle">Withdrawal Account</span>
            <div className="text-right max-w-[60%]">
              <div className="font-medium text-sm break-words">
                {getPaymentAccountDisplay()}
              </div>
            </div>
          </div>

          {/* Available Balance */}
          {balanceData && (
            <div className="flex justify-between items-center pt-2 border-t border-surface">
              <span className="text-text-subtle text-sm">
                Your Balance
              </span>
              <span className={`text-sm font-medium ${hasInsufficientBalance ? 'text-red-500' : 'text-green-600'}`}>
                {currencySymbol} {availableLocalBalance.toLocaleString()}
              </span>
            </div>
          )}
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Insufficient balance. You need {currencySymbol} {displayFeeBreakdown?.totalLocalDeducted.toLocaleString() || localAmount.toLocaleString()}{" "}
                  but only have {currencySymbol} {availableLocalBalance.toLocaleString()} available.
                </p>
              </div>
            )}

            {/* Processing Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ℹ️ Withdrawal will be processed to your configured withdrawal account ({withdrawCurrency}).
                Processing may take a few minutes.
              </p>
            </div>

            {/* Desktop Button */}
            <div className="pt-4">
              <button
                onClick={handleConfirmWithdrawal}
                disabled={isLoading || hasInsufficientBalance || createOrderMutation.isPending}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createOrderMutation.isPending || isLoading) ? (
                  <>
                    <RiftLoader size="sm" />
                    <span>Processing...</span>
                  </>
                ) : hasInsufficientBalance ? (
                  "Insufficient Balance"
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
            
            {/* Loading fee info */}
            {feeLoading && !displayFeeBreakdown && (
              <div className="bg-surface-subtle rounded-lg p-4 mb-4 text-center">
                <p className="text-sm text-text-subtle">Loading fee information...</p>
              </div>
            )}
            
            {/* Error loading fee */}
            {feeError && !displayFeeBreakdown && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ Could not load fee information. A 1% service fee will apply.
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

                {balanceData && (
                  <div className="flex justify-between items-center pt-2 border-t border-surface">
                    <span className="text-text-subtle text-sm">
                      Your Balance
                    </span>
                    <span className={`text-sm font-medium ${hasInsufficientBalance ? 'text-red-500' : 'text-green-600'}`}>
                      {currencySymbol} {availableLocalBalance.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Insufficient balance. You need {currencySymbol} {displayFeeBreakdown?.totalLocalDeducted.toLocaleString() || localAmount.toLocaleString()}{" "}
                  but only have {currencySymbol} {availableLocalBalance.toLocaleString()} available.
                </p>
              </div>
            )}

            {/* Processing Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ℹ️ Withdrawal will be processed to your configured withdrawal account ({withdrawCurrency}).
                Processing may take a few minutes.
              </p>
            </div>
          </div>

          {/* Mobile Button */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-gradient-to-t from-app-background via-app-background/90 to-transparent">
            <button
              onClick={handleConfirmWithdrawal}
              disabled={isLoading || hasInsufficientBalance || createOrderMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createOrderMutation.isPending || isLoading) ? (
                <>
                  <RiftLoader size="sm" />
                  <span>Processing...</span>
                </>
              ) : hasInsufficientBalance ? (
                "Insufficient Balance"
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
    </div>
  );
}
