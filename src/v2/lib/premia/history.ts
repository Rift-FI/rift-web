/**
 * The street-dollar premium, reconstructed from a year of real daily prints.
 *
 * WHY THIS EXISTS
 * The on-chain oracle is the authority on the index, but it only began
 * accumulating history on 2026-11-22. Two points is not a chart, and a trader
 * being asked "will the premium spike?" cannot answer it without seeing where
 * the premium has actually been. So this rebuilds the same quantities the
 * oracle computes, from the same public prints the oracle's own calibration
 * used (research/MREF-CALIBRATION.md §1), entirely in the browser.
 *
 * SOURCES:
 *   street   Quidax usdtngn daily candles      ₦ per street dollar
 *   official CoinGecko tether priced in NGN    ₦ per official dollar
 *
 * Quidax is proxied through our origin and CoinGecko is fetched direct — see
 * the note on the two constants below for why they differ.
 *
 * The CoinGecko leg is FX-derived — it converts a USD price at the interbank
 * rate — so it IS the official rate by construction (ORACLE-DATA.md §1.4).
 * That is the same trick the calibration used to get an official series with
 * daily history, and it is why the two legs are commensurable.
 *
 * HONESTY BOUNDARIES — read before trusting a number from here:
 *  1. This is a RECONSTRUCTION, not the oracle's own series. The oracle takes
 *     a depth-gated, MAD-filtered, weight-capped volume-weighted median over
 *     seven venues; this uses one venue's close. The calibration measured the
 *     gap at +0.074% on the street leg.
 *  2. The denominators differ. The oracle's live denominator is open.er-api
 *     (~2% off CBN NAFEM by its own note); this uses CoinGecko. So the level
 *     here can sit a point away from the oracle's `premium`. Shape is sound;
 *     the last digit is not.
 *  3. The baseline cold-starts at the first day's window average, so the
 *     earliest third of the index series is still shaking off its seed. Only
 *     the settled tail is offered — see `SPIN_UP_DAYS`.
 * Anything with money on it reads the chain. This is context, and every
 * surface that renders it says so.
 */

/** Oldest→newest daily row of the reconstruction. */
export interface HistoryPoint {
  /** UTC date, `YYYY-MM-DD`. */
  date: string;
  /** Unix seconds at 00:00 UTC — the chart's x. */
  t: number;
  /** ₦ per dollar on the street (Quidax USDT/NGN close). */
  street: number;
  /** ₦ per dollar official (CoinGecko tether-in-NGN, FX-derived). */
  official: number;
  /** street/official − 1, as a fraction. The raw daily signal R_t. */
  premium: number;
  /** R̄_t — the 7-day window average the index is actually built on. */
  rBar: number;
  /** B_t — the slow lagged baseline R̄ is measured against. */
  baseline: number;
  /** X_t = max(μ + R̄_t − B_t, 0) — the stress index. What you trade. */
  index: number;
}

export interface HistorySeries {
  points: HistoryPoint[];
  /** Index of the first point whose baseline has shaken off its seed. */
  settledFrom: number;
  /** Highest premium in the window, and when. */
  peak: { premium: number; date: string };
  /** Days in the window the premium sat at or above the market's floor. */
  daysAboveFloor: number;
  /** Window length in days. */
  days: number;
}

/* ── the oracle's parameters, mirrored ─────────────────────────────────── */

/**
 * These MUST track `premia-oracle/src/markets/nigeria-premium.ts`. They are
 * duplicated rather than imported because that service is a separate deploy;
 * if it ever changes them, this file is the other half of the change.
 */
export const NGN_PARAMS = {
  /** Window, days. */
  w: 7,
  /** H_B — baseline half-life, days. */
  baselineHalfLifeDays: 180,
  /** ℓ — baseline lag, days. */
  baselineLagDays: 30,
  /** μ — normal level; 0 for a premium (ratio) market. */
  mu: 0,
} as const;

