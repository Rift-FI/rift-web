/**
 * PREMIA launch market set (docs/PREMIA-SPEC.md §4 + research/).
 *
 * ONE market: the NGN·USDT street-dollar premium flagship, live on Base
 * mainnet and resolved through MarketFactory.
 *
 * The diesel-in-naira energy market was delisted from the UI (2026-11-23).
 * It is deployed and Frozen on chain but is being retired, not launched —
 * see research/ENERGY-REDESIGN.md: a log-level index over a 289-day effective
 * baseline lag carries a standing excess from oil drift alone, so it would
 * have charged ~51%/yr resting funding and paid on a quarter of all days.
 * Argentina CCL and the kimchi premium were listed as "Soon" placeholders and
 * are removed until they are real; a venue with one market it means beats four
 * where three are coming-soon cards.
 *
 * The static numbers below are MOCK-MODE ONLY. In live mode the band, funding
 * horizon, OI cap, odds and open interest all come from contract reads, so a
 * stale constant here can never reach a live screen.
 */
import { oddsRiseOf, payoutOf, fundingDaily } from "./math";
import type { LiveMarket, OraclePush } from "./live";
import type { MarketDef, MarketSnapshot, PricePoint } from "./types";

const env = import.meta.env;
const envStr = (v: unknown, fallback = "") =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;

/** The NGN·USDT premium market, live on Base mainnet (beta deployment). */
const NGN_MARKET_ID = envStr(
  env.VITE_PREMIA_MARKETID_NGN,
  "0x073b4c4094438f226383e78329ff6ff51bea64fc33fc05785a8b5e7555556338"
);
/** Optional pin; empty = resolved from MarketFactory.marketOf at runtime. */
const NGN_MARKET_ADDRESS = envStr(env.VITE_PREMIA_MARKET_NGN);

export const MARKETS: MarketDef[] = [
  {
    id: "ngn-usdt-premium",
    address: NGN_MARKET_ADDRESS,
    marketIdHex: NGN_MARKET_ID,
    symbol: "NGN·USDT",
    question: "Will Nigeria's street-dollar premium spike?",
    blurb: "Pays as the street dollar pulls away from the official naira rate.",
    flag: "🇳🇬",
    tag: "FX · Nigeria",
    flagship: true,
    riseLabel: "Rise",
    fallLabel: "Fall",
    metricLabel: "Premium",
    floorPct: 6,
    capPct: 30,
    normalPct: 3,
    tau: 30,
    premiumNow: 4.74,
    openInterestUsd: 112_400,
    oiCapUsd: 194_108,
    vaultDepthUsd: 250_000,
    volume24hUsd: 86_300,
  },
];

export const marketById = (id: string): MarketDef | undefined =>
  MARKETS.find((m) => m.id === id);

/* ── Deterministic premium history (so the chart reads like a real feed) ── */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** ~`days` daily premium points, a mean-reverting walk landing on premiumNow. */
export function buildHistory(def: MarketDef, days = 120): PricePoint[] {
  const rnd = mulberry32(hashSeed(def.id));
  const out: { date: string; premium: number }[] = [];
  // Start near the normal level and walk to today.
  let p = def.normalPct + (def.premiumNow - def.normalPct) * 0.2;
  const vol = (def.capPct - def.floorPct) * 0.035;
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    // mean-revert toward a drifting target that ends at premiumNow
    const progress = (days - 1 - i) / (days - 1);
    const target = def.normalPct + (def.premiumNow - def.normalPct) * (0.2 + 0.8 * progress);
    p += (target - p) * 0.12 + (rnd() - 0.5) * vol;
    p = Math.max(0, p);
    out.push({ date: d.toISOString().slice(0, 10), premium: p });
  }
  // Pin the last point to the exact current reading.
  out[out.length - 1].premium = def.premiumNow;
  return out.map((o) => ({
    date: o.date,
    premium: round(o.premium, 2),
    oddsRise: round(oddsRiseOf(o.premium, def), 4),
    payout: round(payoutOf(o.premium, def), 4),
  }));
}

const round = (n: number, dp: number) => Number(n.toFixed(dp));

/** Build a full live snapshot from a def + its (optionally mutated) premium. */
export function snapshotOf(def: MarketDef, premium = def.premiumNow, history?: PricePoint[]): MarketSnapshot {
  const hist = history ?? buildHistory(def);
  const yesterday = hist.length > 1 ? hist[hist.length - 2].premium : premium;
  return {
    def,
    premium,
    premium24hAgo: yesterday,
    oddsRise: oddsRiseOf(premium, def),
    oddsFall: 1 - oddsRiseOf(premium, def),
    odds24hAgoRise: oddsRiseOf(yesterday, def),
    payout: payoutOf(premium, def),
    fundingRiseDaily: fundingDaily(premium, def, "rise"),
    fundingFallDaily: fundingDaily(premium, def, "fall"),
    history: hist,
  };
}

