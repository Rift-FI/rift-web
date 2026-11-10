/**
 * Shared building blocks for the offramp money flows (mobile-money / bank
 * payouts and withdrawals): source picker, amount step, quote + review rows.
 *
 * The maths and validation are carried over unchanged from the previous
 * step screens (PaySourceSelect / AmountInput / PaymentConfirmation and
 * their withdraw twins): fee preview → calculateOfframpFeeBreakdown, the
 * 1%-fee fallback, max-payable, first-send $3 minimum, the paymaster gas
 * estimate and the balance gate. Only the presentation changed.
 */
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeftRight, Wallet } from "lucide-react";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { useOfframpFeePreview, calculateOfframpFeeBreakdown, type FeeBreakdown } from "@/hooks/data/use-offramp-fee";
import { useTransactionFee } from "@/hooks/data/use-transaction-fee";
import useUser from "@/hooks/data/use-user";
import useAccountDeployed from "@/hooks/wallet/use-account-deployed";
import { SOURCE_CONFIGS, type OfframpSource } from "@/features/withdraw/context";
import { Button, EmptyState, Field, INPUT_CLASS, Row, Rows, Skeleton } from "@/v2/ui";
import { OptionTile, SectionActions } from "@/v2/ui/flow";
import { cn } from "@/lib/utils";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh",
  NGN: "₦",
  UGX: "USh",
  TZS: "TSh",
  CDF: "FC",
  MWK: "MK",
  BRL: "R$",
  ETB: "Br",
  GHS: "₵",
  USD: "$",
};

export const COUNTRY_NAMES: Record<string, string> = {
  KES: "Kenya",
  NGN: "Nigeria",
  UGX: "Uganda",
  TZS: "Tanzania",
  CDF: "DR Congo",
  MWK: "Malawi",
  BRL: "Brazil",
  USD: "International",
};

export const formatLocal = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export const money = (currency: string, n: number) => `${CURRENCY_SYMBOLS[currency] || currency} ${formatLocal(n)}`;

export function sourceLabel(id?: OfframpSource) {
  const s = SOURCE_CONFIGS.find((c) => c.id === id);
  return s ? `${s.token} on ${s.chainLabel}` : "";
}

/* ── Pay from ──────────────────────────────────────────────────────── */