/**
 * The EWMA's initial condition decays as (1−a)^t. At H_B = 180 a 365-day
 * window still carries ~25% of the seed, so the first half of the series is
 * withheld from anything that claims to be the index.
 */
const SPIN_UP_DAYS = 180;

/** CoinGecko's free daily window. The binding constraint on how far back we see. */
const WINDOW_DAYS = 365;

/* ── the index pipeline, mirrored from the oracle ──────────────────────── */

/**
 * Byte-for-byte the recurrence in `premia-oracle/src/pipeline/baseline.ts`:
 *
 *   R̄_t = mean(R over the trailing w days)
 *   B_t = B_{t-1} + a·(R̄_{t-ℓ} − B_{t-1}),   a = 1 − 2^(−1/H_B)
 *   X_t = max(μ + R̄_t − B_t, 0)
 *
 * Kept as a standalone pure function so it can be tested against the service's
 * own vectors without pulling the network in.
 */
export function baselineSeries(
  premiums: number[],
  p: { w: number; baselineHalfLifeDays: number; baselineLagDays: number; mu: number } = NGN_PARAMS
): { rBar: number[]; baseline: number[]; index: number[] } {
  const n = premiums.length;
  const a = 1 - Math.pow(2, -1 / p.baselineHalfLifeDays);

  const rBar = new Array<number>(n);
  for (let t = 0; t < n; t++) {
    const lo = Math.max(0, t - p.w + 1);
    let s = 0;
    let c = 0;
    for (let u = lo; u <= t; u++) {
      s += premiums[u];
      c++;
    }
    rBar[t] = s / c;
  }

  const baseline = new Array<number>(n);
  let prev = rBar[0] ?? 0;
  for (let t = 0; t < n; t++) {
    const lagIdx = t - p.baselineLagDays;
    const target = lagIdx >= 0 ? rBar[lagIdx] : rBar[0] ?? 0;
    prev = prev + a * (target - prev);
    baseline[t] = prev;
  }

  const index = rBar.map((r, t) => Math.max(p.mu + r - baseline[t], 0));
  return { rBar, baseline, index };
}

/* ── fetching ──────────────────────────────────────────────────────────── */

/**
 * The two legs are fetched DIFFERENTLY, on purpose.
 *
 * Quidax goes through our own origin (`/px/street` — see vercel.json
 * `rewrites` and vite.config.ts `server.proxy`) because it answers with
 * `Access-Control-Allow-Origin: *` TWICE, and a duplicated ACAO header fails
 * CORS in every browser however permissive its value.
 *
 * CoinGecko is fetched DIRECT. Its CORS is clean, and proxying it actively
 * breaks: the free API refuses datacenter egress, so the same request that
 * succeeds from a browser returns 403 from a Vercel function. Fetching from
 * the client also spreads the rate limit across users instead of funnelling
 * every visitor through one set of origin IPs.
 */
const QUIDAX = "/px/street";
const COINGECKO =
  "https://api.coingecko.com/api/v3/coins/tether/market_chart?vs_currency=ngn&days=365&interval=daily";

const CACHE_KEY = "premia.history.ngn.v1";
/** Daily data; a six-hour cache is still same-day fresh and spares the rate limit. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const utcDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const utcSeconds = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 1000);

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  // `url` is a same-origin path, so it is the useful half of the message.
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return (await r.json()) as T;
}

/** Quidax: `data` is [unixSeconds, open, high, low, close, volume]. */
async function pullStreet(): Promise<Map<string, number>> {
  const r = await getJson<{ data?: number[][] }>(QUIDAX);
  const out = new Map<string, number>();
  for (const c of r.data ?? []) {
    const close = Number(c[4]);
    if (Number.isFinite(close) && close > 0) out.set(utcDate(Number(c[0]) * 1000), close);
  }
  if (!out.size) throw new Error("no street candles");
  return out;
}

