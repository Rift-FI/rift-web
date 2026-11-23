/**
 * PREMIA building blocks, built from Rift's own system so these screens are
 * indistinguishable from the rest of the wallet by styling alone.
 *
 * The conventions borrowed from src/v2/ui: StatusPill's chip shape
 * (h-[22px] rounded-full px-2 text-[12px] + a 1.5px dot), CardHeader's
 * border-b px-5 py-4, the 2/3/4/6/8 spacing rhythm, hairline rings rather
 * than shadows, and tabular figures on every number.
 */
import { ReactNode, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtOddsPct, fmtPct, fmtPoints } from "@/v2/lib/premia/format";
import { DAILY_POINT_CAP, POINTS_RULE } from "@/v2/lib/premia/points";
import { MARKET_STATE, ORACLE_STATUS } from "@/v2/lib/premia/abi";
import { addressUrl } from "@/v2/lib/premia/config";
import type { MarketSnapshot, PricePoint } from "@/v2/lib/premia/types";

/* ── the standing beta marker ──────────────────────────────────────────── */

/**
 * "Beta", not "Test" — this is early access, not something broken.
 *
 * Together with the terms gate this is the whole standing disclosure, so it
 * appears on every PREMIA surface. Shaped exactly like the wallet's
 * StatusPill so it reads as a native status, not a sticker.
 */
export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      data-testid="premia-beta-badge"
      title="Beta: positions are in test tokens with no monetary value"
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full bg-teal-50 px-2 text-[12px] font-semibold text-accent-primary",
        className
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      Beta
    </span>
  );
}

/* ── Rise / Fall split bar ─────────────────────────────────────────────── */

