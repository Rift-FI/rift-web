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
import { usePremia } from "@/v2/lib/premia/store";
import { marketById } from "@/v2/lib/premia/markets";
import {
  fmtCents,
  fmtNum,
  fmtPoints,
  fmtPrmSignedSmart,
  fmtPrmSmart,
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
    <section className={cn("rounded-xl border border-hairline bg-card", className)} data-testid="premia-book">
      <div className="flex items-center gap-4 border-b border-hairline px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative h-10 text-[13px] font-semibold transition-colors cursor-pointer",
              tab === t.id
                ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent-primary"
                : "text-ink-3 hover:text-ink"
            )}
          >
            {t.label}
            {t.id === "positions" && rows.length > 0 && (
              <span className="ml-1.5 text-[11px] font-medium text-ink-3 tabular-numeric">{rows.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "positions" &&
        (rows.length === 0 ? (
          <Empty>No open positions.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[12.5px]">
              <thead>
                <tr className="border-b border-hairline text-[10.5px] uppercase tracking-[0.06em] text-ink-3">
                  <Th align="left">Market</Th>
                  <Th align="left">Side</Th>
                  <Th>Size</Th>
                  <Th>Entry ¢</Th>
                  <Th>Mark ¢</Th>
                  <Th>Value</Th>
                  <Th>PnL</Th>
                  <Th>Funding</Th>
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
                      <Td>{fmtCents(p.entryOdds)}</Td>
                      <Td>{fmtCents(now)}</Td>
                      <Td>{fmtPrmSmart(v.worth, false)}</Td>
                      <Td className={v.unknownBasis ? "text-ink-3" : toneForPnl(v.pnl)}>
                        {v.unknownBasis ? "—" : fmtPrmSignedSmart(v.pnl, false)}
                      </Td>
                      <Td className={toneForPnl(v.funding)}>{fmtPrmSignedSmart(v.funding, false)}</Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => close(p.marketId, p.side)}
                          disabled={busy}
                          className="rounded-md border border-hairline px-2 py-1 text-[11.5px] font-semibold text-ink-2 hover:border-hairline-strong hover:text-ink disabled:opacity-50 cursor-pointer"
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
            <p className="px-3 pb-2.5 pt-1 text-right text-[10.5px] text-ink-3">Amounts in prmUSD</p>
          </div>
        ))}

      {tab === "balances" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-[12.5px]">
            <thead>
              <tr className="border-b border-hairline text-[10.5px] uppercase tracking-[0.06em] text-ink-3">
                <Th align="left">Asset</Th>
                <Th>Trading balance</Th>
                <Th>Locked</Th>
                <Th>In wallet</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td align="left" className="font-medium text-ink">
                  prmUSD <span className="text-ink-3">· test token</span>
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
          <div className="px-4 py-3.5">
            <p className="flex items-baseline gap-1.5">
              <span className="text-[22px] font-semibold text-ink tabular-numeric" data-testid="premia-points-value">
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
        <p className="border-t border-hairline px-4 py-2 text-[11px] text-ink-3">
          Last transaction{" "}
          <a href={txUrl(lastTx.hash)} target="_blank" rel="noreferrer" className="font-medium text-accent-primary hover:underline">
            {lastTx.hash.slice(0, 12)}…
          </a>
        </p>
      )}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-[13px] text-ink-3">{children}</p>;
}

function Th({ children, align = "right" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cn("px-3 py-2 font-medium", align === "left" ? "text-left" : "text-right")}>{children}</th>
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
      className={cn("px-3 py-2 tabular-numeric", align === "left" ? "text-left" : "text-right", className)}
      {...rest}
    >
      {children}
    </td>
  );
}
