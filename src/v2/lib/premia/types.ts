/**
 * PREMIA domain types. Presentation layer over IPerpMarket (docs/UX-FRAMING.md):
 * the engine's long/short + mark M + funding are surfaced as ▲ Rise / ▼ Fall,
 * odds, and yield / holding cost. These stay honest — no all-or-nothing-on-a-date.
 */

export type Side = "rise" | "fall";

/** Static per-market definition (mirrors PremiaTypes.MarketConfig, framed for UX). */
export interface MarketDef {
  id: string;
  /**
   * On-chain PerpMarket address. Empty = resolve it from
   * `MarketFactory.marketOf(marketIdHex)` at runtime (live mode).
   */
  address: string;
  /**
   * bytes32 marketId as deployed. Empty = this market has no on-chain
   * deployment yet, so in live mode it is listed but not tradable.
   */
  marketIdHex: string;
  /** Short ticker, e.g. "NGN·USDT". */
  symbol: string;
  /** Headline question, Polymarket-style. */
  question: string;
  /** One-line plain-language description of what's being traded. */
  blurb: string;
  /**
   * ISO-3166 alpha-2, for the wallet's <Flag> SVG component. An emoji flag is
   * deliberately NOT carried here: the codepoints degrade to the bare letters
   * "NG" on Windows Chrome, which is what shipped before.
   */
  iso: string;
  tag: string;
  flagship?: boolean;
  /** Side labels — defaults Rise/Fall, some markets read Spike/Calm etc. */
  riseLabel: string;
  fallLabel: string;
  /** What the premium measures + its unit for the chart. */
  metricLabel: string;
  /** Band + funding params (percent points; τ in days). */
  floorPct: number; // F
  capPct: number; // C
  normalPct: number; // μ
  tau: number; // funding horizon, days
  /** Current measured premium (%), e.g. +4.74 for Nigeria today. */
  premiumNow: number;
  /** Rolling depth / open-interest for the stats strip (USD). */
  openInterestUsd: number;
  oiCapUsd: number;
  vaultDepthUsd: number;
  /** 24h trading volume (USD). */
  volume24hUsd: number;
}

/** Live, derived market state (ticks gently in mock mode). */
export interface MarketSnapshot {
  def: MarketDef;
  /** Premium now (%). */
  premium: number;
  premium24hAgo: number;
  /** Mark M ∈ [0,1] — the odds the Rise side trades at. */
  oddsRise: number;
  oddsFall: number;
  odds24hAgoRise: number;
  /** Payout basis I ∈ [0,1] (clamp((premium−F)/(C−F))). */
  payout: number;
  /** Funding as %/day for each side (+ = you earn/yield, − = holding cost). */
  fundingRiseDaily: number;
  fundingFallDaily: number;
  /** Daily premium history for the chart. */
  history: PricePoint[];
  /**
   * The mark's real step history, one point per on-chain fill (live only).
   * The chart prefers this over `history[].oddsRise`, which can only repeat
   * the mark as it is now.
   */
  markSeries?: { t: number; mark: number }[];
  /** ── live-mode extras (undefined in mock mode) ───────────────────────── */
  /** True once this snapshot is backed by contract reads. */
  live?: boolean;
  /** Resolved PerpMarket address. */
  address?: string;
  /** 0 Active · 1 ClosingOnly · 2 Frozen. */
  marketState?: number;
  /** 0 Healthy · 1 Degraded · 2 Halted. */
  oracleStatus?: number;
  oracleStale?: boolean;
  oracleSources?: number;
  /** Unix seconds of the last oracle push. */
  oracleUpdatedAt?: number;
  /** Open interest |n| and its cap, in $ of max payout. */
  openInterest?: number;
  oiCap?: number;
  /** Band + funding horizon as the market's own `config()` reports them. */
  floorPct?: number;
  capPct?: number;
  normalPct?: number;
  tauDays?: number;
  /** Curve depth b = κ·K, and the vault capital behind this market. */
  curveDepth?: number;
  marketCapital?: number;
  vaultEquity?: number;
  /** Block the reads were taken at. */
  block?: number;
  /** True when the market is listed but has no on-chain deployment yet. */
  notDeployed?: boolean;
  /**
   * True when the oracle has not published a usable index for this market, so
   * there is no honest mark: odds, payout and funding must read as unknown
   * rather than showing the curve's λ=0 placeholder (a flat 50¢).
   */
  marksUnavailable?: boolean;
  /** Plain-language reason the market is not tradable right now. */
  blockedReason?: string;
  /** Set when the live reads failed, so the UI can say so instead of guessing. */
  error?: string;
}

export interface PricePoint {
  /** YYYY-MM-DD */
  date: string;
  premium: number;
  oddsRise: number;
  payout: number;
}

/**
 * A trader's open position in one market. In mock mode this is the local
 * ledger; in live mode every field is derived from `positionOf` /
 * `accountValue` plus the account's real `PositionModified` fill history.
 */
export interface Position {
  marketId: string;
  side: Side;
  /** prmUSD spent to open (cost + fee + collateral locked). */
  stake: number;
  /** Units held; each unit is backed by, and pays at most, 1 prmUSD. */
  units: number;
  /** Entry odds (mark) for the chosen side, 0..1. */
  entryOdds: number;
  /** Funding accrued so far (prmUSD, + earned / − paid). */
  fundingAccrued: number;
  openedAt: number;
  /** ── live-mode extras ────────────────────────────────────────────────── */
  /** Collateral locked behind the position, $ (live only). */
  lockedCollateral?: number;
  /** `accountValue` — what closing returns to the free balance, $ (live only). */
  realisable?: number;
  /** Σ(cost + fee) actually paid, from on-chain fills (live only). */
  paid?: number;
  /** True when a cost basis could not be reconstructed from logs. */
  basisUnknown?: boolean;
  /**
   * True while the fill scan is still running. Distinct from `basisUnknown`:
   * "we don't know yet" must not render as "we can never know", which is what
   * made a position opened minutes ago show a P/L of "—".
   */
  basisPending?: boolean;
}

export interface Portfolio {
  /** Free (withdrawable) collateral in the vault — the trading balance. */
  prmUSD: number;
  positions: Position[];
  /** ── live-mode extras ────────────────────────────────────────────────── */
  /** prmUSD held in the wallet but not yet deposited (live only). */
  walletPrmUSD?: number;
  /** prmUSD the vault is approved to pull (live only). */
  allowance?: number;
  /** Collateral locked across markets, $ (live only). */
  locked?: number;
  /** Unix seconds the faucet can next be used, 0 = now (live only). */
  faucetReadyAt?: number;
  /** What faucet() will mint, read from the contract (live only). */
  faucetAmount?: number;
}
