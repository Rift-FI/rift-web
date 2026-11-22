/**
 * PREMIA beta points — derived entirely from the market's own event log.
 *
 * The full rule, its rationale and its known weaknesses are written down in
 * vomma/docs/PREMIA-POINTS.md. This file is the implementation of that
 * document and must not drift from it.
 *
 * ── Why it is shaped this way ────────────────────────────────────────────
 *
 * NO DATABASE. Points are a pure function of `PositionModified` logs plus
 * block timestamps, so they add no table to Rift's production database (which
 * holds real user funds), no contract, no gas and no trusted server. Anyone
 * can recompute any address's total from a public Base RPC and get the same
 * number.
 *
 * TIME-WEIGHTED EXPOSURE, NOT VOLUME. The faucet is free, so volume is
 * farmable at zero cost: open, close, repeat. Position-seconds are not —
 * holding exposure occupies collateral, and the faucet rate-limits collateral
 * to 10,000 prmUSD per address per 24h. The score therefore depends only on
 * how much exposure was held and for how long; turnover contributes nothing.
 *
 *     points = Σ over holding intervals  |q| × Δt / 86,400
 *
 * so 1 point = 1 unit of exposure held for 1 day. A round trip inside one
 * block scores |q| × 0 = 0 while paying the 1% fee twice.
 *
 * NOT A CURRENCY. Points are shown as points. The conversion to trading
 * liquidity at launch has no rate yet, and this module never implies one.
 */
import type { Fill } from "./live";
import { fillsAreComplete } from "./live";

/** Seconds in a UTC day. */
const DAY = 86_400;

/**
 * Per-address daily ceiling, in points.
 *
 * One day's faucet (10,000 prmUSD) buys roughly 10,000 units of long
 * exposure, i.e. ~10,000 points/day, so an honest beta tester never reaches
 * this. It exists to flatten the tail: an address that has accumulated many
 * daily drips over weeks could otherwise hold arbitrarily large exposure and
 * dominate the distribution purely by having started early.
 */
export const DAILY_POINT_CAP = 25_000;

export interface PointsBreakdown {
  /** Total points after the daily cap. */
  points: number;
  /** Points before the cap, so the UI can show what was trimmed. */
  uncapped: number;
  /** Days on which the cap bound. */
  cappedDays: number;
  /**
   * Uncapped points per UTC-day index, kept so the cap can be applied ONCE
   * across every market an address traded. Capping per market would let a
   * trader earn N × the cap by spreading exposure over N markets.
   */
  perDay: ReadonlyMap<number, number>;
  /** Exposure currently held, units — what is still accruing. */
  openUnits: number;
  /** Points per day at the current exposure (0 when flat). */
  ratePerDay: number;
  /** First UTC day the account held exposure, or 0 if never. */
  firstDay: number;
  /**
   * False when the log scan did not reach the start of the account's history,
   * so `points` is a LOWER BOUND. The UI must say so rather than show a bare
   * number that understates what someone earned.
   */
  complete: boolean;
}

export const EMPTY_POINTS: PointsBreakdown = {
  points: 0,
  uncapped: 0,
  cappedDays: 0,
  perDay: new Map(),
  openUnits: 0,
  ratePerDay: 0,
  firstDay: 0,
  complete: true,
};

/** Apply the per-address daily ceiling to a day→points map. */
function applyCap(perDay: ReadonlyMap<number, number>) {
  let uncapped = 0;
  let points = 0;
  let cappedDays = 0;
  for (const earned of perDay.values()) {
    uncapped += earned;
    if (earned > DAILY_POINT_CAP) {
      points += DAILY_POINT_CAP;
      cappedDays += 1;
    } else {
      points += earned;
    }
  }
  return { points, uncapped, cappedDays };
}

/**
 * Points for one account on one market.
 *
 * Between two consecutive fills the position is constant at the earlier
 * fill's `newQ`; after the last fill it is constant until `nowSec`. Each
 * interval is split at UTC-day boundaries so the daily cap is exact and
 * recomputable rather than decorative.
 *
 * Both sides earn. Rewarding only Rise would push the book one way, inflate
 * |n| against the OI cap and leave the vault carrying more inventory — a
 * two-sided book is what the curve wants, so Fall earns on the same terms.
 *
 * Exposure held through a Frozen market or a Halted oracle keeps accruing:
 * mint/burn is paused in those states, so the trader cannot exit and is not
 * choosing to sit there. New exposure cannot be opened during a halt, so
 * there is nothing to farm — only exposure that was already at risk.
 */
export function pointsFor(fills: Fill[], nowSec = Math.floor(Date.now() / 1000)): PointsBreakdown {
  if (!fills.length) return EMPTY_POINTS;

  const ordered = [...fills].sort((a, b) => a.timestamp - b.timestamp);
  /** points earned per UTC day index (unix day). */
  const perDay = new Map<number, number>();

  const addInterval = (units: number, from: number, to: number) => {
    if (units <= 0 || to <= from) return;
    let t = from;
    while (t < to) {
      const dayIdx = Math.floor(t / DAY);
      const dayEnd = (dayIdx + 1) * DAY;
      const slice = Math.min(to, dayEnd) - t;
      perDay.set(dayIdx, (perDay.get(dayIdx) ?? 0) + (units * slice) / DAY);
      t += slice;
    }
  };

  for (let i = 0; i < ordered.length; i++) {
    const held = Math.abs(ordered[i].newQ);
    const from = ordered[i].timestamp;
    const to = i + 1 < ordered.length ? ordered[i + 1].timestamp : nowSec;
    addInterval(held, from, to);
  }

  const openUnits = Math.abs(ordered[ordered.length - 1].newQ);
  return {
    ...applyCap(perDay),
    perDay,
    openUnits,
    ratePerDay: Math.min(openUnits, DAILY_POINT_CAP),
    firstDay: Math.floor(ordered[0].timestamp / DAY),
    complete: fillsAreComplete(ordered),
  };
}

/**
 * Sum a trader's points across every market they have touched.
 *
 * The per-day maps are MERGED and the cap applied once to the merged total, so
 * the ceiling is genuinely per address per day. Summing already-capped
 * per-market totals would hand out N × the cap to anyone who split their
 * exposure across N markets.
 */
export function totalPoints(parts: PointsBreakdown[]): PointsBreakdown {
  if (!parts.length) return EMPTY_POINTS;
  const merged = new Map<number, number>();
  for (const part of parts) {
    for (const [day, earned] of part.perDay) {
      merged.set(day, (merged.get(day) ?? 0) + earned);
    }
  }
  const days = parts.map((p) => p.firstDay).filter((d) => d > 0);
  const openUnits = parts.reduce((s, p) => s + p.openUnits, 0);
  return {
    ...applyCap(merged),
    perDay: merged,
    openUnits,
    ratePerDay: Math.min(openUnits, DAILY_POINT_CAP),
    firstDay: days.length ? Math.min(...days) : 0,
    complete: parts.every((p) => p.complete),
  };
}

/** One-line statement of the rule, shown in the UI next to the number. */
export const POINTS_RULE =
  "1 point = 1 unit of exposure held for 1 day, on either side. Trading volume earns nothing — only time holding a position does.";
