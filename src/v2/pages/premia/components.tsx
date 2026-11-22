/**
 * Small PREMIA building blocks, all token-driven so they sit natively next to
 * the rest of the Rift console.
 *
 * The standing disclosure surface is deliberately TWO things and nothing
 * more: the `TEST` badge below, and the one line of fine print under the
 * Trade button. Every explanatory paragraph that used to live on these
 * screens is either gone or behind {@link HowItWorks}.
 */
import { ReactNode, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtCents, fmtPct, fmtPoints } from "@/v2/lib/premia/format";
import { DAILY_POINT_CAP, POINTS_RULE } from "@/v2/lib/premia/points";
import { MARKET_STATE, ORACLE_STATUS } from "@/v2/lib/premia/abi";
import { addressUrl } from "@/v2/lib/premia/config";
import type { MarketSnapshot, PricePoint } from "@/v2/lib/premia/types";

/* ── the standing "not money" marker ───────────────────────────────────── */

/**
 * prmUSD has an open faucet and no monetary value. This badge is the terse
 * standing reminder of that on every PREMIA surface; the full sentence lives
 * once, under the Trade button.
 */
export function TestBadge({ className }: { className?: string }) {
  return (
    <span
      data-testid="premia-test-badge"
      title="prmUSD is a test token with no monetary value"
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
        "bg-warning/15 text-warning",
        className
      )}
    >
      Test
    </span>
  );
}

/* ── Rise / Fall split bar ─────────────────────────────────────────────── */

export function OddsBar({ snap, size = "md" }: { snap: MarketSnapshot; size?: "sm" | "md" }) {
  // No oracle index ⇒ no honest mark. The curve still answers markPrice() with
  // its λ=0 placeholder (a flat 50¢); showing that as odds would be a lie.
  if (snap.marksUnavailable) {
    return (
      <div className="w-full" data-testid="odds-bar">
        <div className={cn("flex items-center justify-between font-medium text-ink-3", size === "sm" ? "text-[12px]" : "text-[13px]")}>
          <span>{snap.def.riseLabel} —</span>
          <span>— {snap.def.fallLabel}</span>
        </div>
        <div className={cn("mt-1.5 overflow-hidden rounded-full bg-surface-subtle", size === "sm" ? "h-1.5" : "h-2")} />
      </div>
    );
  }
  // A 1¢/99¢ pair is the normal state of a calm market, so the bar keeps a
  // visible sliver for the cheap side rather than collapsing to nothing.
  const risePct = Math.min(100, Math.max(0, snap.oddsRise * 100));
  const barRise = Math.min(98.5, Math.max(1.5, risePct));
  return (
    <div className="w-full" data-testid="odds-bar">
      <div className={cn("flex items-center justify-between font-semibold tabular-numeric", size === "sm" ? "text-[12px]" : "text-[13px]")}>
        <span className="flex items-center gap-1 text-success">
          <ArrowUpRight className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} /> {snap.def.riseLabel} {fmtCents(snap.oddsRise)}
        </span>
        <span className="flex items-center gap-1 text-danger">
          {fmtCents(snap.oddsFall)} {snap.def.fallLabel} <ArrowDownRight className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </span>
      </div>
      <div className={cn("mt-1.5 flex overflow-hidden rounded-full bg-surface-subtle", size === "sm" ? "h-1.5" : "h-2")}>
        <div className="h-full bg-success/80 transition-[width] duration-500" style={{ width: `${barRise}%` }} />
        <div className="h-full bg-danger/70 transition-[width] duration-500" style={{ width: `${100 - barRise}%` }} />
      </div>
    </div>
  );
}

/* ── Sparkline ─────────────────────────────────────────────────────────── */

