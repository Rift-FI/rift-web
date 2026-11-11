import { ReactNode, useEffect, useId, useState } from "react";
import { lpPath } from "@/v2/lib/lpHost";
import { Link } from "react-router";
import { ArrowLeftRight, ArrowRight, Building2, CalendarClock, Coins, ShieldOff, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, INPUT_CLASS, Skeleton } from "@/v2/ui";
import { Flag, currencyMeta } from "@/v2/ui/currency-picker";
import {
  LP_FEE_RATE,
  directionLabel,
  estimateEarnings,
  fmtDate,
  fmtPct,
  fmtUsd,
  fmtUsdSmall,
  useLpActivity,
  type LpPool,
} from "@/v2/lib/lp";

/* ── Pool stats ────────────────────────────────────────────────────── */

function Stat({ label, value, hint, testId, loading }: { label: ReactNode; value: ReactNode; hint?: ReactNode; testId?: string; loading?: boolean }) {
  return (
    <div className="min-w-0 px-5 py-4" data-testid={testId}>
      <dt className="text-[12.5px] font-medium text-ink-3">{label}</dt>
      <dd className="mt-1 truncate text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink tabular-numeric">
        {loading ? <Skeleton className="mt-1 h-6 w-24" /> : value}
      </dd>
      {hint && <dd className="mt-0.5 text-[12px] text-ink-3">{hint}</dd>}
    </div>
  );
}

export function PoolStats({ pool, loading, error, onRetry }: { pool?: LpPool; loading: boolean; error: boolean; onRetry: () => void }) {
  if (error && !pool)
    return (
      <Card className="px-5 py-8 text-center" data-testid="lp-pool-error">
        <p className="text-[14px] text-ink-3">
          Pool figures aren{"’"}t available right now.{" "}
          <button type="button" onClick={onRetry} className="cursor-pointer font-medium text-accent-primary hover:underline">
            Retry
          </button>
        </p>
      </Card>
    );
  const p = pool;
  const turnover = p?.turnover30d;
  return (
    <Card as="div" className="overflow-hidden" data-testid="lp-pool-stats">
      <dl className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3 [&>div]:bg-card">
        <Stat label="In the pool" value={fmtUsd(p?.totalUsd, 0)} testId="lp-stat-total" loading={loading} />
        <Stat label="Providers" value={p?.providers ?? "—"} testId="lp-stat-providers" loading={loading} />
        <Stat label="Volume, 30 days" value={fmtUsd(p?.volume30dUsd, 0)} testId="lp-stat-volume" loading={loading} />
        <Stat label="Paid to LPs, 30 days" value={fmtUsd(p?.lpFees30dUsd)} testId="lp-stat-fees" loading={loading} />
        <Stat
          label="Turnover, 30 days"
          value={turnover === null || turnover === undefined ? "—" : `${turnover.toFixed(2)}×`}
          hint="Volume ÷ average pool size"
          testId="lp-stat-turnover"
          loading={loading}
        />
        <Stat label="Estimated APY" value={fmtPct(p?.estApy)} hint="Estimate from the last 30 days. Not a promise." testId="lp-stat-apy" loading={loading} />
      </dl>
      {p?.updatedAt && <p className="border-t border-hairline px-5 py-2.5 text-[12px] text-ink-3">Updated {new Date(p.updatedAt).toLocaleString()}</p>}
    </Card>
  );
}

/* ── How it works ──────────────────────────────────────────────────── */

