/**
 * PREMIA — Portfolio. Four figures and the book, nothing else.
 */
import { Link } from "react-router";
import { Page } from "@/v2/ui";
import { cn } from "@/lib/utils";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtNum, fmtPoints, fmtPrmSignedSmart, toneForPnl } from "@/v2/lib/premia/format";
import { PositionsTable } from "./positions-table";
import { BetaGate } from "./beta-gate";
import { TestBadge } from "./components";

export default function PremiaPortfolio() {
  const { portfolio, positionValue, mode, points } = usePremia();
  const live = mode === "live";
  const positions = portfolio.positions;

  const totals = positions.reduce(
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
      <header className="mb-4 flex items-center gap-2">
        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-accent-primary">PREMIA</span>
        <TestBadge />
        <Link to="/app/markets" className="ml-auto text-[13px] font-medium text-accent-primary hover:underline">
          Markets
        </Link>
      </header>
      <h1 className="mb-4 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink">Portfolio</h1>

      <dl className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-hairline py-4 sm:grid-cols-4" data-testid="premia-portfolio-summary">
        <Figure label="Net worth" unit="prmUSD" value={fmtNum(net)} />
        <Figure
          label="Open P/L"
          unit="prmUSD"
          value={live ? fmtPrmSignedSmart(totals.pnl, false) : fmtNum(totals.pnl)}
          tone={toneForPnl(totals.pnl)}
        />
        <Figure
          label="Funding"
          unit="prmUSD"
          value={live ? fmtPrmSignedSmart(totals.funding, false) : fmtNum(totals.funding)}
          tone={toneForPnl(totals.funding)}
        />
        <Figure
          label="Points"
          value={`${points.complete ? "" : "≥ "}${fmtPoints(points.points)}`}
          hint={points.openUnits > 0 ? `+${fmtPoints(points.ratePerDay)}/day` : undefined}
        />
      </dl>

      {live && portfolio.prmUSD <= 0 && (
        <div className="mb-5 max-w-md">
          <BetaGate />
        </div>
      )}

      <PositionsTable />
    </Page>
  );
}

function Figure({
  label,
  value,
  tone,
  hint,
  unit,
}: { label: string; value: string; tone?: string; hint?: string; unit?: string }) {
  return (
    <div className="min-w-0">
      {/* `uppercase` would render the ticker as "PRMUSD"; the unit opts out. */}
      <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">
        {label}
        {unit && <span className="normal-case"> · {unit}</span>}
      </dt>
      <dd className={cn("mt-0.5 truncate text-[20px] font-semibold tabular-numeric", tone ?? "text-ink")}>
        {value}
        {hint && <span className="ml-1.5 text-[12px] font-normal text-ink-3">{hint}</span>}
      </dd>
    </div>
  );
}