export function OddsBar({ snap, size = "md" }: { snap: MarketSnapshot; size?: "sm" | "md" }) {
  // No oracle index ⇒ no honest mark. The curve still answers markPrice() with
  // its λ=0 placeholder (a flat 50%); showing that as odds would be a lie.
  if (snap.marksUnavailable) {
    return (
      <div className="w-full" data-testid="odds-bar">
        <div className={cn("flex items-center justify-between font-medium text-ink-3", size === "sm" ? "text-[12px]" : "text-[13px]")}>
          <span>{snap.def.riseLabel} —</span>
          <span>— {snap.def.fallLabel}</span>
        </div>
        <div className={cn("mt-2 overflow-hidden rounded-full bg-surface-subtle", size === "sm" ? "h-1.5" : "h-2")} />
      </div>
    );
  }
  // A 1%/99% pair is the normal state of a calm market, so the bar keeps a
  // visible sliver for the cheap side rather than collapsing to nothing.
  const risePct = Math.min(100, Math.max(0, snap.oddsRise * 100));
  const barRise = Math.min(98.5, Math.max(1.5, risePct));
  return (
    <div className="w-full" data-testid="odds-bar">
      <div className={cn("flex items-center justify-between font-semibold tabular-numeric", size === "sm" ? "text-[12px]" : "text-[13px]")}>
        <span className="flex items-center gap-1 text-success">
          <ArrowUpRight className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} /> {snap.def.riseLabel} {fmtOddsPct(snap.oddsRise)}
        </span>
        <span className="flex items-center gap-1 text-danger">
          {fmtOddsPct(snap.oddsFall)} {snap.def.fallLabel} <ArrowDownRight className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </span>
      </div>
      <div className={cn("mt-2 flex gap-0.5 overflow-hidden rounded-full bg-surface-subtle", size === "sm" ? "h-1.5" : "h-2")}>
        <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${barRise}%` }} />
        <div className="h-full flex-1 rounded-full bg-danger/70 transition-[width] duration-300" />
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

/**
 * Only renders when the state is worth knowing.
 *
 * An "Active" chip tells a trader nothing — if they can trade it, it is
 * active — so the tradeable state is silent and only frozen / closing-only
 * speaks up. Same shape as the wallet's StatusPill.
 */
export function MarketStateChip({ snap }: { snap: MarketSnapshot }) {
  if (!snap.live || snap.notDeployed || snap.marketState === undefined) return null;
  if (snap.marketState === 0) return null;
  const label = snap.marketState === 2 ? "Not yet open" : MARKET_STATE[snap.marketState];
  return (
    <span
      data-testid="market-state"
      className="inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full bg-tint-warning px-2 text-[12px] font-semibold text-warning"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

/** Oracle health, shown only when it is not healthy. */
export function OracleChip({ snap }: { snap: MarketSnapshot }) {
  if (!snap.live || snap.notDeployed || snap.oracleStatus === undefined) return null;
  if (snap.oracleStatus === 0 && !snap.oracleStale) return null;
  const label = snap.oracleStale ? "Feed stale" : `Feed ${(ORACLE_STATUS[snap.oracleStatus] ?? "unknown").toLowerCase()}`;
  return (
    <span
      data-testid="oracle-status"
      title={`${snap.oracleSources ?? 0} live sources`}
      className="inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full bg-tint-warning px-2 text-[12px] font-semibold text-warning"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

/* ── the single "How this works" disclosure ────────────────────────────── */

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
    <div className="mt-6 rounded-lg border border-hairline bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-[15px] font-semibold text-ink cursor-pointer"
      >
        How this works
        <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-hairline px-5 py-4 text-[13px] leading-relaxed text-ink-2">
          <p>
            {def.blurb} You buy units of {def.riseLabel} or {def.fallLabel}; the two sides' odds always add up to
            100%, and each unit pays out $1 if your side comes in. Cash out any time at the live price — there is no
            expiry.
          </p>
          <p>
            The index is how far {def.metricLabel.toLowerCase()} sits above its own slow baseline, not the raw
            reading. It starts paying once that clears {fmtPct(floor, 0)} and is capped at {fmtPct(cap, 0)}, which is
            why a calm market quotes {def.riseLabel} cheap.
          </p>
          <p>
            Your collateral is roughly the number of units you hold, because each unit locks $1 of backing on top of
            its price. Closing returns it plus the live value.
          </p>
          <p>
            <span className="font-medium text-ink">Points:</span> {POINTS_RULE} Capped at {fmtPoints(DAILY_POINT_CAP)}{" "}
            per wallet per day. The conversion rate at launch is not yet set.
          </p>
          {snap.address && (
            <p className="text-ink-3">
              Market{" "}
              <a
                href={addressUrl(snap.address)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-accent-primary hover:underline"
                data-testid="market-address"
              >
                {snap.address.slice(0, 10)}…{snap.address.slice(-6)}
              </a>{" "}
              on Base. Positions are in test tokens with no monetary value.
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
 * not offered on another origin, and WebAuthn reports that as the same
 * `NotAllowedError` the browser uses for "user cancelled" — so the generic
 * copy blames the user for a credential that was never going to appear.
 *
 * There is deliberately no API to ask "do I have a credential for this RP"
 * (it would be a fingerprinting vector), so this infers it.
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
    return `No passkey for ${window.location.hostname} — passkeys are tied to the domain they were created on, and yours is registered to ${configured}. Add one for this origin in Settings → Passkeys.`;
  }
  if (/FaucetCooldownActive/.test(raw)) return "You've already used this wallet's grant. One per 24h.";
  if (/TransferRestricted/.test(raw)) return "These tokens only move between your wallet and PREMIA.";
  if (/InsufficientFreeBalance/.test(raw)) return "Not enough free collateral.";
  if (/SlippageExceeded/.test(raw)) return "Price moved past your limit. Try again.";
  if (/OICapExceeded/.test(raw)) return "That size would breach the market's open-interest cap.";
  if (/RateLimitExceeded/.test(raw)) return "Too large a move for one day — try a smaller size.";
  if (/NewOIBlocked|NotActive/.test(raw)) return "This market isn't accepting new positions.";
  if (/ReserveExceeded/.test(raw)) return "The vault's reserve rule blocks that size right now.";
  if (/Sign in/.test(raw)) return "Sign in to approve this.";
  if (/ERC20InsufficientAllowance/.test(raw)) return "Approve the vault first.";
  return raw.length > 160 ? `${raw.slice(0, 160)}…` : raw;
}

/* ── labelled stat ─────────────────────────────────────────────────────── */

/**
 * The house figure: a quiet label over a tabular number.
 *
 * `explain` is a plain-language sentence shown on hover. Every number on
 * these screens needs one — "Index 0.59%" is meaningless without being told
 * what the index measures and what it has to clear to pay.
 */
export function Stat({
  label,
  children,
  hint,
  explain,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  explain?: string;
}) {
  return (
    <div className="min-w-0" title={explain}>
      <p className={cn("text-[12px] font-medium text-ink-3", explain && "cursor-help decoration-dotted underline-offset-4 hover:underline")}>
        {label}
      </p>
      <p className="mt-1 truncate text-[15px] font-semibold text-ink tabular-numeric">{children}</p>
      {hint && <p className="mt-0.5 text-[12px] text-ink-3 tabular-numeric">{hint}</p>}
    </div>
  );
}
