/**
 * PREMIA client state.
 *
 * LIVE mode (default): every number comes from Base-mainnet contract reads —
 * the market snapshot from PerpMarket/PushOracleAdapter, the trading balance
 * from CollateralVault, the wallet balance + allowance from prmUSD, and the
 * position (with a real cost basis from the account's own PositionModified
 * logs) from positionOf/accountValue. Actions are submitted through the in-app
 * Rift wallet as gas-sponsored USDC user-ops.
 *
 * MOCK mode: the old in-browser ledger + gently ticking market data, kept
 * intact so the section still demos with no chain.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getAddress } from "ethers";
import { MARKETS, snapshotOf, snapshotFromLive, snapshotNotDeployed, buildHistory } from "./markets";
import { oddsOf, fundingDaily, positionWorth, unitsFor } from "./math";
import { PREMIA_CONFIG, type PremiaMode } from "./config";
import * as client from "./client";
import {
  basisOf,
  quoteTrade,
  readAccount,
  readFills,
  readMarket,
  readMarkHistory,
  readOracleHistory,
  resolveMarketAddress,
  type Basis,
  type LiveAccount,
  type LiveMarket,
  type MarkPoint,
  type OraclePush,
  type Quote,
} from "./live";
import { EMPTY_POINTS, pointsFor, totalPoints, type PointsBreakdown } from "./points";
import type { MarketDef, MarketSnapshot, Portfolio, Position, Side } from "./types";

const TICK_MS = 4000;
/** Each mock tick advances funding as if ~1 hour passed, so yields move. */
const TICK_HOURS = 1;
/** How often live reads are refreshed. */
const LIVE_POLL_MS = 15_000;

/**
 * The signed-in wallet, normalised for ethers.
 *
 * Addresses reach localStorage from several places and are not always EIP-55
 * checksummed; ethers rejects a mixed-case address with a bad checksum, which
 * would otherwise fail every read. Lower-case it so ethers accepts it, then
 * checksum it properly.
 */
function walletAddress(): string {
  const a = typeof localStorage !== "undefined" ? localStorage.getItem("address") : null;
  if (!a || a === "undefined" || a === "null" || !/^0x[0-9a-fA-F]{40}$/.test(a)) return "";
  try {
    return getAddress(a.toLowerCase());
  } catch {
    return "";
  }
}

function signedIn(): boolean {
  if (typeof localStorage === "undefined") return false;
  const t = localStorage.getItem("token");
  return !!t && t !== "undefined" && t !== "null";
}

const MOCK_DEMO_ADDR = "0xPREMIAdemo000000000000000000000000000000";

function storeKey(addr: string) {
  return `premia:ledger:${addr.toLowerCase()}`;
}

/* ── "prmUSD is not money" acknowledgement, per wallet ───────────────────── */

const ACK_VERSION = "v1";
const ackKey = (addr: string) => `premia:ack:${ACK_VERSION}:${(addr || "anon").toLowerCase()}`;

/**
 * Read the acknowledgement. Storage can throw (private mode, blocked site
 * data) and can come back empty — BOTH are treated as "not yet acknowledged".
 * Failing closed is the only safe direction: the cost of asking twice is an
 * extra tap, the cost of wrongly assuming consent is a user who thinks the
 * valueless token they are trading is money.
 */
function readAck(addr: string): boolean {
  try {
    return localStorage.getItem(ackKey(addr)) === "1";
  } catch {
    return false;
  }
}

function writeAck(addr: string): void {
  try {
    localStorage.setItem(ackKey(addr), "1");
  } catch {
    /* Storage unavailable: the acknowledgement holds for this session only
       and will be asked for again next visit. Deliberate — see readAck. */
  }
}

function loadPortfolio(addr: string): Portfolio {
  try {
    const raw = localStorage.getItem(storeKey(addr));
    if (raw) return JSON.parse(raw) as Portfolio;
  } catch {
    /* ignore */
  }
  return { prmUSD: 2500, positions: [seedPosition("ngn-usdt-premium", "rise", 250)] };
}

function seedPosition(marketId: string, side: Side, stake: number): Position {
  const def = MARKETS.find((m) => m.id === marketId)!;
  const entry = oddsOf(def.premiumNow, def, side) * 0.94; // opened a bit earlier
  const units = unitsFor(stake, entry);
  return {
    marketId,
    side,
    stake,
    units,
    entryOdds: entry,
    fundingAccrued: 1.84,
    openedAt: Date.now() - 1000 * 60 * 60 * 52,
  };
}