export function SourcePicker({
  currency,
  value,
  onSelect,
  onBack,
}: {
  currency: SupportedCurrency;
  value?: OfframpSource;
  onSelect: (id: OfframpSource) => void;
  onBack?: () => void;
}) {
  const navigate = useNavigate();
  const symbol = CURRENCY_SYMBOLS[currency];
  const { data: balanceData, isLoading } = useAggregateBalance({ currency });
  const { data: feePreview } = useOfframpFeePreview(currency);

  const getMaxLocal = (usdBalance: number): number => {
    if (!feePreview || usdBalance <= 0) return 0;
    const buyingRate = feePreview.buying_rate || feePreview.rate;
    const feePercent = (feePreview.feeBps || 100) / 10000;
    return Math.floor((usdBalance * buyingRate) / (1 + feePercent));
  };

  const sources = useMemo(() => {
    if (!balanceData?.breakdown) return [];
    return SOURCE_CONFIGS.map((cfg) => {
      const balance = balanceData.breakdown.find((b) => b.token === cfg.token && b.chain === cfg.chain)?.amount ?? 0;
      return { ...cfg, balance, maxLocal: getMaxLocal(balance) };
    }).filter((s) => s.balance > 0);
  }, [balanceData?.breakdown, feePreview]);

  const otherChains = useMemo(() => {
    if (!balanceData?.breakdown) return [];
    const direct = new Set(SOURCE_CONFIGS.map((s) => `${s.chain}-${s.token}`));
    return balanceData.breakdown.filter((b) => !direct.has(`${b.chain}-${b.token}`) && b.amount > 0).sort((a, b) => b.amount - a.amount);
  }, [balanceData?.breakdown]);

  // Exactly one funded wallet → pick it (as before).
  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current) return;
    if (value) {
      autoRef.current = true;
      return;
    }
    if (!isLoading && sources.length === 1) {
      autoRef.current = true;
      onSelect(sources[0].id);
    }
  }, [isLoading, sources, value]);

  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading balances">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {sources.length === 0 && otherChains.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-5 w-5" />}
          title="No funds available"
          description="Add funds to your account to send a payout."
          action={<Button onClick={() => navigate("/app/request?type=topup")}>Add funds</Button>}
        />
      ) : (
        <ul className="space-y-2" aria-label="Source wallets">
          {sources.map((s) => (
            <li key={s.id}>
              <OptionTile selected={value === s.id} onClick={() => onSelect(s.id)} data-testid={`source-${s.id}`}>
                <img src={s.icon} alt="" className="h-8 w-8 flex-shrink-0 rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">{s.token}</span>
                  <span className="block text-[12.5px] text-ink-3">{s.chainLabel}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[14px] font-semibold text-ink tabular-numeric">${s.balance.toFixed(2)}</span>
                  {s.maxLocal > 0 && (
                    <span className="block text-[12px] text-ink-3 tabular-numeric">
                      up to {symbol} {s.maxLocal.toLocaleString()}
                    </span>
                  )}
                </span>
              </OptionTile>
            </li>
          ))}
        </ul>
      )}
      {otherChains.length > 0 && (
        <div className="mt-4 rounded-md border border-hairline">
          <p className="border-b border-hairline px-4 py-2.5 text-[12.5px] font-medium text-ink-3">
            {sources.length === 0 ? "Your funds are on networks that can't pay out directly. Move them to Base first." : "Other networks"}
          </p>
          <ul className="divide-y divide-hairline">
            {otherChains.map((b) => (
              <li key={`${b.chain}-${b.token}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-[13.5px] text-ink">
                  {b.token} on {b.chain.charAt(0) + b.chain.slice(1).toLowerCase()} <span className="text-ink-3 tabular-numeric">${b.amount.toFixed(2)}</span>
                </span>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/app/convert?sourceChain=${b.chain}&destChain=BASE&token=${b.token}`)}>
                  <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                  Move
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {onBack && <SectionActions onBack={onBack}>{null}</SectionActions>}
    </div>
  );
}

/* ── Amount ────────────────────────────────────────────────────────── */

const QUICK_AMOUNTS: Record<string, number[]> = {
  KES: [100, 500, 1000, 2000, 5000],
  NGN: [1000, 5000, 10000, 50000, 100000],
  UGX: [5000, 10000, 50000, 100000, 500000],
  TZS: [5000, 10000, 50000, 100000, 500000],
  CDF: [5000, 10000, 50000, 100000, 500000],
  MWK: [1000, 5000, 10000, 50000, 100000],
  BRL: [20, 50, 100, 500, 1000],
  USD: [3, 5, 10, 20, 50, 100],
};

export function AmountStep({
  currency,
  sourceId,
  initialAmount,
  label = "Recipient gets",
  onBack,
  onContinue,
}: {
  currency: SupportedCurrency;
  sourceId?: OfframpSource;
  initialAmount?: number;
  label?: string;
  onBack?: () => void;
  onContinue: (amount: number, feeBreakdown: FeeBreakdown | undefined, ctx: { exchangeRate: number }) => void;
}) {
  const [localAmount, setLocalAmount] = useState(initialAmount ? String(initialAmount) : "");
  const symbol = CURRENCY_SYMBOLS[currency];
  const sourceConfig = SOURCE_CONFIGS.find((s) => s.id === sourceId);
  const { data: feePreview, isLoading: feeLoading } = useOfframpFeePreview(currency, currency !== "USD");
  const { data: balanceData } = useAggregateBalance({ currency });

  const sourceBalance = useMemo(() => {
    if (!balanceData?.breakdown || !sourceConfig) return 0;
    return balanceData.breakdown.find((b) => b.token === sourceConfig.token && b.chain === sourceConfig.chain)?.amount ?? 0;
  }, [balanceData?.breakdown, sourceConfig]);
  const exchangeRate = balanceData?.exchangeRate || 1;

  const buyingRate = feePreview?.buying_rate || feePreview?.rate || (currency === "USD" ? 1 : null);

  const maxPayableLocal = useMemo(() => {
    if (!feePreview || sourceBalance <= 0) return 0;
    const rate = feePreview.buying_rate || feePreview.rate;
    const feePercent = (feePreview.feeBps || 100) / 10000;
    return Math.floor((sourceBalance * rate) / (1 + feePercent));
  }, [feePreview, sourceBalance]);

  const feeBreakdown = useMemo(() => {
    const amount = parseFloat(localAmount);
    if (!feePreview || isNaN(amount) || amount <= 0 || currency === "USD") return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [localAmount, feePreview, currency]);

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

  // $3 minimum only for the first send from a chain (account deployment).
  const MIN_USD_TXN_FIRST_TIME = 3;
  const { isDeployed, chainLabel } = useAccountDeployed(sourceConfig?.chain);
  const requiresFirstTimeMin = isDeployed !== true;
  const minLocal = requiresFirstTimeMin ? (buyingRate ? Math.ceil(MIN_USD_TXN_FIRST_TIME * buyingRate) : MIN_USD_TXN_FIRST_TIME) : 0;

  const entered = parseFloat(localAmount);
  const hasEntered = !!localAmount && !isNaN(entered) && entered > 0;
  const belowMin = hasEntered && requiresFirstTimeMin && entered < minLocal;
  const error = belowMin
    ? `Your first payout from ${chainLabel || sourceConfig?.chainLabel || "this network"} must be at least ${symbol} ${minLocal.toLocaleString()} ($${MIN_USD_TXN_FIRST_TIME}). It activates your account there.`
    : hasEntered && hasInsufficientBalance
      ? `Not enough on ${sourceConfig?.chainLabel || "this network"}. You can send up to ${symbol} ${maxPayableLocal.toLocaleString()}.`
      : null;

  const handleNext = () => {
    const amount = parseFloat(localAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (requiresFirstTimeMin && amount < minLocal) {
      toast.error(
        `Your first send from ${chainLabel || sourceConfig?.chainLabel || "this network"} needs at least $${MIN_USD_TXN_FIRST_TIME} (≈ ${symbol} ${minLocal.toLocaleString()}). This sets up your wallet on that network — receiving funds doesn't count. After this first one, any amount works.`
      );
      return;
    }
    if (hasInsufficientBalance && feeBreakdown) {
      toast.error(
        `Insufficient balance on ${sourceConfig?.chainLabel || "selected chain"}. You need $${feeBreakdown.usdcNeeded.toFixed(2)} but only have $${sourceBalance.toFixed(2)}.`
      );
      return;
    }
    onContinue(amount, feeBreakdown || undefined, { exchangeRate });
  };

  const quick = (() => {
    const list = QUICK_AMOUNTS[currency] || QUICK_AMOUNTS.KES;
    if (!requiresFirstTimeMin) return list.slice(0, 5);
    return Array.from(new Set([minLocal, ...list.filter((v) => v >= minLocal)])).slice(0, 5);
  })();

  return (
    <div>
      <Field
        label={label}
        htmlFor="offramp-amount"
        error={error || undefined}
        hint={
          maxPayableLocal > 0
            ? `Available from ${sourceConfig?.token ?? ""} on ${sourceConfig?.chainLabel ?? ""}: up to ${symbol} ${maxPayableLocal.toLocaleString()}`
            : sourceConfig
              ? `Available: $${sourceBalance.toFixed(2)}`
              : undefined
        }
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-medium text-ink-3">{symbol}</span>
          <input
            id="offramp-amount"
            type="number"
            inputMode="decimal"
            min={0}
            value={localAmount}
            onChange={(e) => setLocalAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            aria-invalid={!!error}
            placeholder="0"
            className={cn(INPUT_CLASS, "pl-14 pr-20 text-[17px] font-semibold tabular-numeric")}
            autoFocus
          />
          {maxPayableLocal > 0 && (
            <button
              type="button"
              onClick={() => setLocalAmount(String(maxPayableLocal))}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12px] font-semibold text-accent-primary hover:bg-teal-50 cursor-pointer"
            >
              Max
            </button>
          )}
        </div>
      </Field>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Quick amounts">
        {quick.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setLocalAmount(String(v))}
            className={cn(
              "h-8 rounded-full border px-3 text-[13px] font-medium tabular-numeric cursor-pointer",
              localAmount === String(v) ? "border-accent-primary bg-teal-50 text-accent-primary" : "border-hairline text-ink-2 hover:border-hairline-strong"
            )}
          >
            {v.toLocaleString()}
          </button>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-surface-subtle px-4 py-3 text-[13px]">
        <div>
          <dt className="text-ink-3">Exchange rate</dt>
          <dd className="font-medium text-ink tabular-numeric">
            {feeLoading && currency !== "USD" ? "…" : buyingRate ? `1 USD = ${buyingRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">You pay (approx.)</dt>
          <dd className="font-medium text-ink tabular-numeric">{feeBreakdown ? `$${feeBreakdown.usdcNeeded.toFixed(2)}` : hasEntered && currency === "USD" ? `$${entered.toFixed(2)}` : "—"}</dd>
        </div>
      </dl>
      <SectionActions onBack={onBack}>
        <Button onClick={handleNext} disabled={!hasEntered || !!error} size="lg">
          Continue to review
        </Button>
      </SectionActions>
    </div>
  );
}

/* ── Quote (review) ────────────────────────────────────────────────── */

export function useOfframpQuote({
  currency,
  sourceId,
  amount,
  feeBreakdownIn,
}: {
  currency: SupportedCurrency;
  sourceId?: OfframpSource;
  amount?: number;
  feeBreakdownIn?: FeeBreakdown;
}) {
  const sourceConfig = SOURCE_CONFIGS.find((s) => s.id === sourceId);
  const { data: balanceData, isLoading: balanceLoading } = useAggregateBalance({ currency });
  const { data: feePreview, isLoading: feeLoading } = useOfframpFeePreview(currency);

  const feeBreakdown = useMemo(() => {
    if (feeBreakdownIn) return feeBreakdownIn;
    const a = amount || 0;
    if (!feePreview || a <= 0) return null;
    return calculateOfframpFeeBreakdown(a, feePreview);
  }, [feeBreakdownIn, amount, feePreview]);

  const fallbackFeeBreakdown = useMemo(() => {
    if (feeBreakdown) return null;
    if (!balanceData?.exchangeRate || !amount) return null;
    const feePercentage = 1;
    const feeLocal = Math.ceil(amount * (feePercentage / 100));
    const totalLocalDeducted = amount + feeLocal;
    const usdcAmount = Math.ceil((amount / balanceData.exchangeRate) * 1e6) / 1e6;
    const usdcNeeded = Math.ceil((totalLocalDeducted / balanceData.exchangeRate) * 1e6) / 1e6;
    return { localAmount: amount, feeLocal, totalLocalDeducted, usdcAmount, usdcNeeded, exchangeRate: balanceData.exchangeRate, feePercentage, feeBps: 100 };
  }, [feeBreakdown, balanceData?.exchangeRate, amount]);

  const display = feeBreakdown || fallbackFeeBreakdown;
  const exchangeRate = display?.exchangeRate ?? balanceData?.exchangeRate ?? 0;

  const sourceBalance = useMemo(() => {
    if (!balanceData?.breakdown || !sourceConfig) return 0;
    return balanceData.breakdown.find((b) => b.token === sourceConfig.token && b.chain === sourceConfig.chain)?.amount ?? 0;
  }, [balanceData?.breakdown, sourceConfig]);

  // Paymaster gas, paid in the same token, on top of the post-fee spend.
  const { data: user } = useUser();
  const onchainSpend = display?.usdcNeeded ?? display?.usdcAmount ?? 0;
  const gasFeeArgs =
    onchainSpend > 0 && user?.address && sourceConfig
      ? { recipient: user.address, amount: onchainSpend, chain: sourceConfig.sdkChain as string, token: sourceConfig.token as string }
      : null;
  const gasFeeQuery = useTransactionFee(gasFeeArgs, true);
  const gasFeeInToken = gasFeeQuery.data ? parseFloat(gasFeeQuery.data.gasFeeInToken) : 0;
  const paymasterFeeInToken = gasFeeQuery.data?.paymasterFeeInToken ? parseFloat(gasFeeQuery.data.paymasterFeeInToken) : gasFeeInToken;
  const totalUsdcRequired = onchainSpend + gasFeeInToken;
  const balanceInsufficient = !!display && sourceBalance < totalUsdcRequired;
  const networkFeeInLocal = exchangeRate > 0 ? paymasterFeeInToken * exchangeRate : 0;

  const SERVICE_FEE_RATE = 0.003; // 0.3%
  const serviceFeeLocal = display ? display.localAmount * SERVICE_FEE_RATE : 0;
  const displayedTotal = display ? display.localAmount + serviceFeeLocal + networkFeeInLocal : 0;

  return {
    sourceConfig,
    sourceBalance,
    display,
    exchangeRate,
    serviceFeeLocal,
    networkFeeInLocal,
    displayedTotal,
    isGasDegraded: gasFeeQuery.data?.degraded === true,
    balanceInsufficient,
    isLoading: balanceLoading || feeLoading,
  };
}

export type OfframpQuote = ReturnType<typeof useOfframpQuote>;

export function QuoteRows({ quote, currency, receiveLabel, extra }: { quote: OfframpQuote; currency: string; receiveLabel: string; extra?: ReactNode }) {
  const { display } = quote;
  if (!display) {
    return (
      <div className="space-y-2 py-2" role="status" aria-label="Calculating fees">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  return (
    <Rows>
      {extra}
      <Row label={receiveLabel}>{money(currency, display.localAmount)}</Row>
      <Row label="Service fee (0.3%)">{money(currency, quote.serviceFeeLocal)}</Row>
      {quote.networkFeeInLocal > 0 && (
        <Row label={quote.isGasDegraded ? "Network fee (estimated)" : "Network fee"}>
          {quote.isGasDegraded ? "~ " : ""}
          {money(currency, quote.networkFeeInLocal)}
        </Row>
      )}
      <Row label="Total deducted" strong>
        {money(currency, quote.displayedTotal)}
      </Row>
      {quote.sourceConfig && (
        <Row label="Paid from">
          {quote.sourceConfig.token} on {quote.sourceConfig.chainLabel}
        </Row>
      )}
    </Rows>
  );
}