/* ── live snapshots (every number a contract read) ───────────────────────── */

/**
 * Build a snapshot straight from contract reads. Nothing here is derived from
 * the mock curve: odds are the live mark M, payout is `payoutNow()`, the
 * premium is the oracle's X, and the history is the oracle's own pushes.
 *
 * Funding: f̃ = (M̄ − Ī)/τ is what LONGS pay per day (spec §2.3), so the Rise
 * side earns −f̃. We use the instantaneous M and I, which is what the next
 * `settleFunding()` will be based on.
 */
export function snapshotFromLive(
  def: MarketDef,
  live: LiveMarket,
  pushes: OraclePush[] = []
): MarketSnapshot {
  const premium = live.oracle.x * 100;
  const hist: PricePoint[] = pushes.map((p) => ({
    date: new Date(p.day * 86_400_000).toISOString().slice(0, 10),
    premium: round(p.x * 100, 2),
    oddsRise: round(live.mark, 6),
    payout: round(payoutBasis(p.x, live.cfg.floor, live.cfg.cap), 4),
  }));
  if (!hist.length) {
    hist.push({
      date: new Date().toISOString().slice(0, 10),
      premium: round(premium, 2),
      oddsRise: round(live.mark, 6),
      payout: round(live.payout, 4),
    });
  }
  const prev = pushes.length > 1 ? pushes[pushes.length - 2].x * 100 : premium;
  // f̃ = (M̄ − Ī)/τ is what longs pay per day; the Rise side earns −f̃.
  const fLongPaysPerDay = (live.mark - live.payout) / Math.max(1, live.cfg.tau);
  const risePct = -fLongPaysPerDay * 100;
  const marksUnavailable = !live.hasIndex;

  return {
    def,
    premium,
    premium24hAgo: prev,
    oddsRise: live.mark,
    oddsFall: 1 - live.mark,
    odds24hAgoRise: live.mark,
    payout: live.payout,
    fundingRiseDaily: risePct,
    fundingFallDaily: -risePct,
    history: marksUnavailable ? [] : hist,
    live: true,
    ...(marksUnavailable ? { marksUnavailable: true } : {}),
    ...(blockedReason(live) ? { blockedReason: blockedReason(live) } : {}),
    address: live.address,
    marketState: live.state,
    oracleStatus: live.oracle.status,
    oracleStale: live.oracle.isStale,
    oracleSources: live.oracle.liveSources,
    oracleUpdatedAt: live.oracle.publishedAt,
    floorPct: live.cfg.floor * 100,
    capPct: live.cfg.cap * 100,
    normalPct: live.cfg.mu * 100,
    tauDays: live.cfg.tau,
    openInterest: live.openInterest,
    oiCap: live.openInterestCap,
    curveDepth: live.curveDepth,
    marketCapital: live.marketCapital,
    vaultEquity: live.vaultEquity,
    block: live.block,
  };
}

/**
 * Why a live market can't be traded right now, in words a trader can act on.
 * Empty string = it is Active and quoting.
 */
function blockedReason(live: LiveMarket): string {
  if (!live.hasIndex) {
    return live.oracle.publishedAt === 0
      ? "Waiting for the oracle's first index push — the baseline is still being seeded from history."
      : "The index feed is stale or halted, so the market can't quote a price.";
  }
  if (live.state === 2) return "Frozen: the oracle feed is halted, so trading is paused. Collateral stays withdrawable.";
  if (live.state === 1) return "Closing only: no new positions right now — existing ones can still be closed.";
  if (live.oracle.status === 1) return "The index feed is degraded, so no new positions can open.";
  return "";
}

/** I = clamp((X − F)/(C − F), 0, 1) with on-chain (fractional) F and C. */
function payoutBasis(x: number, floor: number, cap: number): number {
  if (cap <= floor) return 0;
  return Math.min(1, Math.max(0, (x - floor) / (cap - floor)));
}

/**
 * Placeholder snapshot for a market that is listed in the UI but has no
 * on-chain deployment yet. Deliberately carries no odds/premium so live mode
 * never shows a mock number next to a real one.
 */
export function snapshotNotDeployed(def: MarketDef, error?: string): MarketSnapshot {
  return {
    def,
    premium: 0,
    premium24hAgo: 0,
    oddsRise: 0,
    oddsFall: 0,
    odds24hAgoRise: 0,
    payout: 0,
    fundingRiseDaily: 0,
    fundingFallDaily: 0,
    history: [],
    live: true,
    notDeployed: true,
    ...(error ? { error } : {}),
  };
}
