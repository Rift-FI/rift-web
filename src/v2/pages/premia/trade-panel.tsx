/**
 * The ticket — Polymarket's two-outcome panel, in Rift's design system.
 *
 * Buy / Sell tabs, two outcome buttons priced in cents, one large amount, a
 * row of quick-add chips, one primary button, one line of fine print. There
 * is no order-type dropdown because PREMIA has exactly one execution mode,
 * and no leverage/margin/liquidation because it is fully collateralised.
 *
 * Every safety gate is preserved: the ticket does not render at all unless the
 * market is Active, deployed and has a live index, so no user-op can be built
 * against a market that cannot be priced.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/v2/ui";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtCents, fmtNum, fmtPrm, fmtPrmSmart, fmtUnits } from "@/v2/lib/premia/format";
import { PREMIA_CONFIG } from "@/v2/lib/premia/config";
import type { Quote } from "@/v2/lib/premia/live";
import type { MarketSnapshot, Side } from "@/v2/lib/premia/types";
import { cleanErr } from "./components";
import { BetaGate } from "./beta-gate";

/** prmUSD quick-add chips. No "$" — these are test tokens. */
const QUICK_ADD = [100, 500, 1000];

export function TradePanel({ snap }: { snap: MarketSnapshot }) {
  const { portfolio, acknowledged } = usePremia();
  const funded = portfolio.prmUSD > 0;
  // A wallet with nothing to trade gets the beta grant, not an empty ticket.
  if (!funded || !acknowledged) return <BetaGate snap={snap} />;
  return <Ticket snap={snap} />;
}

/* ── the two outcome buttons ────────────────────────────────────────────── */

function OutcomeButton({
  label,
  price,
  side,
  active,
  onClick,
}: {
  label: string;
  price: number;
  side: Side;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = side === "rise" ? ArrowUpRight : ArrowDownRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={`side-${side}`}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2.5 transition-colors duration-150 cursor-pointer",
        active && side === "rise" && "border-success bg-success text-white",
        active && side === "fall" && "border-danger bg-danger text-white",
        !active && "border-hairline-strong bg-surface-subtle text-ink-2 hover:border-hairline-strong hover:text-ink"
      )}
    >
      <span className="flex items-center gap-1 text-[12.5px] font-semibold leading-none">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {/*
        Stacked, and the price gets the full button width. A calm market
        quotes a 1¢ / 99¢ pair, and while λ_ref is still a placeholder it
        quotes 0.0001¢ / 99.9999¢ — both have to fit without clipping, so the
        price sits on its own line and shrinks rather than overflowing.
      */}
      <span className="w-full truncate text-center text-[17px] font-semibold leading-tight tabular-numeric">
        {fmtCents(price)}
      </span>
    </button>
  );
}

/* ── the ticket ─────────────────────────────────────────────────────────── */

