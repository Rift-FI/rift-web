/**
 * Presentation math over the engine (docs/PREMIA-SPEC.md §2). These are the
 * honest, consistent mappings the UI uses to turn a premium reading into odds,
 * payout and funding. In live mode the same quantities come from the contract
 * views (markPrice / payoutNow / fundingIndex); here they are derived so the
 * mock is internally coherent.
 */
import type { MarketDef, Side } from "./types";

const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const logistic = (z: number) => 1 / (1 + Math.exp(-z));

/** Payout basis I = clamp((premium − F)/(C − F), 0, 1) (spec §2.1). */
export function payoutOf(premium: number, def: MarketDef): number {
  return clamp((premium - def.floorPct) / (def.capPct - def.floorPct));
}

/**
 * Odds (mark M) the Rise side trades at, ∈ (0,1). A smooth, monotone function
 * of the premium centred a little above the floor, so calm markets quote cheap
 * Rise (<50¢) and stressed markets quote rich Rise (>50¢). Stand-in for the
 * oracle-anchored M^ref(X̄) until the contract is live.
 */
export function oddsRiseOf(premium: number, def: MarketDef): number {
  const span = def.capPct - def.floorPct;
  const center = def.floorPct + span * 0.18;
  const z = (premium - center) / (span * 0.42);
  return clamp(logistic(z), 0.03, 0.97);
}

/**
 * Funding %/day for a side. f̃ = (M̄ − Ī)/τ is what longs PAY (spec §2.3), so
 * Rise earns −f̃. Positive = you receive yield; negative = holding cost.
 */
export function fundingDaily(premium: number, def: MarketDef, side: Side): number {
  const M = oddsRiseOf(premium, def);
  const I = payoutOf(premium, def);
  const fLongPaysPerDay = (M - I) / def.tau; // fraction of 1 prmUSD/unit per day
  const risePct = -fLongPaysPerDay * 100;
  return side === "rise" ? risePct : -risePct;
}

/** Odds for a side. */
export function oddsOf(premium: number, def: MarketDef, side: Side): number {
  const r = oddsRiseOf(premium, def);
  return side === "rise" ? r : 1 - r;
}

/** Units bought for a stake at a given entry odds; each unit pays up to 1 prmUSD. */
export function unitsFor(stake: number, entryOdds: number): number {
  if (entryOdds <= 0) return 0;
  return stake / entryOdds;
}

/** Max payout if this side resolves fully in your favour (units × 1 prmUSD). */
export function maxPayoutFor(stake: number, entryOdds: number): number {
  return unitsFor(stake, entryOdds); // units × 1 prmUSD
}

/** Mark-to-market worth of `units` on `side` at the current premium. */
export function positionWorth(units: number, side: Side, premium: number, def: MarketDef): number {
  return units * oddsOf(premium, def, side);
}

/* ── what a trader actually needs to see about an open position ─────────── */

export interface PositionState {
  /** Signed P/L right now, in dollars. */
  pnl: number;
  /** Credited to the trading balance if closed this instant, after the exit fee. */
  proceedsNow: number;
  /** Total paid in: collateral locked + entry cost + entry fee. */
  paidIn: number;
  /** Net result of closing now, after BOTH fees. Negative = you'd realise a loss. */
  netIfClosed: number;
  /** The 1% exit fee this close would cost. */
  exitFee: number;
  /** Dollars of funding per day. Positive = you receive, negative = you pay. */
  fundingPerDay: number;
  /** Same as a percentage of position value per day. */
  fundingPctPerDay: number;
}

/**
 * Everything needed to answer "am I up, what do I get if I close, and is
 * funding for me or against me".
 *
 * Funding: f̃ = (M − I)/τ is what LONGS pay per day per unit (spec §2.3), so
 * a long with the mark above the payout basis is bleeding and a short is
 * collecting. With M ≈ 1.03% and I = 0 that is ~0.034%/day — small per day,
 * but it is the cheap ticket quietly shrinking, and it has to be on screen.
 *
 * Closing credits `accountValue` minus the 1% exit fee on value, so the
 * honest "what do I walk away with" is proceeds, and the honest "was this
 * worth it" is proceeds minus everything put in — which includes BOTH fees.
 */
export function positionState(args: {
  units: number;
  side: Side;
  /** PerpMarket.accountValue — what closing returns before the exit fee. */
  accountValue: number;
  lockedCollateral: number;
  /** Σ(cost + fee) actually paid, from the account's own fills. */
  paid: number;
  /** Live mark M. */
  mark: number;
  /** Live payout basis I. */
  payout: number;
  /** Funding horizon τ, days. */
  tau: number;
}): PositionState {
  const { units, side, accountValue, lockedCollateral, paid, mark, payout, tau } = args;

  // φ = 1% on value (spec §2.7), charged again on the way out.
  const exitFee = 0.01 * units * mark;
  const proceedsNow = accountValue - exitFee;
  const paidIn = lockedCollateral + paid;

  // longs pay (M − I)/τ per unit per day; shorts are on the other side of it
  const longPaysPerUnitPerDay = (mark - payout) / Math.max(1, tau);
  const fundingPerDay = (side === "rise" ? -1 : 1) * longPaysPerUnitPerDay * units;

  return {
    pnl: accountValue - lockedCollateral - paid,
    proceedsNow,
    paidIn,
    netIfClosed: proceedsNow - paidIn,
    exitFee,
    fundingPerDay,
    // Against NOTIONAL (each unit is worth up to $1), which is how the
    // protocol defines f̃. Dividing by the leg's cost instead would report
    // this position as "-3.3%/day", which is arithmetically true of a 1¢
    // ticket and wildly misleading.
    fundingPctPerDay: (side === "rise" ? -1 : 1) * longPaysPerUnitPerDay * 100,
  };
}