interface Live {
  premium: number;
  history: ReturnType<typeof buildHistory>;
}

/** A market that has an on-chain deployment we can read + trade. */
export interface TradableMarket {
  def: MarketDef;
  address: string;
  marketIdHex: string;
}

export interface PositionValue {
  /** Realisable now — what cashing out returns to the trading balance. */
  worth: number;
  /** worth − what was paid in. */
  pnl: number;
  /** Funding accrued (+ earned / − paid). */
  funding: number;
  /** True when the cost basis could not be reconstructed, so pnl is unknown. */
  unknownBasis?: boolean;
  /** True while the fill scan is still running — show progress, not "—". */
  pendingBasis?: boolean;
}

interface Ctx {
  mode: PremiaMode;
  address: string;
  signedIn: boolean;
  /** First live load still in flight. */
  loading: boolean;
  /** Live read error, if the chain could not be reached. */
  error: string | null;
  portfolio: Portfolio;
  snapshots: Record<string, MarketSnapshot>;
  markets: MarketDef[];
  busy: boolean;
  /** Human label for the step in flight ("Approving…", "Depositing…"). */
  step: string | null;
  lastTx: client.TxResult | null;
  refresh: () => Promise<void>;
  faucet: () => Promise<client.TxResult>;
  approve: () => Promise<client.TxResult>;
  deposit: (amount: number) => Promise<client.TxResult>;
  /** One click: faucet -> approve -> deposit, skipping any leg already done. */
  requestBeta: () => Promise<client.TxResult>;
  withdraw: (amount: number) => Promise<client.TxResult>;
  /** Mock-mode stake-based trade (kept for the mock ticket). */
  trade: (args: { marketId: string; side: Side; stake: number; slippagePct?: number }) => Promise<client.TxResult>;
  /** Live trade: signed size in units, slippage-bounded off a live quote. */
  tradeUnits: (args: { marketId: string; side: Side; units: number; slippagePct?: number }) => Promise<client.TxResult>;
  cashOut: (marketId: string, side: Side) => Promise<client.TxResult>;
  positionValue: (p: Position) => PositionValue;
  /** Live pre-trade quote straight off the curve. */
  quote: (marketId: string, side: Side, units: number) => Promise<Quote>;
  /** True once prmUSD has approved the vault for at least `amount`. */
  hasAllowance: (amount: number) => boolean;
  /** Beta points, derived from the account's own on-chain fills. */
  points: PointsBreakdown;
  /** Per-market points, for a breakdown. */
  pointsByMarket: Record<string, PointsBreakdown>;
  /**
   * Whether this wallet has acknowledged that prmUSD is a valueless test
   * token. Trading is blocked until it has.
   */
  acknowledged: boolean;
  acknowledge: () => void;
}

const PremiaContext = createContext<Ctx | null>(null);

