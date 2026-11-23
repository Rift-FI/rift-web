/**
 * PREMIA live on-chain reads (Base mainnet).
 *
 * Everything the trading UI shows in live mode comes from here — no mock
 * numbers, no backend. Reads go over plain JSON-RPC with an automatic fallback
 * across the configured endpoints; writes go through the Rift wallet
 * (see client.ts), so this module never needs a signer.
 *
 * Reads covered (task §1):
 *   market : markPrice, referenceMark, payoutNow, netInventory, curveDepth,
 *            fundingIndex, openInterestCap, state, config, positionOf,
 *            accountValue, pendingRepriceCharge
 *   vault  : freeBalance, lockedBalance, totalEquity, marketCapital
 *   token  : balanceOf, allowance, lastFaucet
 *   oracle : latest (X, X̄, λ, sources, day), status, isStale, liveSources
 *   factory: marketOf(marketId) → the PerpMarket address (task §2)
 */
import { Contract, JsonRpcProvider, type JsonRpcApiProviderOptions } from "ethers";
import {
  COLLATERAL_VAULT_ABI,
  MARKET_FACTORY_ABI,
  ORACLE_ADAPTER_ABI,
  PERP_MARKET_ABI,
  PRMUSD_ABI,
} from "./abi";
import { PREMIA_CONFIG } from "./config";

export const WAD = 1_000_000_000_000_000_000n;
const USDC_TO_WAD = 1_000_000_000_000n; // 1e12

/* ── provider with endpoint failover ─────────────────────────────────────── */

const PROVIDER_OPTS: JsonRpcApiProviderOptions = {
  staticNetwork: true,
  batchMaxCount: 20,
  polling: false,
};

let providerIdx = 0;
const providers = new Map<string, JsonRpcProvider>();

function providerAt(i: number): JsonRpcProvider {
  const url = PREMIA_CONFIG.rpcUrls[i % PREMIA_CONFIG.rpcUrls.length];
  let p = providers.get(url);
  if (!p) {
    p = new JsonRpcProvider(url, PREMIA_CONFIG.chainId, PROVIDER_OPTS);
    providers.set(url, p);
  }
  return p;
}

