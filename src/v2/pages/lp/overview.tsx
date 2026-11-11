import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/v2/ui";
import { Flag, currencyMeta } from "@/v2/ui/currency-picker";
import { lpPath } from "@/v2/lib/lpHost";
import { LP_FEE_RATE, directionLabel, estimateEarnings, fmtPct, fmtUsd, fmtUsdSmall, poolApy, useLpActivity, type LpPool } from "@/v2/lib/lp";

/* ── Primitives ────────────────────────────────────────────────────── */

/** A bordered terminal panel. */
export function Panel({ children, className, ...rest }: { children: ReactNode; className?: string } & Record<string, unknown>) {
  return (
    <div className={cn("min-w-0 rounded-md border border-hairline bg-card", className)} {...rest}>
      {children}
    </div>
  );
}

/** Label / value row (ticket, account). */
export function KV({ label, children, testId, strong, sub }: { label: ReactNode; children: ReactNode; testId?: string; strong?: boolean; sub?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[5px] text-[12.5px]">
      <dt className="flex items-center gap-1 text-ink-3">{label}</dt>
      <dd className={cn("min-w-0 text-right tabular-numeric", strong ? "font-semibold text-ink" : "text-ink")} data-testid={testId}>
        {children}
        {sub && <span className="block text-[11px] text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}

/** Dense table; scrolls sideways inside itself on small screens. */
export function DataTable({ head, children, testId, empty, align }: { head: string[]; children: ReactNode; testId?: string; empty?: string | null; align?: ("l" | "r")[] }) {
  return (
    <div className="overflow-x-auto" data-testid={testId}>
      {empty ? (
        <p className="px-3 py-8 text-center text-[12.5px] text-ink-3">{empty}</p>
      ) : (
        <table className="w-full min-w-[520px] text-[12.5px]">
          <thead>
            <tr className="text-ink-3">
              {head.map((h, i) => (
                <th key={h} scope="col" className={cn("h-8 whitespace-nowrap px-3 font-normal", (align?.[i] ?? (i === 0 ? "l" : "r")) === "l" ? "text-left" : "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:hover]:bg-surface-subtle [&>tr>td]:h-9 [&>tr>td]:whitespace-nowrap [&>tr>td]:px-3 [&>tr>td]:tabular-numeric">{children}</tbody>
        </table>
      )}
    </div>
  );
}

export const timeOf = (iso?: string | null) => {
  const d = new Date(iso ?? "");
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
};

/* ── Stats strip ───────────────────────────────────────────────────── */

function Stat({ label, value, testId, loading, tone }: { label: string; value: ReactNode; testId: string; loading?: boolean; tone?: "accent" }) {
  return (
    <div className="flex-shrink-0 px-4 py-1.5" data-testid={testId}>
      <dt className="whitespace-nowrap text-[11.5px] text-ink-3">{label}</dt>
      <dd className={cn("mt-0.5 whitespace-nowrap text-[13.5px] font-medium tabular-numeric", tone === "accent" ? "text-accent-primary" : "text-ink")}>
        {loading ? <Skeleton className="h-4 w-16" /> : value}
      </dd>
    </div>
  );
}

export function StatsStrip({ pool, loading, error, onRetry }: { pool?: LpPool; loading: boolean; error: boolean; onRetry: () => void }) {
  const apy = poolApy(pool);
  return (
    <Panel className="flex items-center overflow-hidden" data-testid="lp-pool-stats">
      <div className="flex flex-shrink-0 items-center gap-2.5 border-r border-hairline py-2 pl-3 pr-4">
        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-[12px] font-bold text-accent-primary">
          $
        </span>
        <div className="leading-tight">
          <h1 className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] text-ink">Yield Pool</h1>
          <p className="whitespace-nowrap text-[11px] text-ink-3">USDC · USDT</p>
        </div>
      </div>
      {error && !pool ? (
        <p className="px-4 py-3 text-[12.5px] text-ink-3" data-testid="lp-pool-error">
          Pool data unavailable.{" "}
          <button type="button" onClick={onRetry} className="cursor-pointer font-medium text-accent-primary hover:underline">
            Retry
          </button>
        </p>
      ) : (
        <dl className="flex min-w-0 flex-1 items-center overflow-x-auto [&>div+div]:border-l [&>div+div]:border-hairline" aria-label="Pool figures">
          <Stat label="Pool TVL" value={fmtUsd(pool?.totalUsd, 0)} testId="lp-stat-total" loading={loading} />
          <Stat label="Payments 30d" value={fmtUsd(pool?.eligibleVolume30dUsd ?? pool?.volume30dUsd, 0)} testId="lp-stat-volume" loading={loading} />
          <Stat label="Paid to LPs 30d" value={fmtUsd(pool?.lpFees30dUsd)} testId="lp-stat-fees" loading={loading} />
          <Stat label="Est. APY 30d" value={apy === null ? "—" : fmtPct(apy, 2)} testId="lp-stat-apy" loading={loading} tone="accent" />
          <Stat label="LPs" value={pool?.providers ?? "—"} testId="lp-stat-providers" loading={loading} />
          <Stat label="Lock" value={`${pool?.lockDays ?? 30}d`} testId="lp-stat-lock" loading={loading} />
        </dl>
      )}
    </Panel>
  );
}

/* ── Ticket: deposit estimate ──────────────────────────────────────── */

const QUICK = [1_000, 5_000, 10_000, 50_000];
const pct = (x: number) => `${(x * 100).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`;
const compact = (q: number) => (q >= 1000 ? `$${q / 1000}k` : `$${q}`);

function InfoTip({ text, testId }: { text: string; testId: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label="How it's calculated"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        data-testid={`${testId}-info`}
        className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        <Info className="h-3 w-3" aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        data-testid={testId}
        className={cn(
          "absolute bottom-full left-0 z-30 mb-1.5 w-[230px] rounded-md border border-hairline-strong bg-card px-2.5 py-2 text-left text-[11.5px] leading-snug text-ink-2 shadow-lg",
          open ? "block" : "hidden"
        )}
      >
        {text}
      </span>
    </span>
  );
}

/** Amount in → share, monthly, yearly, APY out. Everything else from the live pool. */
export function DepositEstimate({ pool, loading }: { pool?: LpPool; loading?: boolean }) {
  const inputId = useId();
  const [amount, setAmount] = useState("1000");
  const feePct = ((pool?.lpFeeBps ?? LP_FEE_RATE * 10_000) / 100).toFixed(2);
  const amt = Number(amount.replace(/,/g, ""));
  const e = estimateEarnings(amt, { totalUsd: pool?.totalUsd, volumeUsd: pool?.eligibleVolume30dUsd ?? pool?.volume30dUsd });
  const v = (x: ReactNode) => (loading ? <Skeleton className="ml-auto h-3.5 w-14" /> : x);

  return (
    <div data-testid="lp-calculator">
      <label htmlFor={inputId} className="sr-only">
        Amount in USD
      </label>
      <div className="flex h-10 items-center rounded-md border border-hairline-strong bg-canvas px-3 focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/25">
        <span className="text-[12.5px] text-ink-3">Amount</span>
        <input
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(ev) => setAmount(ev.target.value.replace(/[^0-9.,]/g, ""))}
          data-testid="lp-calc-amount"
          className="min-w-0 flex-1 bg-transparent px-2 text-right text-[14px] font-medium text-ink tabular-numeric outline-none"
        />
        <span className="text-[12.5px] font-medium text-ink-2">USD</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(String(q))}
            data-testid={`lp-calc-quick-${q}`}
            aria-pressed={amt === q}
            className={cn(
              "h-7 cursor-pointer rounded border text-[11.5px] font-medium tabular-numeric transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
              amt === q ? "border-accent-primary text-accent-primary" : "border-hairline text-ink-3 hover:text-ink"
            )}
          >
            {compact(q)}
          </button>
        ))}
      </div>
      <dl className="mt-3" aria-live="polite">
        <KV label="Pool share" testId="lp-calc-share">
          {v(pct(e.share))}
        </KV>
        <KV label="Est. / month" testId="lp-calc-monthly">
          {v(fmtUsd(e.monthly))}
        </KV>
        <KV label="Est. / year" testId="lp-calc-yearly">
          {v(fmtUsd(e.yearly))}
        </KV>
        <KV
          label={
            <>
              Est. APY
              <InfoTip testId="lp-formula" text={`Per month = ${feePct}% × last 30 days' payments (${fmtUsd(e.volume, 0)}) × your share of the pool.`} />
            </>
          }
          testId="lp-calc-apy"
          strong
        >
          {v(<span className="text-accent-primary">{pct(e.apy)}</span>)}
        </KV>
        <KV label="Lock">{pool?.lockDays ?? 30} days</KV>
        <KV label="Payouts">Monthly</KV>
      </dl>
      <p className="mt-1 text-[11px] text-ink-3" data-testid="lp-calc-note">
        {e.volume > 0 ? "Based on the last 30 days. Not a promise." : "No payments in the last 30 days, so the estimate is zero."}
      </p>
    </div>
  );
}

/* ── Pool activity + risks (bottom tabs) ───────────────────────────── */

export function PoolActivityTable() {
  const { data, isLoading, isError, refetch } = useLpActivity();
  if (isLoading)
    return (
      <div className="space-y-2 p-3" data-testid="lp-pool-activity">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  if (isError)
    return (
      <p className="px-3 py-8 text-center text-[12.5px] text-ink-3" data-testid="lp-pool-activity">
        Activity unavailable.{" "}
        <button type="button" onClick={() => refetch()} className="cursor-pointer font-medium text-accent-primary hover:underline">
          Retry
        </button>
      </p>
    );
  return (
    <DataTable testId="lp-pool-activity" head={["Time", "Corridor", "Type", "Volume", "To LPs"]} align={["l", "l", "l", "r", "r"]} empty={data?.length ? null : "No payments have used the pool yet."}>
      {(data ?? []).map((a, i) => (
        <tr key={`${a.at}-${i}`} data-testid="lp-activity-row">
          <td className="text-ink-3">{timeOf(a.at)}</td>
          <td>
            <span className="inline-flex items-center gap-1.5 text-ink">
              <Flag iso={currencyMeta(a.corridor).iso} className="h-3.5 w-3.5" />
              {a.corridor || "—"}
            </span>
          </td>
          <td className="text-ink-2">{directionLabel(a.direction)}</td>
          <td className="text-right text-ink">{fmtUsd(a.volumeUsd)}</td>
          <td className="text-right text-success">+{fmtUsdSmall(a.lpFeeUsd)}</td>
        </tr>
      ))}
    </DataTable>
  );
}

const RISKS = [
  { title: "Held by a third party", body: "Pool money sits in Rift's account with a payments partner. If it or Rift fails, you may not get it all back." },
  { title: "Currency risk", body: "Part of the pool is held as local currency (TZS, GHS, MWK) and can lose value." },
  { title: "Not a bank deposit, not insured", body: "No deposit insurance or government scheme covers it." },
  { title: "You can lose money", body: "Operational problems, bugs or regulation could reduce or freeze funds." },
];

export function RisksList() {
  return (
    <div data-testid="lp-risks">
      <ul className="divide-y divide-hairline">
        {RISKS.map((r) => (
          <li key={r.title} className="flex flex-col gap-0.5 px-3 py-2 text-[12.5px] sm:flex-row sm:gap-3">
            <span className="flex-shrink-0 font-medium text-ink sm:w-[220px]">{r.title}</span>
            <span className="text-ink-3">{r.body}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-hairline px-3 py-2.5">
        <Link to={lpPath("/terms")} data-testid="lp-risks-terms" className="text-[12.5px] font-medium text-accent-primary hover:underline">
          Read the full LP Terms →
        </Link>
      </div>
    </div>
  );
}
