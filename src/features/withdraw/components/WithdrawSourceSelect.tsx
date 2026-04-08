import { useMemo } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { ArrowLeftRight, ChevronRight, Wallet } from "lucide-react";
import { useNavigate } from "react-router";
import { useWithdraw, SOURCE_CONFIGS, type OfframpSource } from "../context";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import useUser from "@/hooks/data/use-user";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { useOfframpFeePreview } from "@/hooks/data/use-offramp-fee";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";
import { Skeleton } from "@/components/ui/skeleton";

const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh", NGN: "\u20A6", UGX: "USh", TZS: "TSh", CDF: "FC", MWK: "MK", BRL: "R$", USD: "$",
};

const CHAIN_ICONS: Record<string, string> = {
  Base: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  Ethereum: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  Polygon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  Arbitrum: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  Celo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png",
  Lisk: "https://raw.githubusercontent.com/nicholasgriffintn/trustwallet-assets-api/main/logos/lisk.png",
};

export default function WithdrawSourceSelect() {
  const navigate = useNavigate();
  const { updateWithdrawData, setCurrentStep } = useWithdraw();
  const { data: user } = useUser();
  const isDesktop = useDesktopDetection();

  const paymentAccountCurrency: SupportedCurrency = (() => {
    const paymentAccount = user?.paymentAccount || user?.payment_account;
    if (paymentAccount) {
      try { return JSON.parse(paymentAccount).currency || "KES"; } catch { return "KES"; }
    }
    return "KES";
  })();

  const currencySymbol = CURRENCY_SYMBOLS[paymentAccountCurrency];
  const { data: balanceData, isLoading } = useAggregateBalance({ currency: paymentAccountCurrency });
  const { data: feePreview } = useOfframpFeePreview(paymentAccountCurrency);

  const getMaxWithdrawableLocal = (usdBalance: number): number => {
    if (!feePreview || usdBalance <= 0) return 0;
    const buyingRate = feePreview.buying_rate || feePreview.rate;
    const feePercent = (feePreview.feeBps || 100) / 10000;
    return Math.floor((usdBalance * buyingRate) / (1 + feePercent));
  };

  const sourcesWithBalance = useMemo(() => {
    if (!balanceData?.breakdown) return [];
    return SOURCE_CONFIGS.map((cfg) => {
      const balance = balanceData.breakdown.find((b) => b.token === cfg.token && b.chain === cfg.chain)?.amount ?? 0;
      const maxLocal = getMaxWithdrawableLocal(balance);
      return { ...cfg, balance, maxLocal };
    }).filter((s) => s.balance > 0);
  }, [balanceData?.breakdown, feePreview]);

  const otherChainBalances = useMemo(() => {
    if (!balanceData?.breakdown) return [];
    const directKeys = new Set(SOURCE_CONFIGS.map((s) => `${s.chain}-${s.token}`));
    return balanceData.breakdown
      .filter((b) => !directKeys.has(`${b.chain}-${b.token}`) && b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [balanceData?.breakdown]);

  const totalMaxLocal = sourcesWithBalance.reduce((s, x) => s + x.maxLocal, 0);
  const totalDirect = sourcesWithBalance.reduce((s, x) => s + x.balance, 0);
  const totalOther = otherChainBalances.reduce((s, x) => s + x.amount, 0);

  const handleSelect = (sourceId: OfframpSource) => {
    updateWithdrawData({ selectedSource: sourceId, currency: paymentAccountCurrency });
    setCurrentStep("amount");
  };

  useMemo(() => {
    if (!isLoading && sourcesWithBalance.length === 1) {
      handleSelect(sourcesWithBalance[0].id);
    }
  }, [isLoading, sourcesWithBalance.length]);

  const handleConvert = (chain: string, token: string) => {
    navigate(`/app/convert?sourceChain=${chain}&destChain=BASE&token=${token}`);
  };

  // Percentage bar width for each source relative to the largest
  const maxBalance = Math.max(...sourcesWithBalance.map((s) => s.balance), 1);

  const inner = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col h-full ${isDesktop ? "" : "overflow-hidden"}`}
    >
      {/* Header */}
      <div className={`flex-shrink-0 ${isDesktop ? "mb-6" : "px-4 pt-4 pb-4"}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/app")} className="p-2 -ml-2 hover:bg-surface-subtle rounded-xl transition-colors">
            <FiArrowLeft className="w-5 h-5 text-text-default" />
          </button>
          <div>
            <h1 className={`font-bold text-text-default ${isDesktop ? "text-2xl" : "text-lg"}`}>Withdraw</h1>
            <p className="text-xs text-text-subtle">Select source wallet</p>
          </div>
        </div>
      </div>

      {/* Total Balance Card */}
      {!isLoading && sourcesWithBalance.length > 0 && (
        <div className={`flex-shrink-0 ${isDesktop ? "mb-6" : "mx-4 mb-4"}`}>
          <div className="bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 opacity-70" />
              <span className="text-xs font-medium opacity-70">Total Withdrawable</span>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {totalMaxLocal > 0 ? `${currencySymbol} ${totalMaxLocal.toLocaleString()}` : `$${totalDirect.toFixed(2)}`}
            </p>
            {totalMaxLocal > 0 && (
              <p className="text-xs opacity-60 mt-1">${totalDirect.toFixed(2)} USD across {sourcesWithBalance.length} {sourcesWithBalance.length === 1 ? "wallet" : "wallets"}</p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isDesktop ? "" : "px-4 pb-4"} space-y-3`}>
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
            ))}
          </div>
        )}

        {/* No funds */}
        {!isLoading && sourcesWithBalance.length === 0 && totalOther === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-surface-subtle rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-text-subtle" />
            </div>
            <p className="text-sm text-text-subtle text-center">No funds available to withdraw</p>
            <button onClick={() => navigate("/app/request?type=topup")} className="text-sm font-medium text-accent-primary">
              Deposit funds
            </button>
          </div>
        )}

        {/* No direct sources but has other chains */}
        {!isLoading && sourcesWithBalance.length === 0 && totalOther > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have ${totalOther.toFixed(2)} on other chains. Convert to a supported chain to withdraw.
            </p>
          </div>
        )}

        {/* Source list */}
        {!isLoading && sourcesWithBalance.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-1">Select Wallet</p>
            <div className="space-y-2">
              {sourcesWithBalance.map((src, i) => (
                <motion.button
                  key={src.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelect(src.id)}
                  className="group flex items-center w-full p-3.5 rounded-2xl bg-surface-subtle hover:bg-surface border border-transparent hover:border-accent-primary/30 transition-all active:scale-[0.98]"
                >
                  {/* Token + Chain icons stacked */}
                  <div className="relative mr-3 flex-shrink-0">
                    <img src={src.icon} alt="" className="w-10 h-10 rounded-full ring-2 ring-surface" />
                    {CHAIN_ICONS[src.chainLabel] && (
                      <img
                        src={CHAIN_ICONS[src.chainLabel]}
                        alt=""
                        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ring-2 ring-surface"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-text-default">{src.token}</p>
                      <p className="text-sm font-bold text-text-default tabular-nums">
                        {src.maxLocal > 0 ? `${currencySymbol} ${src.maxLocal.toLocaleString()}` : `$${src.balance.toFixed(2)}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-text-subtle">{src.chainLabel}</p>
                      <p className="text-[10px] text-text-subtle tabular-nums">${src.balance.toFixed(2)}</p>
                    </div>
                    {/* Balance bar */}
                    <div className="mt-2 h-1 bg-surface rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max((src.balance / maxBalance) * 100, 4)}%` }}
                        transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
                        className="h-full bg-accent-primary rounded-full"
                      />
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-text-subtle ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* Other chains */}
        {!isLoading && otherChainBalances.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-1 mt-4">Other Chains</p>
            <div className="rounded-2xl bg-surface-subtle/50 border border-border/50 divide-y divide-border/30">
              {otherChainBalances.map((b) => (
                <div key={`${b.chain}-${b.token}`} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-surface rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-text-subtle">{b.token[0]}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-default">{b.token} on {b.chain}</p>
                      <p className="text-[10px] text-text-subtle">${b.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleConvert(b.chain, b.token); }}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-primary bg-accent-primary/10 px-3 py-1.5 rounded-full hover:bg-accent-primary/20 transition-colors"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    Convert
                  </button>
                </div>
              ))}
            </div>
          </>
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
