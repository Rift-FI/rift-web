/**
 * The trader's own book — the one surface kept from the Hyperliquid
 * reference, because Polymarket is silent on it and a dense tabbed table is
 * the right shape for it.
 *
 * Tiny row height, right-aligned tabular figures, no prose. Columns are only
 * those PREMIA actually has: there is no Liq. Price, no Margin and no
 * leverage, because the protocol is fully collateralised and never
 * liquidates — an empty column would be worse than no column.
 */
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Segmented } from "@/v2/ui";
import { usePremia } from "@/v2/lib/premia/store";
import { marketById } from "@/v2/lib/premia/markets";
import { positionState } from "@/v2/lib/premia/math";
import {
  fmtFunding,
  fmtOddsPct,
  fmtNum,
  fmtPoints,
  fmtUsdSignedSmart,
  fmtUsdSmart,
  fmtUnits,
  toneForPnl,
} from "@/v2/lib/premia/format";
import { txUrl } from "@/v2/lib/premia/config";
import { cleanErr } from "./components";

type Tab = "positions" | "balances" | "points";

const TABS: { id: Tab; label: string }[] = [
  { id: "positions", label: "Positions" },
  { id: "balances", label: "Balances" },
  { id: "points", label: "Points" },
];

export function PositionsTable({ className, marketId }: { className?: string; marketId?: string }) {
  const { portfolio, positionValue, cashOut, busy, snapshots, mode, points, lastTx } = usePremia();
  const [tab, setTab] = useState<Tab>("positions");
  const live = mode === "live";

  const rows = useMemo(
    () => (marketId ? portfolio.positions.filter((p) => p.marketId === marketId) : portfolio.positions),
    [portfolio.positions, marketId]
  );

  const close = async (id: string, side: "rise" | "fall") => {
    try {
      const res = await cashOut(id, side);
      toast.success("Position closed", { description: `${res.hash.slice(0, 10)}…` });
    } catch (e) {
      toast.error("Cash out failed", { description: cleanErr(e) });
    }
  };

  return (
    <section className={cn("rounded-lg border border-hairline bg-card", className)} data-testid="premia-book">
      <div className="border-b border-hairline px-5 py-4">
        <div className="w-full max-w-[320px]">
        <Segmented
          label="Book"
          value={tab}
          onChange={setTab}
          size="sm"
          options={TABS.map((t) => ({
            value: t.id,
            label: t.id === "positions" && rows.length > 0 ? `${t.label} ${rows.length}` : t.label,
          }))}
        />
        </div>
      </div>

      {tab === "positions" &&
        (rows.length === 0 ? (
          <Empty>No open positions.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-[13px]">
              <thead>
                <tr className="border-b border-hairline text-[12px] font-medium text-ink-3">
                  <Th align="left">Market</Th>
                  <Th align="left">Side</Th>
                  <Th>Size</Th>
                  <Th>Entry</Th>
                  <Th>Mark</Th>
                  <Th explain="What your trading balance is credited if you close this row right now, after the 1% exit fee.">
                    Cash out now
                  </Th>
                  <Th explain="Value now minus everything you put in. It does not deduct the fee to close.">PnL</Th>
                  <Th explain="Funding charged or credited so far. Longs pay while the odds sit above what the index pays.">
                    Funding
                  </Th>
                  <Th explain="The rate funding is running at today. Negative means holding this position costs you that much per day.">
                    Per day
                  </Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const def = marketById(p.marketId);
                  const snap = snapshots[p.marketId];
                  const v = positionValue(p);
                  const isRise = p.side === "rise";
                  const now = isRise ? snap?.oddsRise ?? 0 : snap?.oddsFall ?? 0;
                  const st = positionState({
                    units: p.units,
                    side: p.side,
                    accountValue: p.realisable ?? 0,
                    lockedCollateral: p.lockedCollateral ?? 0,
                    paid: p.paid ?? 0,
                    mark: snap?.oddsRise ?? 0,
                    payout: snap?.payout ?? 0,
                    tau: snap?.tauDays ?? def?.tau ?? 1,
                  });
                  return (
                    <tr
                      key={`${p.marketId}-${p.side}`}
                      className="border-b border-hairline last:border-0"
                      data-testid={`position-${p.marketId}-${p.side}`}
                    >
                      <Td align="left" className="max-w-[220px] truncate font-medium text-ink">
                        {def?.symbol ?? p.marketId}
                      </Td>
                      <Td align="left">
                        <span className={cn("font-semibold", isRise ? "text-success" : "text-danger")}>
                          {isRise ? "▲" : "▼"} {isRise ? def?.riseLabel : def?.fallLabel}
                        </span>
                      </Td>
                      <Td>{fmtUnits(p.units)}</Td>
                      <Td>{fmtOddsPct(p.entryOdds)}</Td>
                      <Td>{fmtOddsPct(now)}</Td>
                      <Td
                        className="font-medium text-ink"
                        title={`Worth ${fmtUsdSmart(v.worth)} · exit fee ${fmtUsdSmart(st.exitFee)}`}
                      >
                        {fmtUsdSmart(st.proceedsNow, false)}
                      </Td>
                      {/* three states: known, still scanning fills, or never
                          reconstructible. A fresh position used to read "—". */}
                      <Td className={v.pendingBasis || v.unknownBasis ? "text-ink-3" : toneForPnl(v.pnl)}>
                        {v.pendingBasis ? (
                          <Loader2 className="ml-auto h-3 w-3 animate-spin" aria-label="Reading fills" />
                        ) : v.unknownBasis ? (
                          "—"
                        ) : (
                          fmtUsdSignedSmart(v.pnl, false)
                        )}
                      </Td>
                      <Td className={toneForPnl(v.funding)}>{fmtUsdSignedSmart(v.funding, false)}</Td>
                      <Td
                        className={toneForPnl(st.fundingPerDay)}
                        title={`${fmtFunding(st.fundingPctPerDay)} of notional · about ${fmtUsdSmart(
                          Math.abs(st.fundingPerDay) * 30
                        )}/month`}
                      >
                        {/* 3dp below a dollar: "-0.03" throws away a figure
                            whose whole point is how small it is */}
                        {fmtPerDay(st.fundingPerDay)}
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => close(p.marketId, p.side)}
                          disabled={busy}
                          className="rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-ink-2 ring-1 ring-hairline transition-colors duration-150 hover:text-ink hover:ring-hairline-strong disabled:opacity-50 cursor-pointer"
                          data-testid={`cashout-${p.marketId}-${p.side}`}
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Close"}
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
                      </div>
        ))}

      {tab === "balances" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-[12px] font-medium text-ink-3">
                <Th align="left">Asset</Th>
                <Th>Trading balance</Th>
                <Th>Locked</Th>
                <Th>In wallet</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td align="left" className="font-medium text-ink">
Test balance
                </Td>
                <Td data-testid="premia-balance">{fmtNum(portfolio.prmUSD)}</Td>
                <Td>{fmtNum(portfolio.locked ?? 0)}</Td>
                <Td>{fmtNum(portfolio.walletPrmUSD ?? 0)}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "points" &&
        (!live ? (
          <Empty>—</Empty>
        ) : (
          <div className="px-5 py-4">
            <p className="flex items-baseline gap-1.5">
              <span className="text-[24px] font-semibold text-ink tabular-numeric" data-testid="premia-points-value">
                {points.complete ? "" : "≥ "}
                {fmtPoints(points.points)}
              </span>
              <span className="text-[12px] font-medium text-ink-3">points</span>
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-3 tabular-numeric">
              {points.openUnits > 0 ? `+${fmtPoints(points.ratePerDay)} / day while you hold` : "Hold a position to earn"}
            </p>
            {!points.complete && (
              <p className="mt-1.5 text-[11.5px] text-warning">Lower bound.</p>
            )}
            {/* promise management, not decoration: there is no rate yet */}
            <p className="mt-1.5 text-[11.5px] text-ink-3">Rate at launch not set.</p>
          </div>
        ))}

      {lastTx && !lastTx.mock && (
        <p className="border-t border-hairline px-5 py-3 text-[12px] text-ink-3">
          Last transaction{" "}
          <a href={txUrl(lastTx.hash)} target="_blank" rel="noreferrer" className="font-medium text-accent-primary hover:underline">
            {lastTx.hash.slice(0, 12)}…
          </a>
        </p>
      )}
    </section>
  );
}

/**
 * Funding per day, to three decimals below a dollar — "-0.03" throws away a
 * figure whose whole point is how small it is. A value that rounds to zero
 * loses its sign too: "−0.000" reads as a loss that is not happening.
 */
function fmtPerDay(n: number): string {
  const a = Math.abs(n);
  const dp = a < 1 ? 3 : 2;
  const body = fmtNum(a, dp);
  return Number(body) === 0 ? body : `${n < 0 ? "−" : "+"}${body}`;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-[13px] text-ink-3">{children}</p>;
}

function Th({
  children,
  align = "right",
  explain,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  explain?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 font-medium",
        align === "left" ? "text-left" : "text-right",
        explain && "cursor-help decoration-dotted underline-offset-4 hover:underline"
      )}
      title={explain}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "right",
  className,
  ...rest
}: { children: React.ReactNode; align?: "left" | "right"; className?: string } & Record<string, unknown>) {
  return (
    <td
      className={cn("px-4 py-3 tabular-numeric", align === "left" ? "text-left" : "text-right", className)}
      {...rest}
    >
      {children}
    </td>
  );
}
