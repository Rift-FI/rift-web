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
  /**
   * A position whose fills have not been read yet contributes 0 to the P/L
   * sum. Summing that silently reports a confident total that is simply
   * missing a position, so the figure says so instead.
   */
  const basisPending = portfolio.positions.some((p) => p.basisPending);
  const basisUnknown = portfolio.positions.some((p) => p.basisUnknown);
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
        <Figure
          label="Net worth"
          value={fmtUsd(net)}
          explain="Everything this wallet holds in PREMIA: the free trading balance, test tokens still sitting in the wallet, and what your open positions are worth right now."
        />
        <Figure
          label="Open P/L"
          value={basisPending ? "Reading…" : fmtUsdSignedSmart(totals.pnl)}
          tone={basisPending ? "text-ink-3" : toneForPnl(totals.pnl)}
          hint={!basisPending && basisUnknown ? "partial" : undefined}
          explain={
            basisPending
              ? "Still reading your fills from the chain to work out what each position cost."
              : basisUnknown
                ? "What your open positions have made or lost. Partial: one position's opening fills are older than the log window, so its result is not counted."
                : "What your open positions have made or lost against what you paid for them. It does not deduct the 1% fee to close."
          }
        />
        <Figure
          label="Funding"
          value={fmtUsdSignedSmart(totals.funding)}
          tone={toneForPnl(totals.funding)}
          explain="Funding charged or credited on your positions so far. Negative means holding them is costing you; it is already reflected in each position's value."
        />
        <Figure
          label="Points"
          value={`${points.complete ? "" : "≥ "}${fmtPoints(points.points)}`}
          hint={points.openUnits > 0 ? `+${fmtPoints(points.ratePerDay)}/day` : undefined}
          explain={
            points.complete
              ? "Beta points from your own on-chain fills and the time you have held positions. No conversion rate is set."
              : "Beta points from the fills we could read — a lower bound, since older history is beyond the log scan window. No conversion rate is set."
          }
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

function Figure({
  label,
  value,
  tone,
  hint,
  explain,
}: {
  label: string;
  value: string;
  tone?: string;
  hint?: string;
  explain?: string;
}) {
  return (
    <div className="min-w-0" title={explain}>
      <dt
        className={cn(
          "text-[12px] font-medium text-ink-3",
          explain && "cursor-help decoration-dotted underline-offset-4 hover:underline"
        )}
      >
        {label}
      </dt>
      <dd className={cn("mt-1 truncate text-[20px] font-semibold tabular-numeric", tone ?? "text-ink")}>
        {value}
        {hint && <span className="ml-1.5 text-[12px] font-normal text-ink-3">{hint}</span>}
      </dd>
    </div>
  );
}
