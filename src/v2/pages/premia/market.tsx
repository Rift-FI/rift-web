/**
 * PREMIA — market page, Polymarket layout.
 *
 * Left: the question as the dominant element, category chips above it,
 * timeframe pills, a legend, and a probability chart. Right: the ticket.
 * Below: the trader's own positions.
 *
 * Prose is deliberately almost absent. Everything that used to be an
 * explanatory paragraph is either a tiny label, the one line of fine print
 * under the Trade button, or behind the single "How this works" link.
 */
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { AlertTriangle, ChevronLeft, Link2 } from "lucide-react";
import { toast } from "sonner";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtPct, fmtPrmCompact } from "@/v2/lib/premia/format";
import { PremiaChart } from "./chart";
import { TradePanel } from "./trade-panel";
import { PositionsTable } from "./positions-table";
import { MarketStateChip, TestBadge, HowItWorks } from "./components";

export default function PremiaMarket() {
  const { id } = useParams();
  const { snapshots, mode } = usePremia();
  const snap = id ? snapshots[id] : undefined;
  const [how, setHow] = useState(false);

  if (!snap) return <Navigate to="/app/markets" replace />;
  const { def } = snap;
  const live = mode === "live" && !!snap.live && !snap.notDeployed;
  const quoting = live && !snap.marksUnavailable;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-4 sm:px-6 lg:pt-6">
      <Link
        to="/app/markets"
        className="-ml-1.5 mb-3 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-ink-3 hover:bg-surface-subtle hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Markets
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_368px]">
        {/* ── left: the market ─────────────────────────────────────────── */}
        <div className="min-w-0">
          {/* category chips */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-3">{def.tag}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-3" />
            <TestBadge />
            <MarketStateChip snap={snap} />
          </div>

          {/* the question — the dominant element on the page */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-hairline bg-surface-subtle text-[22px]" aria-hidden="true">
                {def.flag}
              </span>
              <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[30px]">
                {def.question}
              </h1>
            </div>
            <button
              type="button"
              onClick={share}
              aria-label="Copy link to this market"
              className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-hairline text-ink-3 hover:border-hairline-strong hover:text-ink cursor-pointer"
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>
          {/* the one-line blurb moved into "How this works" — the question
              plus the figures below already say what this market is */}

          {snap.blockedReason && (
            <p
              className="mt-3 flex items-start gap-2 rounded-lg border border-hairline bg-warning/10 px-3 py-2 text-[12.5px] leading-relaxed text-warning"
              data-testid="market-blocked-banner"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{snap.blockedReason}</span>
            </p>
          )}

          <PremiaChart snap={snap} className="mt-4" />

          {/* the only remaining numbers strip: four, no sentences */}
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-hairline pt-3 sm:grid-cols-4">
            <Figure label="Pays above" value={fmtPct(snap.floorPct ?? def.floorPct, 0)} />
            <Figure label="Capped at" value={fmtPct(snap.capPct ?? def.capPct, 0)} />
            <Figure
              label="Open interest"
              value={live ? fmtPrmCompact(snap.openInterest ?? 0, false) : fmtPrmCompact(def.openInterestUsd, false)}
              hint={`of ${fmtPrmCompact(live ? snap.oiCap ?? 0 : def.oiCapUsd, false)}`}
              testId="stat-oi-cap"
            />
            <Figure
              label="Payout now"
              value={fmtPct(snap.payout * 100, snap.payout > 0 && snap.payout < 0.01 ? 2 : 0)}
              testId="stat-payout"
            />
          </dl>

          <HowItWorks snap={snap} open={how} onToggle={() => setHow((v) => !v)} />
        </div>

        {/* ── right: the ticket ────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-4 lg:self-start" aria-label="Trade">
          {quoting ? (
            <TradePanel snap={snap} />
          ) : (
            <div className="rounded-xl border border-hairline bg-card p-4 text-center" data-testid="trade-panel">
              <p className="text-[14px] font-semibold text-ink" data-testid="trade-panel-blocked">
                {snap.notDeployed ? "Not live yet" : (snap.marketState ?? 0) === 2 ? "Not yet open" : "Not quoting yet"}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
                {snap.blockedReason ?? snap.error ?? "This market has no contract on Base yet."}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ── the trader's own positions ───────────────────────────────── */}
      <PositionsTable className="mt-8" marketId={def.id} />
    </div>
  );
}

function Figure({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  testId?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">{label}</dt>
      <dd className="mt-0.5 truncate text-[16px] font-semibold text-ink tabular-numeric" data-testid={testId}>
        {value}
        {hint && <span className="ml-1 text-[12px] font-normal text-ink-3">{hint}</span>}
      </dd>
    </div>
  );
}
