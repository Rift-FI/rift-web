/**
 * PREMIA — Markets. A grid of questions, on the wallet's own page furniture.
 *
 * Uses `Page` and `PageHeader` so the column width, gutters and title
 * treatment match every other console screen. The wallet's documented rule is
 * "titles stand alone: no eyebrows or explanatory sub-headings" — the only
 * thing beside the title is the Beta badge, which is a standing disclosure
 * rather than decoration.
 */
import { Link } from "react-router";
import { Wallet } from "lucide-react";
import { Page, PageHeader, Skeleton } from "@/v2/ui";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtPoints, fmtUsd } from "@/v2/lib/premia/format";
import { MarketCard } from "./market-card";
import { BetaGate } from "./beta-gate";
import { BetaBadge } from "./components";

export default function PremiaMarkets() {
  const { markets, snapshots, portfolio, mode, loading, points } = usePremia();
  const live = mode === "live";
  const funded = portfolio.prmUSD > 0;

  return (
    <Page width="default">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            Markets
            <BetaBadge />
          </span>
        }
        actions={
          <>
            {funded && (
              <span className="text-[13px] font-medium text-ink-2 tabular-numeric" data-testid="premia-balance">
                {fmtUsd(portfolio.prmUSD)}
              </span>
            )}
            {live && points.points > 0 && (
              <span className="text-[13px] text-ink-3 tabular-numeric" data-testid="premia-header-points">
                {points.complete ? "" : "≥ "}
                {fmtPoints(points.points)} pts
              </span>
            )}
            <Link
              to="/app/portfolio"
              data-testid="premia-portfolio-link"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-hairline-strong bg-card px-4 text-[14px] font-semibold text-ink transition-colors duration-150 hover:bg-surface-subtle"
            >
              <Wallet className="h-4 w-4 text-accent-primary" aria-hidden="true" />
              Portfolio
              {portfolio.positions.length > 0 && (
                <span className="min-w-5 rounded-full bg-accent-solid px-1.5 text-center text-[12px] font-semibold leading-5 text-white tabular-numeric">
                  {portfolio.positions.length}
                </span>
              )}
            </Link>
          </>
        }
      />

      {/* one call to action for a wallet that can't trade yet */}
      {live && !funded && (
        <div className="mb-6 max-w-[420px]">
          <BetaGate />
        </div>
      )}

      {loading && !snapshots[markets[0]?.id]?.live ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="premia-market-grid">
          <Skeleton className="h-[232px] rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="premia-market-grid">
          {markets.map((m) => (snapshots[m.id] ? <MarketCard key={m.id} snap={snapshots[m.id]} /> : null))}
        </div>
      )}
    </Page>
  );
}
