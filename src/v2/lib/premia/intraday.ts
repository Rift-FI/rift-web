/**
 * Intraday candles for the street leg, and what can honestly be derived from them.
 *
 * SOURCE: Quidax `usdtngn/k?period=<MINUTES>&limit=<N>` -> [unixSeconds, o, h, l, c, vol].
 * Verified periods: 1, 5, 15, 60, 240, 1440, 10080. Fetched through our own
 * origin (`/px/street?period=...`, see vite.config.ts and vercel.json) because
 * Quidax sends `Access-Control-Allow-Origin: *` twice, which every browser
 * rejects. The official leg is NOT fetched here; see below.
 *
 * WHY THE PREMIUM CAN BE INTRADAY AT ALL
 * The official rate is a daily FX fixing and does not move intraday. Dividing a
 * genuine intraday street range by that day's official rate therefore keeps the
 * range and its ordering: all of the intraday movement in the premium really
 * does come from the street leg. The highs and lows are real, not invented.
 * (If the official rate ever starts moving intraday this stops being true.)
 *
 * WHAT IS DELIBERATELY NOT HERE
 * The stress index (7-day average over a 180-day lagged baseline, published once
 * a day) and the Rise/Fall price (a step function of fills) have no intraday
 * resolution. Nothing in this file produces values for them.
 */
import type { HistoryPoint } from "./history";

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1D" | "1W";

export const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1D", "1W"];

/** Quidax periods, in minutes, for the timeframes fetched from Quidax. */
const PERIOD: Partial<Record<Timeframe, number>> = { "1m": 1, "5m": 5, "15m": 15, "1h": 60, "4h": 240 };

/** True for timeframes backed by an intraday Quidax fetch. */
export const isIntraday = (tf: Timeframe) => tf in PERIOD;

export interface TimedBar {
  /** Unix seconds, bar open. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

const LIMIT = 1000;
const TTL_MS = 60_000;
const DAY = 86_400;

const cache = new Map<number, { at: number; bars: TimedBar[] }>();
const inFlight = new Map<number, Promise<TimedBar[]>>();

/** Not cancellable, for the same StrictMode reason as history.ts `legs`. */
export function fetchStreetBars(tf: Timeframe): Promise<TimedBar[]> {
  const period = PERIOD[tf];
  if (!period) return Promise.reject(new Error(`no intraday source for ${tf}`));
  const hit = cache.get(period);
  if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.bars);
  let p = inFlight.get(period);
  if (!p) {
    p = (async () => {
      const r = await fetch(`/px/street?period=${period}&limit=${LIMIT}`, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`/px/street ${period} ${r.status}`);
      const json = (await r.json()) as { data?: number[][] };
      const byT = new Map<number, TimedBar>();
      for (const k of json.data ?? []) {
        const [t, o, h, l, c] = [Number(k[0]), Number(k[1]), Number(k[2]), Number(k[3]), Number(k[4])];
        if (Number.isFinite(t) && [o, h, l, c].every((v) => Number.isFinite(v) && v > 0)) byT.set(t, { t, o, h, l, c });
      }
      const bars = [...byT.values()].sort((a, b) => a.t - b.t);
      if (!bars.length) throw new Error("no street candles");
      cache.set(period, { at: Date.now(), bars });
      return bars;
    })().finally(() => inFlight.delete(period));
    inFlight.set(period, p);
  }
  return p;
}

export interface Derived {
  /** Street NGN/$ candles. */
  rates: TimedBar[];
  /** Premium candles, in percent: street OHLC over the day's official rate, minus 1. */
  premium: TimedBar[];
  /** Official rate in force at each bar, for the step line. */
  official: { t: number; v: number }[];
}

/** Official fixing for the UTC day containing `t` (nearest earlier day if absent). */
function officialLookup(points: HistoryPoint[]) {
  return (t: number): number | null => {
    const day = Math.floor(t / DAY) * DAY;
    let lo = 0;
    let hi = points.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (points[mid].t <= day) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return found < 0 ? null : points[found].official;
  };
}

/** Pair intraday street bars with the day's official rate. Bars before the official series starts are dropped. */
export function deriveIntraday(street: TimedBar[], points: HistoryPoint[]): Derived {
  const off = officialLookup(points);
  const out: Derived = { rates: [], premium: [], official: [] };
  for (const b of street) {
    const o = off(b.t);
    if (o == null) continue;
    out.rates.push(b);
    out.premium.push({ t: b.t, o: (b.o / o - 1) * 100, h: (b.h / o - 1) * 100, l: (b.l / o - 1) * 100, c: (b.c / o - 1) * 100 });
    out.official.push({ t: b.t, v: o });
  }
  return out;
}

/**
 * 1W is aggregated from the real daily bars (Monday-aligned UTC weeks, which is
 * how Quidax's own weekly candle is cut): open of the first day, highest high,
 * lowest low, close of the last. Premium weeks aggregate the daily PREMIUM bars,
 * so each day keeps its own official denominator instead of one rate being
 * applied across a week in which the official rate does move.
 */
export function aggregateWeekly(points: HistoryPoint[]): Derived {
  const weeks = new Map<number, HistoryPoint[]>();
  for (const p of points) {
    const start = p.t - ((Math.floor(p.t / DAY) + 3) % 7) * DAY;
    const arr = weeks.get(start);
    if (arr) arr.push(p);
    else weeks.set(start, [p]);
  }
  const out: Derived = { rates: [], premium: [], official: [] };
  for (const [t, ps] of [...weeks.entries()].sort((a, b) => a[0] - b[0])) {
    const roll = (pick: (p: HistoryPoint) => { o: number; h: number; l: number; c: number }, k = 1): TimedBar => ({
      t,
      o: pick(ps[0]).o * k,
      h: Math.max(...ps.map((p) => pick(p).h)) * k,
      l: Math.min(...ps.map((p) => pick(p).l)) * k,
      c: pick(ps[ps.length - 1]).c * k,
    });
    out.rates.push(roll((p) => p.streetBar));
    out.premium.push(roll((p) => p.premiumBar, 100));
    out.official.push({ t, v: ps[ps.length - 1].official });
  }
  return out;
}
