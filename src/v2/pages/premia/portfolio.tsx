/**
 * PREMIA — Portfolio. Four figures and the book, on the wallet's own page
 * furniture so the column width, title and gutters match every other screen.
 */
import { Page, PageHeader } from "@/v2/ui";
import { cn } from "@/lib/utils";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtPoints, fmtUsd, fmtUsdSignedSmart, toneForPnl } from "@/v2/lib/premia/format";
import { PositionsTable } from "./positions-table";
import { BetaGate } from "./beta-gate";
import { BetaBadge } from "./components";

export default function PremiaPortfolio() {
  const { portfolio, positionValue, mode, points } = usePremia();
  const live = mode === "live";

  const totals = portfolio.positions.reduce(
    (acc, p) => {
      const v = positionValue(p);
      acc.worth += v.worth;
      acc.pnl += v.pnl;
      acc.funding += v.funding;
      return acc;
    },
    { worth: 0, pnl: 0, funding: 0 }
  );
  // Locked collateral is already inside `worth`, so it must not be added again.
  const net = live
    ? portfolio.prmUSD + (portfolio.walletPrmUSD ?? 0) + totals.worth
    : portfolio.prmUSD + totals.worth + totals.funding;

  return (
    <Page width="wide">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            Portfolio
            <BetaBadge />
          </span>
        }
        back="/app/markets"
      />

      <dl
        className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border border-hairline bg-card px-5 py-4 sm:grid-cols-4"
        data-testid="premia-portfolio-summary"
      >
        <Figure label="Net worth" value={fmtUsd(net)} />
        <Figure label="Open P/L" value={fmtUsdSignedSmart(totals.pnl)} tone={toneForPnl(totals.pnl)} />
        <Figure label="Funding" value={fmtUsdSignedSmart(totals.funding)} tone={toneForPnl(totals.funding)} />
        <Figure
          label="Points"
          value={`${points.complete ? "" : "≥ "}${fmtPoints(points.points)}`}
          hint={points.openUnits > 0 ? `+${fmtPoints(points.ratePerDay)}/day` : undefined}
        />
      </dl>

      {live && portfolio.prmUSD <= 0 && (
        <div className="mb-6 max-w-[420px]">
          <BetaGate />
        </div>
      )}

      <PositionsTable />
    </Page>
  );
}

function Figure({ label, value, tone, hint }: { label: string; value: string; tone?: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-medium text-ink-3">{label}</dt>
      <dd className={cn("mt-1 truncate text-[20px] font-semibold tabular-numeric", tone ?? "text-ink")}>
        {value}
        {hint && <span className="ml-1.5 text-[12px] font-normal text-ink-3">{hint}</span>}
      </dd>
    </div>
  );
}