export function Sparkline({ points, className }: { points: PricePoint[]; className?: string }) {
  const { d, up } = useMemo(() => {
    const vals = points.slice(-40).map((p) => p.premium);
    if (vals.length < 2) return { d: "", up: true };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const step = 100 / (vals.length - 1);
    const d = vals
      .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(28 - ((v - min) / span) * 28).toFixed(2)}`)
      .join(" ");
    return { d, up: vals[vals.length - 1] >= vals[0] };
  }, [points]);
  if (!d) return null;
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden="true">
      <path d={d} fill="none" stroke={up ? "var(--color-success)" : "var(--color-danger)"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ── 24h delta chip ────────────────────────────────────────────────────── */

export function Delta({ now, prev }: { now: number; prev: number }) {
  const diff = now - prev;
  const up = diff >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-numeric", up ? "text-success" : "text-danger")}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {`${up ? "+" : "−"}${Math.abs(diff).toFixed(2)}pp`}
    </span>
  );
}

/* ── market / oracle state ─────────────────────────────────────────────── */

export function MarketStateChip({ snap }: { snap: MarketSnapshot }) {
  if (!snap.live || snap.notDeployed || snap.marketState === undefined) return null;
  const active = snap.marketState === 0;
  // A frozen market is a deliberate state, not a fault — say "Not yet open".
  const label = active ? MARKET_STATE[0] : snap.marketState === 2 ? "Not yet open" : MARKET_STATE[snap.marketState];
  return (
    <span
      data-testid="market-state"
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        active ? "bg-success/12 text-success" : "bg-surface-subtle text-ink-3"
      )}
    >
      {active && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
      {label}
    </span>
  );
}

export function OracleChip({ snap }: { snap: MarketSnapshot }) {
  if (!snap.live || snap.notDeployed || snap.oracleStatus === undefined) return null;
  const healthy = snap.oracleStatus === 0 && !snap.oracleStale;
  const label = snap.oracleStale ? "Stale" : ORACLE_STATUS[snap.oracleStatus] ?? "Unknown";
  return (
    <span
      data-testid="oracle-status"
      title={`${snap.oracleSources ?? 0} live sources`}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
        healthy ? "bg-surface-subtle text-ink-3" : "bg-warning/12 text-warning"
      )}
    >
      <ShieldCheck className="h-3 w-3" /> {label}
    </span>
  );
}

/* ── the single "How this works" disclosure ────────────────────────────── */

/**
 * Everything that used to be an explanatory paragraph on the market page.
 * Collapsed by default: a trader who already knows the product never sees it.
 */
export function HowItWorks({
  snap,
  open,
  onToggle,
}: {
  snap: MarketSnapshot;
  open: boolean;
  onToggle: () => void;
}) {
  const { def } = snap;
  const floor = snap.floorPct ?? def.floorPct;
  const cap = snap.capPct ?? def.capPct;
  return (
    <div className="mt-4 border-t border-hairline">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3 text-left text-[13px] font-medium text-ink-2 hover:text-ink cursor-pointer"
      >
        How this works
        <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-2.5 pb-4 text-[12.5px] leading-relaxed text-ink-2">
          <p>
            You buy units of {def.riseLabel} or {def.fallLabel}. Each unit settles somewhere between 0¢ and 100¢, and
            the two sides always cost 100¢ together. Cash out any time at the live price — there is no expiry.
          </p>
          <p>
            {def.blurb} The index is how far {def.metricLabel.toLowerCase()} sits above its own slow baseline, not the
            raw reading.
            It starts paying once that clears {fmtPct(floor, 0)} and is capped at {fmtPct(cap, 0)}, which is why a calm
            market quotes {def.riseLabel} cheap.
          </p>
          <p>
            Funding moves continuously between the two sides. Your collateral is roughly the number of units you hold,
            and closing returns it plus the live value.
          </p>
          <p>
            <span className="font-medium text-ink">Points:</span> {POINTS_RULE} Capped at {fmtPoints(DAILY_POINT_CAP)}{" "}
            per wallet per day. The conversion rate at launch is not yet set.
          </p>
          {snap.address && (
            <p className="text-ink-3">
              Market{" "}
              <a href={addressUrl(snap.address)} target="_blank" rel="noreferrer" className="font-mono text-accent-primary hover:underline" data-testid="market-address">
                {snap.address.slice(0, 10)}…{snap.address.slice(-6)}
              </a>{" "}
              on Base · collateral prmUSD, a test token with no value
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── errors ────────────────────────────────────────────────────────────── */

/**
 * Passkeys are bound to a domain. A credential enrolled on `riftfi.com` is
 * simply not offered on `localhost`, and WebAuthn reports that as the same
 * `NotAllowedError` the browser uses for "user cancelled" — so the generic
 * copy blames the user for a credential that was never going to appear.
 *
 * There is deliberately no API to ask "do I have a credential for this RP"
 * (it would be a fingerprinting vector), so this infers it: if the RP id this
 * origin can use is not the configured production one, a cancel here is far
 * more likely to be an absent credential than a real refusal.
 */
function rpMismatch(): boolean {
  if (typeof window === "undefined") return false;
  const configured = String(import.meta.env.VITE_PASSKEY_RP_ID ?? "").toLowerCase().trim();
  if (!configured) return false;
  const host = window.location.hostname.toLowerCase();
  return host !== configured && !host.endsWith(`.${configured}`);
}

/** Turn a contract/user-op error into something a trader can act on. */
export function cleanErr(e: unknown): string {
  const raw = (e as Error)?.message ?? String(e);
  if (/cancelled or timed out|NotAllowed/i.test(raw) && rpMismatch()) {
    const configured = String(import.meta.env.VITE_PASSKEY_RP_ID ?? "").trim();
    return `No passkey for ${window.location.hostname} — passkeys are tied to the domain they were created on, and yours is registered to ${configured}. Add one for this origin in Settings → Passkeys, or use ${configured}.`;
  }
  if (/FaucetCooldownActive/.test(raw)) return "You've already used this wallet's grant. One per 24h.";
  if (/TransferRestricted/.test(raw)) return "prmUSD only moves between your wallet and PREMIA.";
  if (/InsufficientFreeBalance/.test(raw)) return "Not enough free collateral.";
  if (/SlippageExceeded/.test(raw)) return "Price moved past your limit. Try again.";
  if (/OICapExceeded/.test(raw)) return "That size would breach the market's open-interest cap.";
  if (/RateLimitExceeded/.test(raw)) return "Too large a move for one day — try a smaller size.";
  if (/NewOIBlocked|NotActive/.test(raw)) return "This market isn't accepting new positions.";
  if (/ReserveExceeded/.test(raw)) return "The vault's reserve rule blocks that size right now.";
  if (/Sign in/.test(raw)) return "Sign in to approve this.";
  if (/ERC20InsufficientAllowance/.test(raw)) return "Approve prmUSD for the vault first.";
  return raw.length > 160 ? `${raw.slice(0, 160)}…` : raw;
}

/* ── labelled stat ─────────────────────────────────────────────────────── */

export function Stat({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">{label}</p>
      <p className="mt-0.5 truncate text-[15px] font-semibold text-ink tabular-numeric">{children}</p>
      {hint && <p className="text-[11.5px] text-ink-3">{hint}</p>}
    </div>
  );
}
