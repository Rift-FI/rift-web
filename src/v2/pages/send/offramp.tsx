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
import { SmartSourcePicker, sourceKey, useSources, type SourceOption } from "./source-picker";
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
export const money = (currency: string, n: number) =>
  currency === "USD" ? "$" + formatLocal(n) : `${CURRENCY_SYMBOLS[currency] || currency} ${formatLocal(n)}`;

export function sourceLabel(id?: OfframpSource) {
  const s = SOURCE_CONFIGS.find((c) => c.id === id);
  return s ? `${s.token} on ${s.chainLabel}` : "";
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
  initialAmount,
  label = "Recipient gets",
  onBack,
  onContinue,
}: {
  currency: SupportedCurrency;
  initialAmount?: number;
  label?: string;
  onBack?: () => void;
  onContinue: (amount: number, feeBreakdown: FeeBreakdown | undefined, ctx: { exchangeRate: number }) => void;
}) {
  const [localAmount, setLocalAmount] = useState(initialAmount ? String(initialAmount) : "");
  const symbol = CURRENCY_SYMBOLS[currency];
  const { data: feePreview, isLoading: feeLoading } = useOfframpFeePreview(currency, currency !== "USD");
  const { data: balanceData } = useAggregateBalance({ currency });

  // Everything that can pay out directly, across tokens and networks.
  const totalBalance = useMemo(() => {
    if (!balanceData?.breakdown) return 0;
    return balanceData.breakdown
      .filter((b) => SOURCE_CONFIGS.some((c) => c.token === b.token && c.chain === b.chain))
      .reduce((a, b) => a + b.amount, 0);
  }, [balanceData?.breakdown]);
  const exchangeRate = balanceData?.exchangeRate || 1;
  const buyingRate = feePreview?.buying_rate || feePreview?.rate || (currency === "USD" ? 1 : null);

  const maxPayableLocal = useMemo(() => {
    if (!feePreview || totalBalance <= 0) return 0;
    const rate = feePreview.buying_rate || feePreview.rate;
    const feePercent = (feePreview.feeBps || 100) / 10000;
    return Math.floor((totalBalance * rate) / (1 + feePercent));
  }, [feePreview, totalBalance]);

  const feeBreakdown = useMemo(() => {
    const amount = parseFloat(localAmount);
    if (!feePreview || isNaN(amount) || amount <= 0 || currency === "USD") return null;
    return calculateOfframpFeeBreakdown(amount, feePreview);
  }, [localAmount, feePreview, currency]);

  const entered = parseFloat(localAmount);
  const hasEntered = !!localAmount && !isNaN(entered) && entered > 0;
  const needed = feeBreakdown ? feeBreakdown.usdcNeeded : currency === "USD" ? entered : 0;
  const overTotal = hasEntered && !!balanceData && needed > totalBalance + 1e-9;
  const error = overTotal ? `That's more than your balance. You can send up to ${symbol} ${maxPayableLocal.toLocaleString()}.` : null;
  const usd = (n: number) => "$" + n.toFixed(2);

  const handleNext = () => {
    const amount = parseFloat(localAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (overTotal) {
      toast.error(`Insufficient balance. You need ${usd(needed)} but only have ${usd(totalBalance)}.`);
      return;
    }
    onContinue(amount, feeBreakdown || undefined, { exchangeRate });
  };

  return (
    <div>
      <Field label={label} htmlFor="offramp-amount" error={error || undefined} hint={maxPayableLocal > 0 ? `Up to ${symbol} ${maxPayableLocal.toLocaleString()}` : undefined}>
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
        {(QUICK_AMOUNTS[currency] || QUICK_AMOUNTS.KES).slice(0, 5).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setLocalAmount(String(v))}
            className={cn(
              "h-8 rounded-full px-3 text-[13px] font-medium tabular-numeric cursor-pointer",
              localAmount === String(v) ? "bg-teal-50 text-accent-primary ring-1 ring-accent-primary" : "bg-surface-subtle text-ink-2 hover:text-ink"
            )}
          >
            {v.toLocaleString()}
          </button>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface-subtle px-4 py-3 text-[13px]">
        <div>
          <dt className="text-ink-3">Rate</dt>
          <dd className="font-medium text-ink tabular-numeric">
            {feeLoading && currency !== "USD" ? "…" : buyingRate ? `1 USD = ${buyingRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">You pay</dt>
          <dd className="font-medium text-ink tabular-numeric">{needed > 0 ? usd(needed) : "—"}</dd>
        </div>
      </dl>
      <SectionActions onBack={onBack}>
        <Button onClick={handleNext} disabled={!hasEntered || !!error} size="lg">
          Continue
        </Button>
      </SectionActions>
    </div>
  );
}

/* ── Pay from (balance-driven) ─────────────────────────────────────── */

const offrampKey = (id?: OfframpSource) => {
  const c = SOURCE_CONFIGS.find((x) => x.id === id);
  return c ? sourceKey(c.chain, c.token) : undefined;
};
const offrampId = (key: string) => {
  const [chain, token] = key.split(":");
  return SOURCE_CONFIGS.find((c) => c.chain === chain && c.token === token)?.id;
};

/** First payout from a network must be ≥ $3 (it deploys the account there). */
function FirstSendCheck({ chain, usd, onState }: { chain: string; usd: number; onState: (blocked: string | null) => void }) {
  const { isDeployed, chainLabel } = useAccountDeployed(chain);
  const blocked = isDeployed !== true && usd > 0 && usd < 3 ? `Your first payout from ${chainLabel || chain} must be at least $3. It activates your account there.` : null;
  useEffect(() => onState(blocked), [blocked]);
  return blocked ? <span className="mt-1 block text-[12.5px] font-medium text-danger">{blocked}</span> : null;
}

export function OfframpSourceStep({
  currency,
  amount,
  feeBreakdown,
  value,
  onSelect,
  onBack,
  onContinue,
}: {
  currency: SupportedCurrency;
  amount: number;
  feeBreakdown?: FeeBreakdown;
  value?: OfframpSource;
  onSelect: (id: OfframpSource) => void;
  onBack?: () => void;
  onContinue: () => void;
}) {
  const { sources, isLoading, refetch } = useSources(currency);
  const symbol = CURRENCY_SYMBOLS[currency];
  const needed = feeBreakdown?.usdcNeeded ?? (currency === "USD" ? amount : 0);
  const usdAmount = feeBreakdown?.usdcAmount ?? (currency === "USD" ? amount : 0);
  const [blocked, setBlocked] = useState<string | null>(null);
  const selected = sources.find((s) => s.key === offrampKey(value));
  const canPayOut = (s: SourceOption) => !!offrampId(s.key);
  const usd = (n: number) => "$" + n.toFixed(2);

  const handleNext = () => {
    const cfg = SOURCE_CONFIGS.find((c) => c.id === value);
    if (!cfg || !selected) {
      toast.error("Choose a balance to pay from");
      return;
    }
    if (blocked) {
      toast.error(
        `Your first send from ${cfg.chainLabel} needs at least $3 (≈ ${symbol} ${Math.ceil(3 * (feeBreakdown?.exchangeRate || 1)).toLocaleString()}). This sets up your wallet on that network — receiving funds doesn't count. After this first one, any amount works.`
      );
      return;
    }
    if (selected.balance < needed) {
      toast.error(`Insufficient balance on ${cfg.chainLabel}. You need ${usd(needed)} but only have ${usd(selected.balance)}.`);
      return;
    }
    onContinue();
  };

  return (
    <div>
      <SmartSourcePicker
        needed={needed}
        neededLabel={usd(needed)}
        value={offrampKey(value)}
        onChange={(key) => {
          const id = offrampId(key);
          if (id) onSelect(id);
        }}
        allowed={canPayOut}
        sources={sources}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        tileExtra={(s) => <FirstSendCheck chain={s.chain} usd={usdAmount} onState={setBlocked} />}
      />
      <SectionActions onBack={onBack}>
        <Button size="lg" onClick={handleNext} disabled={!selected || selected.balance < needed || !!blocked}>
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
