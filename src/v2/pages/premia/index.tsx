/**
 * PREMIA — Markets. A grid of questions.
 *
 * An unfunded wallet sees exactly one call to action: Request beta. Everything
 * else that used to be here (funding stepper, explanatory paragraphs, a
 * persistent banner) is gone; the standing disclosure is the TEST badge plus
 * the line under the Trade button.
 */
import { Link } from "react-router";
import { Loader2, Wallet } from "lucide-react";
import { Page } from "@/v2/ui";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtPoints, fmtPrm } from "@/v2/lib/premia/format";
import { MarketCard } from "./market-card";
import { BetaGate } from "./beta-gate";
import { TestBadge } from "./components";

export default function PremiaMarkets() {
  const { markets, snapshots, portfolio, mode, loading, points } = usePremia();
  const live = mode === "live";
  const funded = portfolio.prmUSD > 0;

  return (
    <Page width="wide">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-accent-primary">PREMIA</span>
            <TestBadge />
            {/* The subtitle that used to live here ("N live on Base · X
                capacity") was three facts nobody asked for, above a page with
                one market on it. The market card carries what matters. */}
            {loading && <Loader2 className="h-3 w-3 animate-spin text-ink-3" data-testid="premia-header-stats" />}
            {live && points.points > 0 && (
              <span className="text-[12px] text-ink-3 tabular-numeric" data-testid="premia-header-points">
                · {points.complete ? "" : "≥ "}
                {fmtPoints(points.points)} points
              </span>
            )}
          </div>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink">Markets</h1>
        </div>

        <div className="flex items-center gap-2">
          {funded && (
            <span className="text-[12.5px] text-ink-3 tabular-numeric" data-testid="premia-balance">
              {fmtPrm(portfolio.prmUSD, 2)}
            </span>
          )}
          <Link
            to="/app/portfolio"
            data-testid="premia-portfolio-link"
            className="inline-flex h-9 flex-shrink-0 items-center gap-2 self-start rounded-md border border-hairline bg-card px-3.5 text-[13.5px] font-semibold text-ink hover:bg-surface-subtle"
          >
            <Wallet className="h-4 w-4 text-accent-primary" />
            Portfolio
            {portfolio.positions.length > 0 && (
              <span className="min-w-5 rounded-full bg-accent-solid px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
                {portfolio.positions.length}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* one call to action for a wallet that can't trade yet */}
      {live && !funded && (
        <div className="mb-5 max-w-md">
          <BetaGate />
        </div>
      )}

      <div className="grid max-w-[920px] grid-cols-1 gap-3 sm:grid-cols-2" data-testid="premia-market-grid">
        {markets.map((m) => (snapshots[m.id] ? <MarketCard key={m.id} snap={snapshots[m.id]} /> : null))}
      </div>
    </Page>
  );
}
