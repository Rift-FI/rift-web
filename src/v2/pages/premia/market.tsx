/**
 * PREMIA — one market.
 *
 * The question leads, the chart sits under it, the ticket is pinned beside it
 * on desktop and stacks on mobile. Built on the wallet's `Page` so the column
 * width and gutters match every other console screen.
 */
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { AlertTriangle, ChevronLeft, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/v2/ui";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtPct, fmtUsdCompact } from "@/v2/lib/premia/format";
import { PremiaChart } from "./chart";
import { TradePanel } from "./trade-panel";
import { PositionsTable } from "./positions-table";
import { BetaBadge, HowItWorks, MarketStateChip, OracleChip, Stat } from "./components";

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
    <Page width="wide">
      <Link
        to="/app/markets"
        className="-ml-1.5 mb-3 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-ink-3 transition-colors duration-150 hover:bg-surface-subtle hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Markets
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── the market ───────────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-ink-3">{def.tag}</span>
            <BetaBadge />
            <MarketStateChip snap={snap} />
            <OracleChip snap={snap} />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-surface-subtle text-[20px] ring-1 ring-hairline"
              >
                {def.flag}
              </span>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink lg:text-[28px]">
                {def.question}
              </h1>
            </div>
            <button
              type="button"
              onClick={share}
              aria-label="Copy link to this market"
              className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-ink-3 ring-1 ring-hairline transition-colors duration-150 hover:text-ink hover:ring-hairline-strong cursor-pointer"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {snap.blockedReason && (
            <p
              className="mt-4 flex items-start gap-2 rounded-md bg-tint-warning px-3 py-2.5 text-[13px] leading-relaxed text-warning"
              data-testid="market-blocked-banner"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{snap.blockedReason}</span>
            </p>
          )}

          <PremiaChart snap={snap} className="mt-6" />

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-hairline bg-card px-5 py-4 sm:grid-cols-4">
            <Stat label="Pays above">{fmtPct(snap.floorPct ?? def.floorPct, 0)}</Stat>
            <Stat label="Capped at">{fmtPct(snap.capPct ?? def.capPct, 0)}</Stat>
            <Stat
              label="Open interest"
              hint={<span data-testid="stat-oi-cap">of {fmtUsdCompact(live ? snap.oiCap ?? 0 : def.oiCapUsd)}</span>}
            >
              {fmtUsdCompact(live ? snap.openInterest ?? 0 : def.openInterestUsd)}
            </Stat>
            <Stat label="Payout now" hint={snap.payout === 0 ? "index below floor" : "per $1 unit"}>
              <span data-testid="stat-payout">
                {fmtPct(snap.payout * 100, snap.payout > 0 && snap.payout < 0.01 ? 2 : 0)}
              </span>
            </Stat>
          </dl>

          <HowItWorks snap={snap} open={how} onToggle={() => setHow((v) => !v)} />
        </div>

        {/* ── the ticket ───────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Trade">
          {quoting ? (
            <TradePanel snap={snap} />
          ) : (
            <div className="rounded-lg border border-hairline bg-card px-5 py-6 text-center" data-testid="trade-panel">
              <p className="text-[15px] font-semibold text-ink" data-testid="trade-panel-blocked">
                {snap.notDeployed ? "Not live yet" : (snap.marketState ?? 0) === 2 ? "Not yet open" : "Not quoting yet"}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
                {snap.blockedReason ?? snap.error ?? "This market has no contract on Base yet."}
              </p>
            </div>
          )}
        </aside>
      </div>

      <PositionsTable className="mt-8" marketId={def.id} />
    </Page>
  );
}