/** Run `fn` against the current RPC, rotating to the next one on failure. */
export async function withProvider<T>(fn: (p: JsonRpcProvider) => Promise<T>): Promise<T> {
  const n = PREMIA_CONFIG.rpcUrls.length;
  let lastErr: unknown;
  for (let attempt = 0; attempt < n; attempt++) {
    const i = providerIdx + attempt;
    try {
      const out = await fn(providerAt(i));
      providerIdx = i % n; // stick with whatever worked
      return out;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All Base RPC endpoints failed");
}

/* ── unit helpers ────────────────────────────────────────────────────────── */

/** WAD bigint → number (safe for the magnitudes PREMIA deals in). */
export const fromWad = (v: bigint): number => Number(v) / 1e18;
/** 6-dp bigint → number. */
export const from6 = (v: bigint): number => Number(v) / 1e6;
/** number → 6-dp bigint (floor, so we never try to spend more than we have). */
export const to6 = (v: number): bigint => BigInt(Math.floor(v * 1e6));
/** number → WAD bigint. */
export const toWad = (v: number): bigint => BigInt(Math.round(v * 1e6)) * USDC_TO_WAD;

/* ── shapes ──────────────────────────────────────────────────────────────── */

export interface OracleReading {
  /** X_t — the stress index, as a FRACTION (0.0474 = 4.74%). */
  x: number;
  /** X̄_t — the w-day window average, as a fraction. */
  xBar: number;
  lambdaRef: number;
  sources: number;
  /** UTC day index of the observation. */
  day: number;
  /** Unix seconds of the push. */
  publishedAt: number;
  /** 0 Healthy · 1 Degraded · 2 Halted. */
  status: number;
  isStale: boolean;
  liveSources: number;
}

export interface MarketConfigOnChain {
  /** μ normal level, as a fraction. */
  mu: number;
  /** F payout floor, as a fraction. */
  floor: number;
  /** C payout cap, as a fraction. */
  cap: number;
  /** τ funding horizon, days. */
  tau: number;
  /** w averaging window, days. */
  w: number;
  rho: number;
  clusterId: number;
}

export interface LiveMarket {
  address: string;
  marketIdHex: string;
  /** 0 Active · 1 ClosingOnly · 2 Frozen. */
  state: number;
  /**
   * True once the oracle has actually published an index for this market and
   * it is not stale. A market that has never been pushed still answers
   * `markPrice()` — with λ = 0, i.e. a flat 50¢ — which is a placeholder, not
   * a price. Everything downstream must refuse to quote odds when this is
   * false rather than show that 50¢ as if it meant something.
   */
  hasIndex: boolean;
  /** Mark M ∈ [0,1] — the price the long/Rise side trades at. */
  mark: number;
  /** M^ref(X̄) — the oracle-anchored mark at zero inventory. */
  referenceMark: number;
  /** Payout basis I ∈ [0,1]. */
  payout: number;
  /** Net inventory n, in units (signed; 1 unit ↔ 1 prmUSD max payout). */
  netInventory: number;
  /** Curve depth b = κ·K, in units. */
  curveDepth: number;
  /** Cumulative funding index, $/unit. */
  fundingIndex: number;
  /** OI cap, in units ≡ $ of max payout. */
  openInterestCap: number;
  /** Open interest now = |n|. */
  openInterest: number;
  cfg: MarketConfigOnChain;
  oracle: OracleReading;
  /** Vault equity E_t and the capital K_m backing this market, in $. */
  vaultEquity: number;
  marketCapital: number;
  /** Block the reads were taken at. */
  block: number;
  fetchedAt: number;
}

export interface LivePosition {
  /** Signed size in units (+ long/Rise, − short/Fall). */
  q: number;
  /** cumFunding captured at the position's last touch, $/unit. */
  fundingSnapshot: number;
  /** Collateral locked behind the position, $. */
  lockedCollateral: number;
  /** Realisable value now (what closing returns to free balance), $. */
  accountValue: number;
  /** Pending jump-repricing charge, $. */
  pendingCharge: number;
}

export interface LiveAccount {
  address: string;
  /** prmUSD sitting in the wallet (not yet deposited). */
  walletPrmUSD: number;
  /** prmUSD the vault is allowed to pull. */
  allowance: number;
  /** Free (unlocked) collateral in the vault, $. */
  vaultFree: number;
  /** Collateral locked behind this market's position, $. */
  vaultLocked: number;
  position: LivePosition;
  /** Unix seconds the faucet can next be used (0 = now). */
  faucetReadyAt: number;
  /**
   * What `faucet()` will actually mint, READ FROM THE CONTRACT.
   *
   * This is never taken from config: the UI must state the amount the chain
   * is about to send, and `FAUCET_AMOUNT` is a `constant` in the deployed
   * token with no setter, so a config value could silently diverge from it.
   */
  faucetAmount: number;
  fetchedAt: number;
}

/* ── contract handles ────────────────────────────────────────────────────── */

const A = PREMIA_CONFIG.addresses;

const market = (p: JsonRpcProvider, addr: string) => new Contract(addr, PERP_MARKET_ABI as unknown as string[], p);
const vault = (p: JsonRpcProvider) => new Contract(A.collateralVault, COLLATERAL_VAULT_ABI as unknown as string[], p);
const token = (p: JsonRpcProvider) => new Contract(A.prmUSD, PRMUSD_ABI as unknown as string[], p);
const oracle = (p: JsonRpcProvider) => new Contract(A.oracleAdapter, ORACLE_ADAPTER_ABI as unknown as string[], p);
const factory = (p: JsonRpcProvider) => new Contract(A.marketFactory, MARKET_FACTORY_ABI as unknown as string[], p);

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

/* ── market address resolution (task §2) ─────────────────────────────────── */

const addrCache = new Map<string, string>();

/**
 * Resolve a marketId to its PerpMarket address via MarketFactory.marketOf.
 * An env/def override wins so a market can be pinned without a factory read.
 */
export async function resolveMarketAddress(marketIdHex: string, override?: string): Promise<string> {
  if (override && override !== ZERO_ADDR) return override;
  const hit = addrCache.get(marketIdHex);
  if (hit) return hit;
  const addr = (await withProvider((p) => factory(p).marketOf(marketIdHex))) as string;
  if (!addr || addr === ZERO_ADDR) throw new Error("Market not deployed on this chain");
  addrCache.set(marketIdHex, addr);
  return addr;
}

/** All marketIds the factory knows about. */
export async function listMarketIds(): Promise<string[]> {
  const ids = (await withProvider((p) => factory(p).allMarkets())) as string[];
  return ids.map((i) => i.toLowerCase());
}

/* ── market snapshot ────────────────────────────────────────────────────── */

/**
 * A read that may revert on a market with no (or a stale) oracle index.
 * `markPrice`, `referenceMark`, `accountValue` and `quote` all go through
 * `latestChecked`, so they are not guaranteed to answer; fall back instead of
 * failing the whole snapshot.
 */
async function soft<T>(call: Promise<T>, fallback: T): Promise<T> {
  try {
    return await call;
  } catch {
    return fallback;
  }
}

export async function readMarket(marketIdHex: string, addressOverride?: string): Promise<LiveMarket> {
  const address = await resolveMarketAddress(marketIdHex, addressOverride);
  return withProvider(async (p) => {
    const m = market(p, address);
    const o = oracle(p);
    const v = vault(p);
    const [
      state,
      mark,
      refMark,
      payout,
      n,
      b,
      fundingIdx,
      oiCap,
      cfg,
      latest,
      status,
      isStale,
      liveSources,
      equity,
      capital,
      block,
    ] = await Promise.all([
      m.state() as Promise<bigint>,
      soft(m.markPrice() as Promise<bigint>, 0n),
      soft(m.referenceMark() as Promise<bigint>, 0n),
      m.payoutNow() as Promise<bigint>,
      m.netInventory() as Promise<bigint>,
      m.curveDepth() as Promise<bigint>,
      m.fundingIndex() as Promise<bigint>,
      m.openInterestCap() as Promise<bigint>,
      m.config() as Promise<Record<string, bigint>>,
      o.latest(marketIdHex) as Promise<Record<string, bigint>>,
      o.status(marketIdHex) as Promise<bigint>,
      o.isStale(marketIdHex) as Promise<boolean>,
      o.liveSources(marketIdHex) as Promise<bigint>,
      v.totalEquity() as Promise<bigint>,
      v.marketCapital(marketIdHex) as Promise<bigint>,
      p.getBlockNumber(),
    ]);

    // Never pushed (publishedAt == 0), stale, or the feed is Halted ⇒ there is
    // no honest mark to quote, whatever markPrice() happens to return.
    const hasIndex = Number(latest[5]) > 0 && !isStale && Number(status) !== 2;

    return {
      address,
      marketIdHex,
      state: Number(state),
      hasIndex,
      mark: fromWad(mark),
      referenceMark: fromWad(refMark),
      payout: fromWad(payout),
      netInventory: fromWad(n),
      curveDepth: fromWad(b),
      fundingIndex: fromWad(fundingIdx),
      openInterestCap: fromWad(oiCap),
      openInterest: Math.abs(fromWad(n)),
      cfg: {
        mu: fromWad(cfg[0]),
        floor: fromWad(cfg[1]),
        cap: fromWad(cfg[2]),
        tau: Number(cfg[3]),
        w: Number(cfg[4]),
        rho: fromWad(cfg[6]),
        clusterId: Number(cfg[10]),
      },
      oracle: {
        x: fromWad(latest[0]),
        xBar: fromWad(latest[1]),
        lambdaRef: fromWad(latest[2]),
        sources: Number(latest[3]),
        day: Number(latest[4]),
        publishedAt: Number(latest[5]),
        status: Number(status),
        isStale,
        liveSources: Number(liveSources),
      },
      vaultEquity: fromWad(equity),
      marketCapital: fromWad(capital),
      block,
      fetchedAt: Date.now(),
    };
  });
}

/* ── account snapshot ───────────────────────────────────────────────────── */

export async function readAccount(
  account: string,
  marketIdHex: string,
  marketAddress: string
): Promise<LiveAccount> {
  return withProvider(async (p) => {
    const m = market(p, marketAddress);
    const v = vault(p);
    const t = token(p);
    const [bal, allowance, free, locked, pos, value, charge, lastFaucet, cooldown, faucetAmount] = await Promise.all([
      t.balanceOf(account) as Promise<bigint>,
      t.allowance(account, A.collateralVault) as Promise<bigint>,
      v.freeBalance(account) as Promise<bigint>,
      v.lockedBalance(marketIdHex, account) as Promise<bigint>,
      m.positionOf(account) as Promise<Record<string, bigint>>,
      // accountValue marks at the live curve, so it can revert on a dead feed.
      soft(m.accountValue(account) as Promise<bigint>, 0n),
      soft(m.pendingRepriceCharge(account) as Promise<bigint>, 0n),
      t.lastFaucet(account) as Promise<bigint>,
      t.FAUCET_COOLDOWN() as Promise<bigint>,
      t.FAUCET_AMOUNT() as Promise<bigint>,
    ]);
    const last = Number(lastFaucet);
    return {
      address: account,
      walletPrmUSD: from6(bal),
      allowance: from6(allowance),
      vaultFree: fromWad(free),
      vaultLocked: fromWad(locked),
      position: {
        q: fromWad(pos[0]),
        fundingSnapshot: fromWad(pos[1]),
        lockedCollateral: fromWad(pos[2]),
        accountValue: fromWad(value),
        pendingCharge: fromWad(charge),
      },
      faucetReadyAt: last === 0 ? 0 : last + Number(cooldown),
      faucetAmount: from6(faucetAmount),
      fetchedAt: Date.now(),
    };
  });
}

/* ── pre-trade quote ────────────────────────────────────────────────────── */

export interface Quote {
  /** Signed LMSR cost in $ (+ = you pay, − = you receive). */
  cost: number;
  /** Resulting mark after the fill. */
  markAfter: number;
  /** 1% fee on value, φ·|Δq|·M_after. */
  fee: number;
  /** Collateral the vault will lock for the resulting position, $. */
  lockRequired: number;
  /** Raw mark-after in WAD, for the slippage bound. */
  markAfterWad: bigint;
}

/**
 * Quote `deltaQ` units against the live curve. `currentQ` is the trader's
 * existing signed size, needed to work out the post-trade collateral lock
 * (= |q'|·(markLeg + 1 prmUSD), PerpMarket._relock).
 */
export async function quoteTrade(
  marketAddress: string,
  deltaQUnits: number,
  currentQUnits: number
): Promise<Quote> {
  const deltaQWad = toWad(deltaQUnits);
  if (deltaQWad === 0n) throw new Error("Size must be greater than zero");
  const [costWad, markAfterWad] = (await withProvider((p) =>
    market(p, marketAddress).quote(deltaQWad)
  )) as [bigint, bigint];

  const cost = fromWad(costWad);
  const markAfter = fromWad(markAfterWad);
  const newQ = currentQUnits + deltaQUnits;
  // long leg prices at M, short leg at (1 − M); each unit also locks 1 prmUSD of backing
  const markLeg = newQ >= 0 ? markAfter : 1 - markAfter;
  return {
    cost,
    markAfter,
    fee: 0.01 * Math.abs(deltaQUnits) * markAfter,
    lockRequired: Math.abs(newQ) * (markLeg + 1),
    markAfterWad,
  };
}

/**
 * Worst acceptable mark for a fill, as WAD.
 * PerpMarket: a BUY (deltaQ>0) reverts if M_after > bound; a SELL reverts if
 * M_after < bound. 0 would disable the check, so we always keep ≥ 1 wei.
 */
export function worstMarkWad(markAfterWad: bigint, deltaQUnits: number, slippagePct: number): bigint {
  const bps = BigInt(Math.max(1, Math.round(slippagePct * 100)));
  if (deltaQUnits > 0) {
    const bound = (markAfterWad * (10_000n + bps)) / 10_000n;
    return bound >= WAD ? WAD - 1n : bound === 0n ? 1n : bound;
  }
  const bound = (markAfterWad * (10_000n - bps)) / 10_000n;
  return bound < 1n ? 1n : bound;
}

/* ── real fill history → honest cost basis / P&L ─────────────────────────── */

export interface Fill {
  blockNumber: number;
  /** Unix seconds of the block, needed for time-weighted points. */
  timestamp: number;
  txHash: string;
  /** Signed size change, units. */
  deltaQ: number;
  /** Resulting position, units. */
  newQ: number;
  /** Mark at the fill. */
  mark: number;
  /** Signed cost, prmUSD (+ paid / − received). */
  cost: number;
  fee: number;
}

/**
 * True when `fills` reaches back to the moment the current position leg was
 * opened from flat (or the account has never traded). False means the scan hit
 * its window before finding that point, so anything derived from the history —
 * cost basis, points — is a LOWER BOUND and must be labelled as partial.
 */
export function fillsAreComplete(fills: Fill[]): boolean {
  if (!fills.length) return true;
  return Math.abs(fills[0].newQ - fills[0].deltaQ) < 1e-12;
}

/**
 * eth_getLogs window, in blocks. Public Base RPCs disagree on how wide a range
 * they will serve — publicnode answers 50k happily, drpc 400s on it — so the
 * window starts wide and narrows itself the first time one is refused, then
 * stays there for the session.
 */
let logChunk = 50_000;
const MIN_LOG_CHUNK = 2_000;
/** Hard ceiling on how many windows one scan may walk. */
const MAX_CHUNKS = 40;

/** One window of logs, narrowing `logChunk` and retrying if it was too wide. */
async function logsIn(
  c: Contract,
  filter: ReturnType<Contract["filters"][string]>,
  start: number,
  end: number
) {
  try {
    return await c.queryFilter(filter, start, end);
  } catch (e) {
    if (logChunk <= MIN_LOG_CHUNK) throw e;
    logChunk = Math.max(MIN_LOG_CHUNK, Math.floor(logChunk / 5));
    return c.queryFilter(filter, Math.max(start, end - logChunk), end);
  }
}

/**
 * Every PositionModified for `account` on this market, oldest first. Real
 * on-chain history, so the cost basis behind "P&L" is not a local guess.
 *
 * Scanned BACKWARDS from the head and stopped as soon as the current position
 * leg is fully covered (the oldest fill we have started from flat). That keeps
 * the common case to one or two getLogs calls no matter how old the market is,
 * and it can never walk past the deploy block.
 */
export async function readFills(marketAddress: string, account: string): Promise<Fill[]> {
  return withProvider(async (p) => {
    const m = market(p, marketAddress);
    const head = await p.getBlockNumber();
    const floor = PREMIA_CONFIG.deployBlock;
    const filter = m.filters.PositionModified(account);
    const out: Fill[] = [];

    let end = head;
    for (let i = 0; i < MAX_CHUNKS && end >= floor; i++) {
      const start = Math.max(floor, end - logChunk);
      const logs = await logsIn(m, filter, start, end);
      for (const l of logs) {
        const args = (l as unknown as { args: readonly bigint[] }).args;
        out.push({
          blockNumber: l.blockNumber,
          timestamp: 0, // filled in below, once per distinct block
          txHash: l.transactionHash,
          deltaQ: fromWad(args[1]),
          newQ: fromWad(args[2]),
          mark: fromWad(args[3]),
          cost: fromWad(args[4]),
          fee: fromWad(args[5]),
        });
      }
      out.sort((a, b) => a.blockNumber - b.blockNumber);
      // Covered the whole leg once the earliest fill we hold opened from flat.
      if (fillsAreComplete(out)) break;
      if (start <= floor) break;
      end = start - 1;
    }

    // Points are time-weighted, so each fill needs its block's timestamp.
    // Deduped: a trader's fills usually sit in only a handful of blocks.
    const blocks = [...new Set(out.map((f) => f.blockNumber))];
    const stamps = new Map<number, number>();
    await Promise.all(
      blocks.map(async (b) => {
        const blk = await p.getBlock(b);
        if (blk) stamps.set(b, Number(blk.timestamp));
      })
    );
    for (const f of out) f.timestamp = stamps.get(f.blockNumber) ?? 0;
    return out.filter((f) => f.timestamp > 0);
  });
}

/**
 * Cost basis for the CURRENT position, from the fills since it was last flat.
 *   paid       = Σ (cost + fee) over those fills   ($ out of free balance)
 *   entryMark  = Σ cost / Σ deltaQ                 (volume-weighted fill price)
 * P&L is then  q·M − fundingOwed − paid, which is exactly
 *   accountValue − lockedCollateral − paid.
 */
export interface Basis {
  paid: number;
  entryMark: number;
  openedAt: number;
  fills: number;
}

export function basisOf(fills: Fill[]): Basis | null {
  if (!fills.length) return null;
  // walk back to the last point the position was flat
  let startIdx = 0;
  for (let i = fills.length - 1; i >= 0; i--) {
    if (Math.abs(fills[i].newQ) < 1e-12) {
      startIdx = i + 1;
      break;
    }
  }
  const leg = fills.slice(startIdx);
  if (!leg.length) return null;
  const paid = leg.reduce((s, f) => s + f.cost + f.fee, 0);
  const grossQ = leg.reduce((s, f) => s + f.deltaQ, 0);
  const grossCost = leg.reduce((s, f) => s + f.cost, 0);
  return {
    paid,
    entryMark: Math.abs(grossQ) > 1e-12 ? Math.abs(grossCost / grossQ) : leg[leg.length - 1].mark,
    openedAt: 0,
    fills: leg.length,
  };
}

/* ── mark history (real fills) → the chart's price line ──────────────────── */

export interface MarkPoint {
  /** Unix seconds of the fill's block. */
  t: number;
  /** Mark M immediately after the fill, 0..1. */
  mark: number;
}

/** Enough fills to draw the longest chart range. */
const MAX_MARK_POINTS = 400;

/**
 * The mark's real history: every `PositionModified` on the market, not just
 * this account's.
 *
 * The mark only moves when someone trades — `PositionModified.markWad` is M
 * immediately after that fill — so this is a step function with an exact
 * observation at every step. The chart previously drew the CURRENT mark across
 * every past day, which is a flat line that never happened.
 *
 * Unfiltered by account on purpose: the price is the market's, not the
 * viewer's.
 */
export async function readMarkHistory(marketAddress: string): Promise<MarkPoint[]> {
  return withProvider(async (p) => {
    const m = market(p, marketAddress);
    const head = await p.getBlockNumber();
    const floor = PREMIA_CONFIG.deployBlock;
    const filter = m.filters.PositionModified();
    const raw: { block: number; mark: number }[] = [];

    let end = head;
    for (let i = 0; i < MAX_CHUNKS && end >= floor && raw.length < MAX_MARK_POINTS; i++) {
      const start = Math.max(floor, end - logChunk);
      const logs = await logsIn(m, filter, start, end);
      for (const l of logs) {
        const args = (l as unknown as { args: readonly bigint[] }).args;
        raw.push({ block: l.blockNumber, mark: fromWad(args[3]) });
      }
      if (start <= floor) break;
      end = start - 1;
    }
    if (!raw.length) return [];

    // One timestamp per distinct block; several fills can share a block.
    const blocks = [...new Set(raw.map((r) => r.block))];
    const stamps = new Map<number, number>();
    await Promise.all(
      blocks.map(async (bn) => {
        const blk = await p.getBlock(bn);
        if (blk) stamps.set(bn, Number(blk.timestamp));
      })
    );

    // Last fill in a block wins: that is the mark the block left behind.
    const byTime = new Map<number, number>();
    for (const r of raw.sort((a, b) => a.block - b.block)) {
      const t = stamps.get(r.block);
      if (t) byTime.set(t, r.mark);
    }
    return [...byTime.entries()]
      .map(([t, mark]) => ({ t, mark }))
      .sort((a, b) => a.t - b.t);
  });
}

/* ── oracle history (real pushes) → the chart ───────────────────────────── */

export interface OraclePush {
  day: number;
  /** X as a fraction. */
  x: number;
  xBar: number;
  sources: number;
  publishedAt: number;
}

/** How many daily index points the chart wants at most. */
const MAX_PUSHES = 120;

/**
 * Every IndexPushed for this market, oldest first — the real oracle history
 * the chart is drawn from. Scanned backwards from the head and stopped once we
 * have enough points for the longest chart range (or we reach the deploy
 * block), so the cost does not grow with chain age.
 */
export async function readOracleHistory(marketIdHex: string): Promise<OraclePush[]> {
  return withProvider(async (p) => {
    const o = oracle(p);
    const head = await p.getBlockNumber();
    const floor = PREMIA_CONFIG.deployBlock;
    const filter = o.filters.IndexPushed(marketIdHex);
    const out: OraclePush[] = [];

    let end = head;
    for (let i = 0; i < MAX_CHUNKS && end >= floor && out.length < MAX_PUSHES; i++) {
      const start = Math.max(floor, end - logChunk);
      const logs = await logsIn(o, filter, start, end);
      for (const l of logs) {
        const args = (l as unknown as { args: readonly bigint[] }).args;
        out.push({
          day: Number(args[1]),
          x: fromWad(args[2]),
          xBar: fromWad(args[3]),
          sources: Number(args[5]),
          publishedAt: Number(args[6]),
        });
      }
      if (start <= floor) break;
      end = start - 1;
    }
    return out.sort((a, b) => a.day - b.day);
  });
}
