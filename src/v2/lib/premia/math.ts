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
