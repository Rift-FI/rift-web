import { useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { useOfframpFeePreview } from "@/hooks/data/use-offramp-fee";
import { SOURCE_CONFIGS, type OfframpSource } from "@/features/withdraw/context";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";
import { Skeleton } from "@/components/ui/skeleton";

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh", NGN: "₦", ETB: "Br", UGX: "USh", GHS: "₵", USD: "$",
};

export default function PaySourceSelect() {
  const navigate = useNavigate();
  const { paymentData, updatePaymentData, setCurrentStep } = usePay();
  const isDesktop = useDesktopDetection();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const { data: balanceData, isLoading } = useAggregateBalance({ currency });
  const { data: feePreview } = useOfframpFeePreview(currency);

  const getMaxWithdrawableLocal = (usdBalance: number): number => {
    if (!feePreview || usdBalance <= 0) return 0;
    const buyingRate = feePreview.buying_rate || feePreview.rate;
    const feePercent = (feePreview.feeBps || 100) / 10000;
    return Math.floor((usdBalance * buyingRate) / (1 + feePercent));
  };

  const sourcesWithBalance = useMemo(() => {
    if (!balanceData?.breakdown) return [];
    return SOURCE_CONFIGS.map((cfg) => {
      const balance =
        balanceData.breakdown.find(
          (b) => b.token === cfg.token && b.chain === cfg.chain
        )?.amount ?? 0;
      const maxLocal = getMaxWithdrawableLocal(balance);
      return { ...cfg, balance, maxLocal };
    }).filter((s) => s.balance > 0);
  }, [balanceData?.breakdown, feePreview]);

  const otherChainBalances = useMemo(() => {
    if (!balanceData?.breakdown) return [];
    const directKeys = new Set(
      SOURCE_CONFIGS.map((s) => `${s.chain}-${s.token}`)
    );
    return balanceData.breakdown
      .filter((b) => !directKeys.has(`${b.chain}-${b.token}`) && b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [balanceData?.breakdown]);

  const totalDirect = sourcesWithBalance.reduce((s, x) => s + x.balance, 0);
  const totalOther = otherChainBalances.reduce((s, x) => s + x.amount, 0);
  const totalMaxLocal = sourcesWithBalance.reduce((s, x) => s + x.maxLocal, 0);

  const handleSelect = (sourceId: OfframpSource) => {
    updatePaymentData({ selectedSource: sourceId });
    setCurrentStep("amount");
  };

  // Auto-select if only one source has funds
  useMemo(() => {
    if (!isLoading && sourcesWithBalance.length === 1) {
      handleSelect(sourcesWithBalance[0].id);
    }
  }, [isLoading, sourcesWithBalance.length]);

  const handleBack = () => {
    // Go back to type (Kenya) or country (others)
    if (paymentData.currency === "KES") {
      setCurrentStep("type");
    } else {
      setCurrentStep("country");
    }
  };

  const handleConvert = (chain: string, token: string) => {
    navigate(
      `/app/convert?sourceChain=${chain}&destChain=BASE&token=${token}`
    );
  };

  const inner = (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`flex flex-col h-full ${isDesktop ? "" : "overflow-hidden"}`}
    >
      <div
        className={`flex items-center ${
          isDesktop ? "gap-4 mb-8" : "justify-between px-4 pt-4 pb-6"
        } flex-shrink-0`}
      >
        <button
          onClick={handleBack}
          className={`p-2 ${isDesktop ? "hover:bg-gray-100 rounded-lg" : ""}`}
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        {isDesktop ? (
          <div>
            <h1 className="text-2xl font-semibold">Pay With</h1>
            <p className="text-sm text-text-subtle mt-1">
              Choose which asset to pay from
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Pay With</h1>
            <div className="w-5 h-5" />
          </>
        )}
      </div>

      <div
        className={`flex-1 overflow-y-auto ${
          isDesktop ? "" : "px-4 pb-4"
        } space-y-5`}
      >
        {!isDesktop && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-1">Choose Asset</h2>
            <p className="text-sm text-text-subtle">
              Select which wallet to pay from
            </p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && sourcesWithBalance.length === 0 && totalOther === 0 && (
          <div className="text-center py-12">
            <p className="text-text-subtle text-sm">
              No funds available. Deposit or receive crypto first.
            </p>
          </div>
        )}

        {!isLoading && sourcesWithBalance.length === 0 && totalOther > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have ${totalOther.toFixed(2)} on other chains. Move funds to Base, Celo, or Lisk to pay.
            </p>
          </div>
        )}

        {!isLoading && sourcesWithBalance.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-subtle uppercase tracking-wide">
              Available to pay with
            </p>
            {sourcesWithBalance.map((src) => (
              <button
                key={src.id}
                onClick={() => handleSelect(src.id)}
                className="flex items-center justify-between w-full p-4 rounded-xl bg-surface-subtle hover:bg-surface-subtle/80 border border-border-subtle transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={src.icon}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-text-default">
                      {src.token} on {src.chainLabel}
                    </p>
                    <p className="text-xs text-text-subtle">
                      ${src.balance.toFixed(2)} available
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-text-default">
                    {src.maxLocal > 0
                      ? `${currencySymbol} ${src.maxLocal.toLocaleString()}`
                      : `$${src.balance.toFixed(2)}`}
                  </p>
                  <p className="text-[10px] text-green-600 font-medium">
                    Max payment
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && sourcesWithBalance.length > 1 && (
          <div className="bg-surface-subtle rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-subtle">Total available</span>
              <span className="text-sm font-bold">
                {totalMaxLocal > 0
                  ? `${currencySymbol} ${totalMaxLocal.toLocaleString()}`
                  : `$${totalDirect.toFixed(2)}`}
              </span>
            </div>
            {totalOther > 0 && (
              <p className="text-[10px] text-text-subtle">
                + ${totalOther.toFixed(2)} on other chains — convert first to pay more
              </p>
            )}
          </div>
        )}

        {!isLoading && sourcesWithBalance.length === 1 && totalOther > 0 && (
          <div className="bg-surface-subtle rounded-xl p-3">
            <p className="text-[10px] text-text-subtle">
              Need more? You have ${totalOther.toFixed(2)} on other chains you can convert first.
            </p>
          </div>
        )}

        {!isLoading && otherChainBalances.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-subtle uppercase tracking-wide">
              Other chains (convert first)
            </p>
            <div className="bg-surface-subtle rounded-xl p-3 space-y-2">
              {otherChainBalances.map((b) => (
                <div
                  key={`${b.chain}-${b.token}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-text-subtle">
                    {b.token} on {b.chain}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-subtle">
                      ${b.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleConvert(b.chain, b.token); }}
                      className="flex items-center gap-1 text-[10px] font-medium text-accent-primary bg-accent-primary/10 px-2 py-1 rounded-full hover:bg-accent-primary/20 transition-colors"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      Move
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (isDesktop) {
    return (
      <DesktopPageLayout maxWidth="lg" className="h-full">
        <div className="w-full max-w-2xl mx-auto p-8">{inner}</div>
      </DesktopPageLayout>
    );
  }

  return inner;
}