/** CoinGecko: `prices` is [unixMs, price]. */
async function pullOfficial(): Promise<Map<string, number>> {
  const r = await getJson<{ prices?: [number, number][] }>(COINGECKO);
  const out = new Map<string, number>();
  for (const [ms, px] of r.prices ?? []) {
    if (Number.isFinite(px) && px > 0) out.set(utcDate(ms), px);
  }
  if (!out.size) throw new Error("no official prints");
  return out;
}

/** Join the two legs on UTC date and run the oracle's pipeline over the result. */
function build(street: Map<string, number>, official: Map<string, number>, floorPct: number): HistorySeries {
  const dates = [...official.keys()]
    .filter((d) => street.has(d))
    .sort()
    .slice(-WINDOW_DAYS);
  if (dates.length < 30) throw new Error("not enough overlapping days");

  const premiums = dates.map((d) => street.get(d)! / official.get(d)! - 1);
  const { rBar, baseline, index } = baselineSeries(premiums);

  const points: HistoryPoint[] = dates.map((date, i) => ({
    date,
    t: utcSeconds(date),
    street: street.get(date)!,
    official: official.get(date)!,
    premium: premiums[i],
    rBar: rBar[i],
    baseline: baseline[i],
    index: index[i],
  }));

  let peak = points[0];
  for (const p of points) if (p.premium > peak.premium) peak = p;

  const floor = floorPct / 100;
  return {
    points,
    settledFrom: Math.min(SPIN_UP_DAYS, Math.floor(points.length / 2)),
    peak: { premium: peak.premium, date: peak.date },
    daysAboveFloor: points.filter((p) => p.premium >= floor).length,
    days: points.length,
  };
}

/* ── cache + single-flight ─────────────────────────────────────────────── */

interface Cached {
  at: number;
  street: [string, number][];
  official: [string, number][];
}

function readCache(): Cached | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    if (!c?.at || Date.now() - c.at > CACHE_TTL_MS) return null;
    if (!Array.isArray(c.street) || !Array.isArray(c.official)) return null;
    return c;
  } catch {
    // private mode, blocked storage, corrupt entry — all mean "no cache"
    return null;
  }
}

function writeCache(street: Map<string, number>, official: Map<string, number>) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), street: [...street], official: [...official] } satisfies Cached)
    );
  } catch {
    /* over quota or blocked — the series still works, it just refetches */
  }
}

let inFlight: Promise<{ street: Map<string, number>; official: Map<string, number> }> | null = null;

/**
 * DELIBERATELY NOT CANCELLABLE.
 *
 * An earlier version threaded an AbortSignal through here, and it broke under
 * React StrictMode: the first mount starts the request, its immediate cleanup
 * aborts it, and the second mount joins the SAME already-rejected promise
 * before `finally` can clear it — so the series never loaded in development
 * and would have raced the same way behind any remount in production.
 *
 * Cancelling is wrong on its own terms too. This request is shared by every
 * subscriber on the page and cached for six hours; one component unmounting
 * is no reason to abandon a fetch another component is waiting on. Callers
 * drop late results instead, which costs nothing and cannot race.
 */
async function legs() {
  const hit = readCache();
  if (hit) return { street: new Map(hit.street), official: new Map(hit.official) };
  if (!inFlight) {
    inFlight = (async () => {
      // Both legs are required: a premium needs a numerator AND a denominator.
      const [street, official] = await Promise.all([pullStreet(), pullOfficial()]);
      writeCache(street, official);
      return { street, official };
    })().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/**
 * The reconstructed series, or `null` if either public leg is unreachable.
 *
 * Null is a first-class answer: the caller falls back to the on-chain points
 * and says the context is unavailable. It never substitutes a fabricated
 * series for a failed fetch.
 */
export async function fetchHistory(floorPct: number): Promise<HistorySeries | null> {
  try {
    const { street, official } = await legs();
    return build(street, official, floorPct);
  } catch {
    return null;
  }
}