function Ticket({ snap }: { snap: MarketSnapshot }) {
  const { def } = snap;
  const { portfolio, tradeUnits, cashOut, quote, busy, step, signedIn } = usePremia();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [side, setSide] = useState<Side>("rise");
  const [amount, setAmount] = useState<string>("");
  const [q, setQ] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);

  const free = portfolio.prmUSD;
  const budget = Math.max(0, Number(amount) || 0);
  const position = portfolio.positions.find((p) => p.marketId === def.id);

  // A held position pins the side — you cash out what you actually hold.
  useEffect(() => {
    if (mode === "sell" && position) setSide(position.side);
  }, [mode, position]);

  const legPrice = side === "rise" ? snap.oddsRise : snap.oddsFall;
  /**
   * Collateral locked is |q|·(leg price + 1 prmUSD) and the curve cost sits on
   * top, so a prmUSD budget buys about budget/(leg + 1) units.
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

  /** Where this size actually fills, and whether that differs enough to show. */
  const fillPrice = q ? (side === "rise" ? q.markAfter : 1 - q.markAfter) : legPrice;
  const slipped = !!q && legPrice > 0 && Math.abs(fillPrice - legPrice) / legPrice > 0.005;

  const alreadyLocked = position?.lockedCollateral ?? 0;
  const lockDelta = q ? Math.max(0, q.lockRequired - alreadyLocked) : 0;
  const totalOut = q ? lockDelta + q.cost + q.fee : budget;
  const insufficient = budget > 0 && totalOut > free + 1e-9;
  const canBuy = !!q && units > 0 && !insufficient && !busy && signedIn;
  const canSell = !!position && !busy && signedIn;

  const place = async () => {
    try {
      const res = await tradeUnits({ marketId: def.id, side, units, slippagePct: PREMIA_CONFIG.slippagePct });
      toast.success(`${side === "rise" ? def.riseLabel : def.fallLabel} · ${fmtUnits(units)} units`, {
        description: `Filled near ${fmtCents(q?.markAfter ?? legPrice)} · gas paid in USDC · ${res.hash.slice(0, 10)}…`,
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
        description: `${fmtPrm(position.realisable ?? 0)} back to your balance · ${res.hash.slice(0, 10)}…`,
      });
    } catch (e) {
      toast.error("Cash out failed", { description: cleanErr(e) });
    }
  };

  const sideLabel = side === "rise" ? def.riseLabel : def.fallLabel;

  return (
    <div className="rounded-xl border border-hairline bg-card" data-testid="trade-panel">
      {/* header: market + selected outcome */}
      <div className="flex items-start gap-2.5 border-b border-hairline p-3.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-subtle text-[18px]" aria-hidden="true">
          {def.flag}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">{def.question}</p>
          <p className="mt-0.5 text-[12px] font-semibold">
            <span className={side === "rise" ? "text-success" : "text-danger"}>
              {side === "rise" ? "▲" : "▼"} {sideLabel}
            </span>
          </p>
        </div>
      </div>

      {/* Buy | Sell */}
      <div className="flex items-center gap-4 border-b border-hairline px-3.5">
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            disabled={m === "sell" && !position}
            data-testid={`mode-${m}`}
            className={cn(
              "relative h-10 text-[13.5px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
              mode === m
                ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent-primary"
                : "text-ink-3 hover:text-ink"
            )}
          >
            {m === "sell" ? "Cash out" : "Buy"}
          </button>
        ))}
      </div>

      {mode === "buy" ? (
        <div className="p-3.5">
          {/* two outcomes, priced in cents */}
          <div className="flex gap-2" title="Price per unit. A unit settles between 0¢ and 100¢, and the two sides always sum to 100¢.">
            <OutcomeButton label={def.riseLabel} price={snap.oddsRise} side="rise" active={side === "rise"} onClick={() => setSide("rise")} />
            <OutcomeButton label={def.fallLabel} price={snap.oddsFall} side="fall" active={side === "fall"} onClick={() => setSide("fall")} />
          </div>

          {/* amount */}
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <label htmlFor="premia-amount" className="text-[13px] font-medium text-ink-2">
              Amount
            </label>
            <span className="text-[11.5px] text-ink-3 tabular-numeric">Balance {fmtPrm(free, 2)}</span>
          </div>
          <div
            className={cn(
              "mt-1 flex items-baseline justify-end gap-1.5 rounded-lg border px-3 py-2 transition-colors focus-within:border-accent-primary",
              insufficient ? "border-danger" : "border-hairline-strong"
            )}
          >
            <input
              id="premia-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              data-testid="trade-amount"
              className="min-w-0 flex-1 bg-transparent text-right text-[30px] font-semibold leading-none text-ink tabular-numeric outline-none placeholder:text-ink-3/50"
            />
            <span className="flex-shrink-0 text-[13px] font-medium text-ink-3">prmUSD</span>
          </div>

          {/* quick add */}
          <div className="mt-2 flex gap-1.5">
            {QUICK_ADD.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(Math.min(free, budget + v)))}
                className="h-8 flex-1 rounded-md border border-hairline bg-surface-subtle text-[12.5px] font-semibold text-ink-2 tabular-numeric hover:border-hairline-strong hover:text-ink cursor-pointer"
              >
                +{fmtNum(v, 0)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(Math.floor(free * 100) / 100))}
              className="h-8 flex-1 rounded-md border border-hairline bg-surface-subtle text-[12.5px] font-semibold text-ink-2 hover:border-hairline-strong hover:text-ink cursor-pointer"
            >
              Max
            </button>
          </div>

          {/* compact figure list — not prose */}
          {q && units > 0 && (
            <dl className="mt-3 space-y-1 text-[12.5px]">
              <Figure label="Units" value={fmtUnits(units)} />
              {/* Avg price only when size actually moves it — at small size it
                  just restates the button, at large size it is the decision. */}
              {slipped && <Figure label="Avg price" value={fmtCents(fillPrice)} tone="danger" />}
              <Figure label="To win" value={fmtPrmSmart(units * (1 - legPrice))} tone="success" />
              <Figure label="You risk" value={fmtPrmSmart(units * legPrice)} tone="danger" />
            </dl>
          )}
          {quoteErr && <p className="mt-2 text-[12px] text-danger">{quoteErr}</p>}

          <Button
            block
            size="lg"
            className="mt-3"
            onClick={place}
            disabled={!canBuy}
            data-testid="place-trade"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {step ?? "Placing…"}
              </>
            ) : !signedIn ? (
              "Sign in to trade"
            ) : insufficient ? (
              "Not enough prmUSD"
            ) : (
              "Trade"
            )}
          </Button>
        </div>
      ) : (
        <div className="p-3.5">
          {position ? (
            <>
              <dl className="space-y-1 text-[12.5px]">
                <Figure label="Holding" value={`${fmtUnits(position.units)} × ${position.side === "rise" ? def.riseLabel : def.fallLabel}`} />
                <Figure label="Entry" value={fmtCents(position.entryOdds)} />
                <Figure label="Now" value={fmtCents(position.side === "rise" ? snap.oddsRise : snap.oddsFall)} />
                <Figure label="Value" value={fmtPrmSmart(position.realisable ?? 0)} />
              </dl>
              <Button block size="lg" variant="secondary" className="mt-3" onClick={sell} disabled={!canSell} data-testid="cash-out">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {step ?? "Closing…"}
                  </>
                ) : (
                  `Cash out ${fmtPrm(position.realisable ?? 0)}`
                )}
              </Button>
            </>
          ) : (
            <p className="py-4 text-center text-[13px] text-ink-3">No position.</p>
          )}
        </div>
      )}

      {/* the entire standing disclosure, one line */}
      <p className="border-t border-hairline px-3.5 py-2.5 text-center text-[11px] leading-relaxed text-ink-3" data-testid="premia-fine-print">
        prmUSD is a test token. No monetary value, not redeemable.
      </p>
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-3">{label}</dt>
      <dd
        className={cn(
          "font-semibold tabular-numeric",
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-ink"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
