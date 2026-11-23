/**
 * The ticket.
 *
 * Buy / Cash out on the wallet's own `Segmented` control, two outcome buttons
 * priced as odds, one amount, quick-add chips, one primary button, one line
 * of fine print. No order-type dropdown (PREMIA has one execution mode) and
 * no leverage/margin/liquidation (it is fully collateralised).
 *
 * Every safety gate is preserved: the ticket is not rendered at all unless
 * the market is Active, deployed and has a live index, so no user-op can be
 * built against a market that cannot be priced.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button, Segmented } from "@/v2/ui";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtNum, fmtOddsPct, fmtUnits, fmtUsd, fmtUsdSmart } from "@/v2/lib/premia/format";
import { PREMIA_CONFIG } from "@/v2/lib/premia/config";
import type { Quote } from "@/v2/lib/premia/live";
import type { MarketSnapshot, Side } from "@/v2/lib/premia/types";
import { cleanErr } from "./components";
import { BetaGate } from "./beta-gate";

const QUICK_ADD = [100, 500, 1000];

export function TradePanel({ snap }: { snap: MarketSnapshot }) {
  const { portfolio } = usePremia();
  // A wallet with nothing to trade gets the beta grant, not an empty ticket.
  if (portfolio.prmUSD <= 0) return <BetaGate snap={snap} />;
  return <Ticket snap={snap} />;
}

function Ticket({ snap }: { snap: MarketSnapshot }) {
  const { def } = snap;
  const { portfolio, tradeUnits, cashOut, quote, busy, step, signedIn } = usePremia();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  // The market card's buttons deep-link the side, so arriving here already
  // answers "am I betting Rise or Fall".
  const [side, setSide] = useState<Side>(params.get("side") === "fall" ? "fall" : "rise");
  const [amount, setAmount] = useState<string>("");
  const [q, setQ] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);

  const free = portfolio.prmUSD;
  const budget = Math.max(0, Number(amount) || 0);
  const position = portfolio.positions.find((p) => p.marketId === def.id);

  useEffect(() => {
    if (mode === "sell" && position) setSide(position.side);
  }, [mode, position]);

  const legPrice = side === "rise" ? snap.oddsRise : snap.oddsFall;

  /**
   * Collateral locked is |q|·(odds + $1) and the curve cost sits on top, so a
   * budget buys about budget/(odds + 1) units.
   *
   * NOTE this is NOT budget/odds. PREMIA locks $1 of backing per unit on top
   * of the price, so $500 buys ~495 units at 0.95% odds — not 52,632. The
   * share model would overstate the payout by ~100x.
   */
  const units = useMemo(() => {
    const perUnit = legPrice + 1 + legPrice * 0.01;
    return perUnit > 0 ? budget / perUnit : 0;
  }, [budget, legPrice]);

  useEffect(() => {
    if (mode !== "buy" || units <= 0) {
      setQ(null);
      return;
    }
    let cancel = false;
    const t = setTimeout(() => {
      quote(def.id, side, units)
        .then((res) => !cancel && (setQ(res), setQuoteErr(null)))
        .catch((e) => !cancel && (setQ(null), setQuoteErr(cleanErr(e))));
    }, 300);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [def.id, side, units, quote, mode]);

  const fillPrice = q ? (side === "rise" ? q.markAfter : 1 - q.markAfter) : legPrice;
  const slipped = !!q && legPrice > 0 && Math.abs(fillPrice - legPrice) / legPrice > 0.005;

  const alreadyLocked = position?.lockedCollateral ?? 0;
  const lockDelta = q ? Math.max(0, q.lockRequired - alreadyLocked) : 0;
  const totalOut = q ? lockDelta + q.cost + q.fee : budget;
  const insufficient = budget > 0 && totalOut > free + 1e-9;
  const canBuy = !!q && units > 0 && !insufficient && !busy && signedIn;

  const place = async () => {
    try {
      const res = await tradeUnits({ marketId: def.id, side, units, slippagePct: PREMIA_CONFIG.slippagePct });
      toast.success(`${side === "rise" ? def.riseLabel : def.fallLabel} · ${fmtUnits(units)} units`, {
        description: `Filled near ${fmtOddsPct(fillPrice)} · ${res.hash.slice(0, 10)}…`,
      });
      setAmount("");
    } catch (e) {
      toast.error("Trade failed", { description: cleanErr(e) });
    }
  };

  const sell = async () => {
    if (!position) return;
    try {
      const res = await cashOut(def.id, position.side);
      toast.success("Position closed", {
        description: `${fmtUsd(position.realisable ?? 0)} back to your balance · ${res.hash.slice(0, 10)}…`,
      });
    } catch (e) {
      toast.error("Cash out failed", { description: cleanErr(e) });
    }
  };

  return (
    <div className="rounded-lg border border-hairline bg-card" data-testid="trade-panel">
      <div className="border-b border-hairline px-5 py-4">
        <Segmented
          label="Buy or cash out"
          value={mode}
          onChange={setMode}
          options={[
            { value: "buy" as const, label: "Buy", testId: "mode-buy" },
            { value: "sell" as const, label: "Cash out", testId: "mode-sell" },
          ]}
        />
      </div>

      {mode === "buy" ? (
        <div className="px-5 py-4">
          <div className="flex gap-2" title="The odds each side is priced at. They always add up to 100%.">
            {(["rise", "fall"] as Side[]).map((s) => {
              const active = side === s;
              const price = s === "rise" ? snap.oddsRise : snap.oddsFall;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  aria-pressed={active}
                  data-testid={`side-${s}`}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-3 py-3",
                    "transition-colors duration-150 cursor-pointer active:scale-[0.99]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    active && s === "rise" && "bg-success text-white focus-visible:ring-success",
                    active && s === "fall" && "bg-danger text-white focus-visible:ring-danger",
                    !active && "bg-surface-subtle text-ink-2 ring-1 ring-hairline hover:text-ink hover:ring-hairline-strong"
                  )}
                >
                  <span className="text-[13px] font-medium leading-none">
                    {s === "rise" ? def.riseLabel : def.fallLabel}
                  </span>
                  {/* the odds get the weight; both extremes must fit */}
                  <span className="w-full truncate text-center text-[18px] font-semibold leading-tight tabular-numeric">
                    {fmtOddsPct(price)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-baseline justify-between gap-3">
            <label htmlFor="premia-amount" className="text-[13px] font-medium text-ink-2">
              Amount
            </label>
            <span className="text-[12px] text-ink-3 tabular-numeric">Balance {fmtUsd(free)}</span>
          </div>
          <div
            className={cn(
              "mt-2 flex items-baseline gap-1 rounded-md border px-3 py-2.5 transition-colors duration-150",
              "focus-within:border-accent-primary",
              insufficient ? "border-danger" : "border-hairline-strong"
            )}
          >
            <span className="text-[20px] font-semibold text-ink-3">$</span>
            <input
              id="premia-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              data-testid="trade-amount"
              className="min-w-0 flex-1 bg-transparent text-right text-[28px] font-semibold leading-none text-ink tabular-numeric outline-none placeholder:text-ink-3/50"
            />
          </div>

          <div className="mt-2 grid grid-cols-4 gap-2">
            {QUICK_ADD.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(Math.min(free, budget + v)))}
                className="h-9 rounded-md bg-surface-subtle text-[13px] font-semibold text-ink-2 tabular-numeric ring-1 ring-hairline transition-colors duration-150 hover:text-ink hover:ring-hairline-strong cursor-pointer"
              >
                +{fmtNum(v, 0)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(Math.floor(free * 100) / 100))}
              className="h-9 rounded-md bg-surface-subtle text-[13px] font-semibold text-ink-2 ring-1 ring-hairline transition-colors duration-150 hover:text-ink hover:ring-hairline-strong cursor-pointer"
            >
              Max
            </button>
          </div>

          {/* the payoff, in magnitudes a trader can hold */}
          {q && units > 0 && (
            <div className="mt-4 rounded-md bg-surface-subtle px-4 py-3" data-testid="trade-payoff">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-ink-3">To win</p>
                  <p className="mt-1 truncate text-[24px] font-semibold leading-none text-success tabular-numeric">
                    {fmtUsdSmart(units * (1 - legPrice))}
                  </p>
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-[12px] font-medium text-ink-3">You risk</p>
                  <p className="mt-1 truncate text-[15px] font-semibold leading-none text-danger tabular-numeric">
                    {fmtUsdSmart(units * legPrice)}
                  </p>
                </div>
              </div>
              <p className="mt-3 border-t border-hairline pt-2 text-[12px] text-ink-3 tabular-numeric">
                {fmtUnits(units)} units at {fmtOddsPct(slipped ? fillPrice : legPrice)}
                {slipped && <span className="text-danger"> · moved by size</span>}
              </p>
            </div>
          )}
          {quoteErr && <p className="mt-3 text-[13px] text-danger">{quoteErr}</p>}

          <Button block size="lg" className="mt-4" onClick={place} disabled={!canBuy} data-testid="place-trade">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {step ?? "Placing…"}
              </>
            ) : !signedIn ? (
              "Sign in to trade"
            ) : insufficient ? (
              "Not enough balance"
            ) : (
              "Trade"
            )}
          </Button>
        </div>
      ) : (
        <div className="px-5 py-4">
          {position ? (
            <>
              <dl className="space-y-2 text-[13px]">
                <Figure
                  label="Holding"
                  value={`${fmtUnits(position.units)} × ${position.side === "rise" ? def.riseLabel : def.fallLabel}`}
                />
                <Figure label="Entry" value={fmtOddsPct(position.entryOdds)} />
                <Figure label="Now" value={fmtOddsPct(position.side === "rise" ? snap.oddsRise : snap.oddsFall)} />
                <Figure label="Value" value={fmtUsdSmart(position.realisable ?? 0)} />
              </dl>
              <Button
                block
                size="lg"
                variant="secondary"
                className="mt-4"
                onClick={sell}
                disabled={busy || !signedIn}
                data-testid="cash-out"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {step ?? "Closing…"}
                  </>
                ) : (
                  `Cash out ${fmtUsd(position.realisable ?? 0)}`
                )}
              </Button>
            </>
          ) : (
            <p className="py-6 text-center text-[13px] text-ink-3">No position.</p>
          )}
        </div>
      )}

      <p
        className="border-t border-hairline px-5 py-3 text-center text-[12px] leading-relaxed text-ink-3"
        data-testid="premia-fine-print"
      >
        Beta: these are test tokens with no monetary value and positions are not redeemable.
      </p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-semibold text-ink tabular-numeric">{value}</dd>
    </div>
  );
}