export function PremiaProvider({ children }: { children: ReactNode }) {
  return PREMIA_CONFIG.mode === "live" ? (
    <LiveProvider>{children}</LiveProvider>
  ) : (
    <MockProvider>{children}</MockProvider>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LIVE — Base mainnet
   ══════════════════════════════════════════════════════════════════════════ */

function LiveProvider({ children }: { children: ReactNode }) {
  const address = useMemo(walletAddress, []);
  const isSignedIn = useMemo(signedIn, []);

  const [tradables, setTradables] = useState<TradableMarket[]>([]);
  const [markets, setMarkets] = useState<Record<string, LiveMarket>>({});
  const [pushes, setPushes] = useState<Record<string, OraclePush[]>>({});
  // Every fill on the market, for the chart's mark line — not just this account's.
  const [marks, setMarks] = useState<Record<string, MarkPoint[]>>({});
  const [account, setAccount] = useState<Record<string, LiveAccount>>({});
  const [basis, setBasis] = useState<Record<string, Basis | null>>({});
  const [points, setPoints] = useState<Record<string, PointsBreakdown>>({});
  // Fails closed: unreadable storage counts as "not acknowledged".
  const [acknowledged, setAcknowledged] = useState<boolean>(() => readAck(walletAddress()));
  const acknowledge = useCallback(() => {
    writeAck(address);
    setAcknowledged(true);
  }, [address]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<client.TxResult | null>(null);
  const [deadMarkets, setDeadMarkets] = useState<Record<string, string>>({});

  /** Resolve every configured market to its on-chain address once. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found: TradableMarket[] = [];
      const dead: Record<string, string> = {};
      for (const def of MARKETS) {
        if (!def.marketIdHex) {
          dead[def.id] = "Not deployed yet";
          continue;
        }
        try {
          const addr = await resolveMarketAddress(def.marketIdHex, def.address || undefined);
          found.push({ def, address: addr, marketIdHex: def.marketIdHex });
        } catch (e) {
          dead[def.id] = (e as Error).message || "Market not found on chain";
        }
      }
      if (cancelled) return;
      setTradables(found);
      setDeadMarkets(dead);
      if (!found.length) {
        setError("No PREMIA markets are deployed on Base yet.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Read every tradable market INDEPENDENTLY. One market being frozen, having
   * no oracle index, or simply failing must never blank the others — so this
   * settles each read on its own and only reports a global error when nothing
   * came back at all.
   */
  const refresh = useCallback(async () => {
    if (!tradables.length) return;
    try {
      const marketReads = await Promise.allSettled(
        tradables.map((t) => readMarket(t.marketIdHex, t.address))
      );
      const nextMarkets: Record<string, LiveMarket> = {};
      const failures: Record<string, string> = {};
      marketReads.forEach((r, i) => {
        const id = tradables[i].def.id;
        if (r.status === "fulfilled") nextMarkets[id] = r.value;
        else failures[id] = (r.reason as Error)?.message || "Could not read this market";
      });
      setMarkets((prev) => ({ ...prev, ...nextMarkets }));
      setDeadMarkets((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(nextMarkets)) delete next[id];
        return { ...next, ...failures };
      });
      setError(Object.keys(nextMarkets).length ? null : "Could not reach Base");

      if (address) {
        const accountReads = await Promise.allSettled(
          tradables.map((t) => readAccount(address, t.marketIdHex, t.address))
        );
        const nextAccounts: Record<string, LiveAccount> = {};
        accountReads.forEach((r, i) => {
          if (r.status === "fulfilled") nextAccounts[tradables[i].def.id] = r.value;
        });
        setAccount((prev) => ({ ...prev, ...nextAccounts }));
      }
    } catch (e) {
      setError((e as Error).message || "Could not reach Base");
    } finally {
      setLoading(false);
    }
  }, [tradables, address]);

  /** Oracle history + the account's own fills — slower-moving, fetched apart. */
  const refreshHistory = useCallback(async () => {
    if (!tradables.length) return;
    await Promise.all(
      tradables.map(async (t) => {
        try {
          const hist = await readOracleHistory(t.marketIdHex);
          setPushes((prev) => ({ ...prev, [t.def.id]: hist }));
        } catch {
          /* chart falls back to the single live reading */
        }
        try {
          const ms = await readMarkHistory(t.address);
          setMarks((prev) => ({ ...prev, [t.def.id]: ms }));
        } catch {
          /* no mark line; the index line and the live legend still stand */
        }
        if (!address) return;
        try {
          const fills = await readFills(t.address, address);
          setBasis((prev) => ({ ...prev, [t.def.id]: basisOf(fills) }));
          // Points come from the SAME fill log — no extra reads, no database.
          setPoints((prev) => ({ ...prev, [t.def.id]: pointsFor(fills) }));
        } catch {
          setBasis((prev) => ({ ...prev, [t.def.id]: null }));
          // A failed scan must not look like "zero points earned".
          setPoints((prev) => ({ ...prev, [t.def.id]: { ...EMPTY_POINTS, complete: false } }));
        }
      })
    );
  }, [tradables, address]);

  // initial + polled reads
  useEffect(() => {
    if (!tradables.length) return;
    void refresh();
    void refreshHistory();
    const t = setInterval(() => void refresh(), LIVE_POLL_MS);
    return () => clearInterval(t);
  }, [tradables, refresh, refreshHistory]);

  const snapshots = useMemo(() => {
    const out: Record<string, MarketSnapshot> = {};
    for (const def of MARKETS) {
      const live = markets[def.id];
      if (live) out[def.id] = snapshotFromLive(def, live, pushes[def.id] ?? [], marks[def.id] ?? []);
      else out[def.id] = snapshotNotDeployed(def, deadMarkets[def.id]);
    }
    return out;
  }, [markets, pushes, marks, deadMarkets]);

  /** Flatten the per-market account reads into the Portfolio shape the UI uses. */
  const portfolio = useMemo<Portfolio>(() => {
    const accounts = Object.values(account);
    const first = accounts[0];
    const positions: Position[] = [];
    for (const def of MARKETS) {
      const a = account[def.id];
      const live = markets[def.id];
      if (!a || !live) continue;
      const q = a.position.q;
      if (Math.abs(q) < 1e-9) continue;
      const side: Side = q > 0 ? "rise" : "fall";
      // Absent key = the fill scan has not finished; explicit null = it ran
      // and found nothing. Conflating them showed "—" on a fresh position.
      const scanned = Object.prototype.hasOwnProperty.call(basis, def.id);
      const b = basis[def.id] ?? null;
      const fundingOwed = q * (live.fundingIndex - a.position.fundingSnapshot);
      const entryLongMark = b?.entryMark ?? live.mark;
      positions.push({
        marketId: def.id,
        side,
        stake: (b?.paid ?? 0) + a.position.lockedCollateral,
        units: Math.abs(q),
        entryOdds: side === "rise" ? entryLongMark : 1 - entryLongMark,
        fundingAccrued: -fundingOwed,
        openedAt: 0,
        lockedCollateral: a.position.lockedCollateral,
        realisable: a.position.accountValue,
        ...(b ? { paid: b.paid } : scanned ? { basisUnknown: true } : { basisPending: true }),
      });
    }
    return {
      prmUSD: first?.vaultFree ?? 0,
      positions,
      walletPrmUSD: first?.walletPrmUSD ?? 0,
      allowance: first?.allowance ?? 0,
      locked: accounts.reduce((s, a) => s + a.vaultLocked, 0),
      faucetReadyAt: first?.faucetReadyAt ?? 0,
      faucetAmount: first?.faucetAmount ?? 0,
    };
  }, [account, markets, basis]);

  const positionValue = useCallback(
    (p: Position): PositionValue => {
      const worth = p.realisable ?? 0;
      const locked = p.lockedCollateral ?? 0;
      if (p.paid === undefined) {
        return {
          worth,
          pnl: 0,
          funding: p.fundingAccrued,
          unknownBasis: !p.basisPending,
          pendingBasis: !!p.basisPending,
        };
      }
      return { worth, pnl: worth - locked - p.paid, funding: p.fundingAccrued };
    },
    []
  );

  /** Run a write, then re-read chain so the UI shows the new truth. */
  const run = useCallback(
    async (label: string, fn: () => Promise<client.TxResult>) => {
      setBusy(true);
      setStep(label);
      try {
        const res = await fn();
        setLastTx(res);
        // A sponsored user-op lands a beat after the bundler accepts it, so
        // re-read once quickly and again a little later; the 15s poll is the
        // backstop if it takes longer than that.
        await new Promise((r) => setTimeout(r, 2500));
        await refresh();
        void refreshHistory();
        setTimeout(() => {
          void refresh();
          void refreshHistory();
        }, 7000);
        return res;
      } finally {
        setBusy(false);
        setStep(null);
      }
    },
    [refresh, refreshHistory]
  );

  /**
   * Resolve a market for a WRITE, refusing anything the contract would reject.
   * `opening` guards new/increased exposure (Active only); a close is allowed
   * in ClosingOnly too, exactly like `PerpMarket.modifyPosition`. Either way a
   * market with no usable oracle index can't be marked, so nothing is sent.
   */
  const tradableFor = useCallback(
    (marketId: string, opening: boolean) => {
      const t = tradables.find((x) => x.def.id === marketId);
      if (!t) throw new Error("This market is not deployed on Base yet");
      const live = markets[marketId];
      if (!live) throw new Error("Still reading this market from Base — try again in a moment");
      if (!live.hasIndex) {
        throw new Error("This market has no live index yet, so it can't be priced");
      }
      if (live.state === 2) throw new Error("This market is frozen — trading is paused");
      if (opening && live.state !== 0) throw new Error("This market is not accepting new positions");
      if (opening && live.oracle.status !== 0) {
        throw new Error("The index feed is degraded, so no new positions can open");
      }
      return t;
    },
    [tradables, markets]
  );

  const faucet = useCallback(() => run("Minting test prmUSD…", () => client.faucet()), [run]);
  const approve = useCallback(() => run("Approving prmUSD…", () => client.approveVault()), [run]);
  const deposit = useCallback(
    (amount: number) => run("Depositing…", () => client.depositCollateral(amount)),
    [run]
  );
  const withdraw = useCallback(
    (amount: number) => run("Withdrawing…", () => client.withdrawCollateral(amount)),
    [run]
  );

  /**
   * "Request beta" — one click, three passkey taps, ready to trade.
   *
   * The wallet's user-op endpoint takes ONE `{to, data}` per signature (see
   * nonCustodial.signAndSubmitUserOp), so these cannot be batched into a
   * single tap. What this does is remove the three *decisions*: the user
   * clicks once and the sequence runs, skipping any leg that is already done.
   *
   *   1. faucet()            → mints the contract's fixed FAUCET_AMOUNT
   *   2. approve(vault, MAX) → once per wallet, never asked again
   *   3. deposit(balance)    → into the vault, ready to trade
   *
   * Skipped legs cost nothing, so a user who already holds prmUSD and has
   * approved only taps once.
   */
  const requestBeta = useCallback(async () => {
    const acct = Object.values(account)[0];
    const readyAt = acct?.faucetReadyAt ?? 0;
    const onCooldown = readyAt > 0 && readyAt * 1000 > Date.now();

    let wallet = acct?.walletPrmUSD ?? 0;
    let last: client.TxResult | null = null;

    if (!onCooldown) {
      last = await run("Minting your test tokens…", () => client.faucet());
      wallet += acct?.faucetAmount ?? 0;
    } else if (wallet <= 0 && (acct?.vaultFree ?? 0) <= 0) {
      throw new Error(
        `The faucet is on cooldown until ${new Date(readyAt * 1000).toLocaleString()}. One grant per wallet per 24h.`
      );
    }

    if ((acct?.allowance ?? 0) < wallet) {
      last = await run("Approving…", () => client.approveVault());
    }
    if (wallet > 0) {
      last = await run("Funding your trading balance…", () => client.depositCollateral(wallet));
    }
    if (!last) throw new Error("Nothing to do — your trading balance is already funded");
    return last;
  }, [account, run]);

  const quote = useCallback(
    async (marketId: string, side: Side, units: number) => {
      const t = tradableFor(marketId, true);
      const currentQ = account[marketId]?.position.q ?? 0;
      const delta = side === "rise" ? units : -units;
      return quoteTrade(t.address, delta, currentQ);
    },
    [tradableFor, account]
  );

  const tradeUnits = useCallback(
    async (args: { marketId: string; side: Side; units: number; slippagePct?: number }) => {
      const t = tradableFor(args.marketId, true);
      const currentQ = account[args.marketId]?.position.q ?? 0;
      const delta = args.side === "rise" ? args.units : -args.units;
      const q = await quoteTrade(t.address, delta, currentQ);
      return run("Placing trade…", () =>
        client.modifyPosition({
          marketAddress: t.address,
          deltaQUnits: delta,
          markAfterWad: q.markAfterWad,
          slippagePct: args.slippagePct,
        })
      );
    },
    [tradableFor, account, run]
  );

  /**
   * Stake-based entry for compatibility: size the position so the collateral
   * the vault will lock (|q|·(markLeg + 1 prmUSD)) plus the curve cost fits `stake`.
   */
  const trade = useCallback(
    async (args: { marketId: string; side: Side; stake: number; slippagePct?: number }) => {
      const live = markets[args.marketId];
      const markLeg = args.side === "rise" ? (live?.mark ?? 0) : 1 - (live?.mark ?? 0);
      const units = args.stake / (markLeg + 1);
      return tradeUnits({ ...args, units });
    },
    [markets, tradeUnits]
  );

  const cashOut = useCallback(
    async (marketId: string, side: Side) => {
      const t = tradableFor(marketId, false);
      const currentQ = account[marketId]?.position.q ?? 0;
      if (Math.abs(currentQ) < 1e-12) throw new Error("No open position to close");
      // One signed position per market on chain, so the side is implied by q.
      if ((side === "rise") !== currentQ > 0) throw new Error("That side is not open");
      const delta = -currentQ; // flatten
      const q = await quoteTrade(t.address, delta, currentQ);
      return run("Closing position…", () =>
        client.modifyPosition({
          marketAddress: t.address,
          deltaQUnits: delta,
          markAfterWad: q.markAfterWad,
          slippagePct: 3, // a close should not fail on a tick of drift
        })
      );
    },
    [tradableFor, account, run]
  );

  const hasAllowance = useCallback(
    (amount: number) => (portfolio.allowance ?? 0) >= amount - 1e-9,
    [portfolio.allowance]
  );

  const aggregatePoints = useMemo(() => {
    const parts = Object.values(points);
    return parts.length ? totalPoints(parts) : EMPTY_POINTS;
  }, [points]);

  const value: Ctx = {
    mode: "live",
    points: aggregatePoints,
    pointsByMarket: points,
    acknowledged,
    acknowledge,
    address,
    signedIn: isSignedIn,
    loading,
    error,
    portfolio,
    snapshots,
    markets: MARKETS,
    busy,
    step,
    lastTx,
    refresh,
    faucet,
    approve,
    deposit,
    withdraw,
    requestBeta,
    trade,
    tradeUnits,
    cashOut,
    positionValue,
    quote,
    hasAllowance,
  };

  return <PremiaContext.Provider value={value}>{children}</PremiaContext.Provider>;
}

/* ══════════════════════════════════════════════════════════════════════════
   MOCK — in-browser ledger (unchanged behaviour)
   ══════════════════════════════════════════════════════════════════════════ */

function MockProvider({ children }: { children: ReactNode }) {
  const address = useMemo(() => walletAddress() || MOCK_DEMO_ADDR, []);
  const [portfolio, setPortfolio] = useState<Portfolio>(() => loadPortfolio(address));
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<client.TxResult | null>(null);
  const [mockAck, setMockAck] = useState<boolean>(() => readAck(walletAddress() || MOCK_DEMO_ADDR));

  // Per-market live premium + history (seeded from the static def, then walks).
  const [live, setLive] = useState<Record<string, Live>>(() => {
    const init: Record<string, Live> = {};
    for (const m of MARKETS) init[m.id] = { premium: m.premiumNow, history: buildHistory(m) };
    return init;
  });

  // Persist ledger.
  useEffect(() => {
    try {
      localStorage.setItem(storeKey(address), JSON.stringify(portfolio));
    } catch {
      /* ignore */
    }
  }, [address, portfolio]);

  // keep a ref to live for the funding closure
  const liveRef = useRef(live);
  liveRef.current = live;

  // Gentle market ticks + funding accrual.
  const rndRef = useRef(1);
  useEffect(() => {
    const t = setInterval(() => {
      setLive((prev) => {
        const next: Record<string, Live> = {};
        for (const m of MARKETS) {
          const cur = prev[m.id];
          rndRef.current = (rndRef.current * 1103515245 + 12345) & 0x7fffffff;
          const noise = rndRef.current / 0x7fffffff - 0.5;
          const span = m.capPct - m.floorPct;
          // mean-revert to premiumNow with a little life
          let p = cur.premium + (m.premiumNow - cur.premium) * 0.04 + noise * span * 0.01;
          p = Math.max(0, p);
          const hist = cur.history.slice();
          hist[hist.length - 1] = { ...hist[hist.length - 1], premium: Number(p.toFixed(2)) };
          next[m.id] = { premium: p, history: hist };
        }
        return next;
      });
      setPortfolio((pf) => {
        if (!pf.positions.length) return pf;
        const positions = pf.positions.map((pos) => {
          const def = MARKETS.find((m) => m.id === pos.marketId);
          if (!def) return pos;
          const prem = liveRef.current[pos.marketId]?.premium ?? def.premiumNow;
          const fd = fundingDaily(prem, def, pos.side) / 100; // fraction/day
          const add = pos.units * fd * (TICK_HOURS / 24);
          return { ...pos, fundingAccrued: pos.fundingAccrued + add };
        });
        return { ...pf, positions };
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, []);

  const snapshots = useMemo(() => {
    const out: Record<string, MarketSnapshot> = {};
    for (const m of MARKETS) {
      const l = live[m.id];
      out[m.id] = snapshotOf(m, l.premium, l.history);
    }
    return out;
  }, [live]);

  const positionValue = useCallback(
    (p: Position): PositionValue => {
      const def = MARKETS.find((m) => m.id === p.marketId)!;
      const prem = live[p.marketId]?.premium ?? def.premiumNow;
      const worth = positionWorth(p.units, p.side, prem, def);
      const pnl = worth - p.stake + p.fundingAccrued;
      return { worth, pnl, funding: p.fundingAccrued };
    },
    [live]
  );

  const faucet = useCallback(async () => {
    setBusy(true);
    try {
      const res = await client.faucet();
      setPortfolio((pf) => ({ ...pf, prmUSD: pf.prmUSD + PREMIA_CONFIG.faucetAmount }));
      setLastTx(res);
      return res;
    } finally {
      setBusy(false);
    }
  }, []);

  const trade = useCallback(
    async (args: { marketId: string; side: Side; stake: number; slippagePct?: number }) => {
      setBusy(true);
      try {
        const def = MARKETS.find((m) => m.id === args.marketId)!;
        const prem = live[args.marketId]?.premium ?? def.premiumNow;
        const entryOdds = oddsOf(prem, def, args.side);
        const units = unitsFor(args.stake, entryOdds);
        const res = await client.openPosition({
          marketAddress: def.address,
          units,
          side: args.side,
          entryOdds,
          slippagePct: args.slippagePct,
        });
        setPortfolio((pf) => {
          const prmUSD = Math.max(0, pf.prmUSD - args.stake);
          const idx = pf.positions.findIndex((p) => p.marketId === args.marketId && p.side === args.side);
          const positions = pf.positions.slice();
          if (idx >= 0) {
            const ex = positions[idx];
            const totalStake = ex.stake + args.stake;
            const totalUnits = ex.units + units;
            positions[idx] = {
              ...ex,
              stake: totalStake,
              units: totalUnits,
              entryOdds: totalStake / totalUnits,
            };
          } else {
            positions.push({
              marketId: args.marketId,
              side: args.side,
              stake: args.stake,
              units,
              entryOdds,
              fundingAccrued: 0,
              openedAt: Date.now(),
            });
          }
          return { ...pf, prmUSD, positions };
        });
        setLastTx(res);
        return res;
      } finally {
        setBusy(false);
      }
    },
    [live]
  );

  const cashOut = useCallback(
    async (marketId: string, side: Side) => {
      setBusy(true);
      try {
        const def = MARKETS.find((m) => m.id === marketId)!;
        const prem = live[marketId]?.premium ?? def.premiumNow;
        const pos = portfolio.positions.find((p) => p.marketId === marketId && p.side === side);
        const res = await client.closePosition({
          marketAddress: def.address,
          units: pos?.units ?? 0,
          side,
          markNow: oddsOf(prem, def, side),
        });
        setPortfolio((pf) => {
          const pos2 = pf.positions.find((p) => p.marketId === marketId && p.side === side);
          if (!pos2) return pf;
          const worth = positionWorth(pos2.units, side, prem, def);
          const credit = worth + pos2.fundingAccrued;
          return {
            ...pf,
            prmUSD: pf.prmUSD + credit,
            positions: pf.positions.filter((p) => !(p.marketId === marketId && p.side === side)),
          };
        });
        setLastTx(res);
        return res;
      } finally {
        setBusy(false);
      }
    },
    [live, portfolio]
  );

  const notLive = async (): Promise<client.TxResult> => {
    throw new Error("Only available in live mode");
  };

  const value: Ctx = {
    mode: "mock",
    address,
    signedIn: signedIn(),
    loading: false,
    error: null,
    portfolio,
    snapshots,
    markets: MARKETS,
    busy,
    step: null,
    lastTx,
    refresh: async () => {},
    faucet,
    approve: notLive,
    deposit: notLive,
    withdraw: notLive,
    requestBeta: faucet,
    trade,
    tradeUnits: async (args) => trade({ ...args, stake: args.units }),
    cashOut,
    positionValue,
    quote: async () => {
      throw new Error("Quotes are live-mode only");
    },
    hasAllowance: () => true,
    // Points are derived from on-chain fills, which mock mode does not have.
    points: EMPTY_POINTS,
    pointsByMarket: {},
    // The warning still applies in mock mode — the token is the same one.
    acknowledged: mockAck,
    acknowledge: () => {
      writeAck(address);
      setMockAck(true);
    },
  };

  return <PremiaContext.Provider value={value}>{children}</PremiaContext.Provider>;
}

export function usePremia(): Ctx {
  const ctx = useContext(PremiaContext);
  if (!ctx) throw new Error("usePremia must be used within <PremiaProvider>");
  return ctx;
}