export function HowItWorks({ lockDays }: { lockDays: number }) {
  const steps = [
    { title: "Deposit", body: `Add USDC or USDT (Base, Ethereum, Polygon or Arbitrum), or local money. Each deposit is locked for ${lockDays} days.` },
    { title: "Your money pays people", body: "Rift uses the pool to pay out and settle mobile money. Each time it does, 0.30% of that payment goes to LPs, split by pool share." },
    { title: "Get paid monthly", body: `Earnings add up per payment and are paid out each month. After ${lockDays} days you can ask for your deposit back.` },
  ];
  return (
    <ol className="grid grid-cols-1 gap-3 md:grid-cols-3" data-testid="lp-how">
      {steps.map((s, i) => (
        <li key={s.title} className="rounded-lg border border-hairline bg-card px-5 py-5">
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full border border-hairline-strong text-[12.5px] font-semibold text-ink-2 tabular-numeric">
            {i + 1}
          </span>
          <h3 className="mt-3 text-[15px] font-semibold text-ink">{s.title}</h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

/* ── Calculator ────────────────────────────────────────────────────── */

const MAX_TURNOVER = 10;

export function EarningsCalculator({ defaultTurnover }: { defaultTurnover?: number | null }) {
  const amountId = useId();
  const turnoverId = useId();
  const [amount, setAmount] = useState("1000");
  const initial = defaultTurnover && defaultTurnover > 0 ? Math.min(MAX_TURNOVER, Math.round(defaultTurnover * 10) / 10) : 1;
  const [turnover, setTurnover] = useState(String(initial));
  const [touched, setTouched] = useState(false);
  // Follow the live pool figure until the user picks their own.
  useEffect(() => {
    if (!touched && defaultTurnover && defaultTurnover > 0) setTurnover(String(Math.min(MAX_TURNOVER, Math.round(defaultTurnover * 10) / 10)));
  }, [defaultTurnover, touched]);

  const amt = Number(amount.replace(/,/g, ""));
  const t = Number(turnover);
  const { monthly, yearly, apy } = estimateEarnings(amt, t);

  return (
    <Card as="div" className="p-5 sm:p-6" data-testid="lp-calculator">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={amountId} className="block text-[13px] font-medium text-ink-2">
            Deposit (USD)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-ink-3">$</span>
            <input
              id={amountId}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
              data-testid="lp-calc-amount"
              className={cn(INPUT_CLASS, "pl-7 text-[17px] font-semibold tabular-numeric")}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={turnoverId} className="block text-[13px] font-medium text-ink-2">
            Assumed monthly turnover
          </label>
          <div className="relative">
            <input
              id={turnoverId}
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_TURNOVER}
              step={0.1}
              value={turnover}
              onChange={(e) => {
                setTouched(true);
                setTurnover(e.target.value);
              }}
              data-testid="lp-calc-turnover"
              className={cn(INPUT_CLASS, "pr-8 text-[17px] font-semibold tabular-numeric")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[15px] text-ink-3">×</span>
          </div>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={MAX_TURNOVER}
        step={0.1}
        value={Number.isFinite(t) ? Math.min(MAX_TURNOVER, Math.max(0, t)) : 0}
        onChange={(e) => {
          setTouched(true);
          setTurnover(e.target.value);
        }}
        aria-label="Assumed monthly turnover slider"
        className="mt-4 w-full cursor-pointer accent-[var(--color-accent-solid)]"
      />
      <div className="mt-1 flex justify-between text-[11.5px] text-ink-3 tabular-numeric" aria-hidden="true">
        <span>0×</span>
        <span>{MAX_TURNOVER}×</span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-5" aria-live="polite">
        <div>
          <dt className="text-[12.5px] font-medium text-ink-3">Est. per month</dt>
          <dd className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-ink tabular-numeric" data-testid="lp-calc-monthly">
            {fmtUsd(monthly)}
          </dd>
        </div>
        <div>
          <dt className="text-[12.5px] font-medium text-ink-3">Est. per year</dt>
          <dd className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-ink tabular-numeric" data-testid="lp-calc-yearly">
            {fmtUsd(yearly)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[12.5px] text-ink-3">≈ {fmtPct(apy)} a year at this turnover, before any losses.</p>
      <p className="mt-3 rounded-md bg-tint-pending px-3 py-2 text-[12.5px] leading-relaxed text-pending" data-testid="lp-calc-note">
        This is an estimate, not a promise. If no payments use the pool, you earn nothing. Past turnover doesn{"’"}t predict future turnover.
      </p>
    </Card>
  );
}

/* ── Risks ─────────────────────────────────────────────────────────── */

const RISKS = [
  { icon: Building2, title: "Held by a third party", body: "Pool money sits in Rift's account with Pretium, our payments partner. If Pretium or Rift fails, you may not get it all back." },
  { icon: ArrowLeftRight, title: "Currency risk on local float", body: "Part of the pool is held as local currency (TZS, GHS, MWK) to pay people out. Exchange rates can move against it." },
  { icon: ShieldOff, title: "Not a bank deposit, not insured", body: "No deposit insurance or government scheme covers this money." },
  { icon: TrendingDown, title: "You can lose money", body: "Operational problems, smart-contract bugs or new regulation could reduce or freeze what you put in." },
];

export function Risks() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="lp-risks">
      {RISKS.map((r) => (
        <li key={r.title} className="flex gap-3 rounded-lg border border-hairline bg-card px-5 py-4">
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-tint-danger text-danger">
            <r.icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[14.5px] font-semibold text-ink">{r.title}</h3>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-3">{r.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Recent pool usage (anonymous) ─────────────────────────────────── */

export function PoolActivity() {
  const { data, isLoading, isError } = useLpActivity();
  if (isError) return null;
  return (
    <Card as="div" data-testid="lp-pool-activity">
      {isLoading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="px-5 py-8 text-center text-[14px] text-ink-3">No payments have used the pool yet.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {data.map((a, i) => (
            <li key={`${a.at}-${i}`} className="flex items-center gap-3 px-5 py-3">
              <Flag iso={currencyMeta(a.corridor).iso} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">
                  {directionLabel(a.direction)} · {a.corridor || "—"}
                </p>
                <p className="text-[12.5px] text-ink-3">{fmtDate(a.at)}</p>
              </div>
              <div className="text-right tabular-numeric">
                <p className="text-[14px] text-ink">{fmtUsd(a.volumeUsd)}</p>
                <p className="text-[12.5px] text-success">+{fmtUsdSmall(a.lpFeeUsd)} to LPs</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ── Section wrapper ───────────────────────────────────────────────── */

export function Section({ id, title, intro, children, aside }: { id: string; title: string; intro?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12 lg:mt-16">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[620px]">
          <h2 id={id} className="text-[19px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h2>
          {intro && <p className="mt-1 text-[14px] leading-relaxed text-ink-3">{intro}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Everything a visitor needs to decide, signed in or not. */
export function PoolOverview({
  pool,
  poolLoading,
  poolError,
  onRetry,
  cta,
  hero = true,
}: {
  pool?: LpPool;
  poolLoading: boolean;
  poolError: boolean;
  onRetry: () => void;
  cta?: ReactNode;
  hero?: boolean;
}) {
  const lockDays = pool?.lockDays ?? 30;
  const feePct = ((pool?.lpFeeBps ?? LP_FEE_RATE * 10_000) / 100).toFixed(2);
  return (
    <div data-testid="lp-overview">
      {hero && (
        <section aria-labelledby="lp-hero" className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-12">
          <div className="lg:pt-4">
            <h1 id="lp-hero" className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[36px]">
              Earn from the payments
              <br className="hidden sm:block" /> Rift moves
            </h1>
            <p className="mt-4 max-w-[460px] text-[15.5px] leading-relaxed text-ink-2">
              Lend stablecoins to the float Rift uses to pay out mobile money. When a payment uses the pool, {feePct}% of it is shared among
              liquidity providers by pool share.
            </p>
            <ul className="mt-5 space-y-2 text-[14px] text-ink-2">
              <li className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-accent-primary" aria-hidden="true" />
                Each deposit is locked {lockDays} days, then withdrawable on request
              </li>
              <li className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-accent-primary" aria-hidden="true" />
                Earnings paid monthly
              </li>
            </ul>
            {cta && <div className="mt-6 flex flex-col gap-2 sm:flex-row">{cta}</div>}
          </div>
          <PoolStats pool={pool} loading={poolLoading} error={poolError} onRetry={onRetry} />
        </section>
      )}
      {!hero && <PoolStats pool={pool} loading={poolLoading} error={poolError} onRetry={onRetry} />}

      <Section id="lp-how-title" title="How it works">
        <HowItWorks lockDays={lockDays} />
      </Section>

      <Section
        id="lp-earn-title"
        title="What you could earn"
        intro={
          <>
            <span className="font-medium text-ink" data-testid="lp-formula">
              Monthly earnings ≈ your deposit × {feePct}% × monthly turnover.
            </span>{" "}
            Turnover is how many times the pool{"’"}s value moves through payments in a month.
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <EarningsCalculator defaultTurnover={pool?.turnover30d} />
          <div>
            <h3 className="mb-2 text-[13px] font-medium text-ink-2">Recent pool usage</h3>
            <PoolActivity />
          </div>
        </div>
      </Section>

      <Section id="lp-risks-title" title="Risks" intro="Read these before you put money in. The full terms cover them in detail.">
        <Risks />
      </Section>

      <Section id="lp-terms-title" title="Lock and payouts">
        <Card as="div" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[640px] text-[14px] leading-relaxed text-ink-2">
            Each deposit is locked for <strong className="font-semibold text-ink">{lockDays} days</strong> from when it{"’"}s credited. After that you can
            request a withdrawal at any time. Earnings are added up per payment and <strong className="font-semibold text-ink">paid monthly</strong>.
            You must accept the LP Terms before your first deposit.
          </p>
          <Link to={lpPath("/terms")} className="inline-flex flex-shrink-0 items-center gap-1.5 text-[14px] font-semibold text-accent-primary hover:underline" data-testid="lp-terms-link">
            Read the full LP Terms
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      </Section>
    </div>
  );
}

