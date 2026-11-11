/**
 * LP pool ("Yield") client: types, API calls, the LP session and the
 * external-wallet sign-in. Built against LP-POOL-CONTRACT (all routes under
 * /v1/lp). Responses are normalised defensively so a missing field renders
 * as "—" instead of a made-up number.
 */
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { riftRequest } from "@/lib/nonCustodial";

/* ── Constants ─────────────────────────────────────────────────────── */

export const LP_DEPOSIT_ADDRESS = "0x98a4BA4dea75F43a617E9753c0e38521391021b8";
export const LP_TERMS_VERSION = "lp-2026-11-v1";
export const LP_FEE_RATE = 0.003; // 0.30% of pool-using volume
export const LP_LOCK_DAYS = 30;

export const LP_CHAINS = [
  { id: "BASE", label: "Base" },
  { id: "ETHEREUM", label: "Ethereum" },
  { id: "POLYGON", label: "Polygon" },
  { id: "ARBITRUM", label: "Arbitrum" },
] as const;
export type LpChain = (typeof LP_CHAINS)[number]["id"];
export const LP_ASSETS = ["USDC", "USDT"] as const;
export type LpAsset = (typeof LP_ASSETS)[number];

/** Local-money deposit currencies (contract §Deposits 2). */
export const LP_FIAT_CURRENCIES = ["KES", "UGX", "TZS", "GHS", "MWK"] as const;

export const chainLabel = (id?: string | null) => LP_CHAINS.find((c) => c.id === String(id || "").toUpperCase())?.label ?? (id ? String(id) : "—");

/* ── Earnings math ─────────────────────────────────────────────────── */

/** monthly ≈ amount × 0.003 × monthly turnover; yearly = 12 × monthly. */
export function estimateEarnings(amountUsd: number, monthlyTurnover: number, feeRate = LP_FEE_RATE) {
  const a = Number.isFinite(amountUsd) && amountUsd > 0 ? amountUsd : 0;
  const t = Number.isFinite(monthlyTurnover) && monthlyTurnover > 0 ? monthlyTurnover : 0;
  const monthly = a * feeRate * t;
  return { monthly, yearly: monthly * 12, apy: a > 0 ? (monthly * 12) / a : 0 };
}

/* ── Types ─────────────────────────────────────────────────────────── */

export interface LpPool {
  totalUsd: number | null;
  providers: number | null;
  volume30dUsd: number | null;
  lpFees30dUsd: number | null;
  turnover30d: number | null;
  /** Fraction (0.072 = 7.2%). */
  estApy: number | null;
  depositAddress: string;
  chains: string[];
  assets: string[];
  lockDays: number;
  lpFeeBps: number;
  riftFeeBps: number;
  termsVersion: string;
  updatedAt: string | null;
}

export interface LpActivity {
  at: string;
  corridor: string;
  direction: string;
  volumeUsd: number;
  lpFeeUsd: number;
}

export interface LpTerms {
  version: string;
  effectiveAt: string | null;
  markdown: string;
}

export interface LpProvider {
  id?: string;
  walletAddress?: string | null;
  displayName?: string | null;
  termsVersion?: string | null;
  termsAcceptedAt?: string | null;
}

export type DepositStatus = "pending" | "credited" | "rejected" | "held_terms";
export interface LpDeposit {
  id: string;
  source: "crypto" | "fiat" | string;
  chain?: string | null;
  asset?: string | null;
  amountUsd: number | null;
  fiatAmount?: number | null;
  fiatCurrency?: string | null;
  txHash?: string | null;
  status: DepositStatus | string;
  creditedAt?: string | null;
  lockedUntil?: string | null;
  createdAt?: string | null;
}

export interface LpAccrual {
  id: string;
  at: string;
  corridor: string;
  direction: string;
  volumeUsd: number;
  share: number | null;
  amountUsd: number;
}

export interface LpPayout {
  id: string;
  period: string;
  amountUsd: number;
  status: string;
  txHash?: string | null;
  paidAt?: string | null;
}

export interface LpWithdrawal {
  id: string;
  amountUsd: number;
  chain?: string | null;
  asset?: string | null;
  toAddress?: string | null;
  status: string;
  requestedAt?: string | null;
  paidAt?: string | null;
  txHash?: string | null;
  note?: string | null;
}

export interface LpMe {
  provider: LpProvider | null;
  principalUsd: number;
  withdrawableUsd: number;
  lockSchedule: { amountUsd: number; unlocksAt: string }[];
  earnedTotalUsd: number;
  earnedThisMonthUsd: number;
  unpaidUsd: number;
  /** Percent of the pool (12.5 = 12.5%). */
  sharePct: number | null;
  deposits: LpDeposit[];
  recentAccruals: LpAccrual[];
  payouts: LpPayout[];
  withdrawals: LpWithdrawal[];
}

/* ── Normalisers ───────────────────────────────────────────────────── */

const unwrap = (raw: any) => (raw && typeof raw === "object" && "data" in raw && raw.data && typeof raw.data === "object" ? raw.data : raw);
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const num0 = (v: unknown) => num(v) ?? 0;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

export function normalisePool(raw: any): LpPool {
  const p = unwrap(raw) ?? {};
  return {
    totalUsd: num(p.totalUsd),
    providers: num(p.providers),
    volume30dUsd: num(p.volume30dUsd),
    lpFees30dUsd: num(p.lpFees30dUsd),
    turnover30d: num(p.turnover30d),
    estApy: num(p.estApy),
    depositAddress: p.depositAddress || LP_DEPOSIT_ADDRESS,
    chains: arr(p.chains).length ? arr(p.chains).map((c) => String(c).toUpperCase()) : LP_CHAINS.map((c) => c.id),
    assets: arr(p.assets).length ? arr(p.assets).map((a) => String(a).toUpperCase()) : [...LP_ASSETS],
    lockDays: num(p.lockDays) ?? LP_LOCK_DAYS,
    lpFeeBps: num(p.lpFeeBps) ?? 30,
    riftFeeBps: num(p.riftFeeBps) ?? 99,
    termsVersion: p.termsVersion || LP_TERMS_VERSION,
    updatedAt: p.updatedAt ?? null,
  };
}

const normActivity = (a: any): LpActivity => ({
  at: str(a.at ?? a.accruedAt ?? a.createdAt),
  corridor: str(a.corridor ?? a.currency).toUpperCase(),
  direction: str(a.direction).toLowerCase(),
  volumeUsd: num0(a.volumeUsd),
  lpFeeUsd: num0(a.lpFeeUsd),
});

const normAccrual = (a: any, i: number): LpAccrual => ({
  id: str(a.id ?? `${a.source ?? "acc"}-${a.orderId ?? i}`),
  at: str(a.at ?? a.accruedAt ?? a.createdAt),
  corridor: str(a.corridor ?? a.currency ?? a.order?.corridor).toUpperCase(),
  direction: str(a.direction ?? a.order?.direction).toLowerCase(),
  volumeUsd: num0(a.volumeUsd ?? a.order?.volumeUsd),
  share: num(a.share),
  amountUsd: num0(a.amountUsd ?? a.amount),
});

const normDeposit = (d: any, i: number): LpDeposit => ({
  id: str(d.id ?? i),
  source: str(d.source || (d.txHash ? "crypto" : "fiat")),
  chain: d.chain ?? null,
  asset: d.asset ?? null,
  amountUsd: num(d.amountUsd),
  fiatAmount: num(d.fiatAmount),
  fiatCurrency: d.fiatCurrency ?? null,
  txHash: d.txHash ?? null,
  status: str(d.status || "pending"),
  creditedAt: d.creditedAt ?? null,
  lockedUntil: d.lockedUntil ?? null,
  createdAt: d.createdAt ?? null,
});

const normWithdrawal = (w: any, i: number): LpWithdrawal => ({
  id: str(w.id ?? i),
  amountUsd: num0(w.amountUsd),
  chain: w.chain ?? null,
  asset: w.asset ?? null,
  toAddress: w.toAddress ?? null,
  status: str(w.status || "requested"),
  requestedAt: w.requestedAt ?? w.createdAt ?? null,
  paidAt: w.paidAt ?? null,
  txHash: w.txHash ?? null,
  note: w.note ?? null,
});

export function normaliseMe(raw: any): LpMe {
  const m = unwrap(raw) ?? {};
  const prov = m.provider ?? null;
  return {
    provider: prov
      ? {
          id: prov.id,
          walletAddress: prov.walletAddress ?? prov.wallet_address ?? null,
          displayName: prov.displayName ?? null,
          termsVersion: prov.termsVersion ?? prov.terms_version ?? null,
          termsAcceptedAt: prov.termsAcceptedAt ?? prov.terms_accepted_at ?? null,
        }
      : null,
    principalUsd: num0(m.principalUsd),
    withdrawableUsd: num0(m.withdrawableUsd),
    lockSchedule: arr(m.lockSchedule)
      .map((l) => ({ amountUsd: num0(l.amountUsd), unlocksAt: str(l.unlocksAt) }))
      .sort((a, b) => Date.parse(a.unlocksAt) - Date.parse(b.unlocksAt)),
    earnedTotalUsd: num0(m.earnedTotalUsd),
    earnedThisMonthUsd: num0(m.earnedThisMonthUsd),
    unpaidUsd: num0(m.unpaidUsd),
    sharePct: num(m.sharePct),
    deposits: arr(m.deposits).map(normDeposit),
    recentAccruals: arr(m.recentAccruals).map(normAccrual),
    payouts: arr(m.payouts).map((p, i) => ({
      id: str(p.id ?? i),
      period: str(p.period),
      amountUsd: num0(p.amountUsd),
      status: str(p.status || "pending"),
      txHash: p.txHash ?? null,
      paidAt: p.paidAt ?? null,
    })),
    withdrawals: arr(m.withdrawals).map(normWithdrawal),
  };
}

/** Terms are accepted when the provider's version matches the current one. */
export function hasAcceptedTerms(me: LpMe | null | undefined, currentVersion: string) {
  return !!me?.provider?.termsAcceptedAt && me.provider.termsVersion === currentVersion;
}

/* ── Session ───────────────────────────────────────────────────────── */

export type LpSession =
  | { kind: "rift"; token: string }
  | { kind: "wallet"; token: string; address: string; expiresAt?: number };

const SESSION_KEY = "rift_lp_session";
const SESSION_EVENT = "rift:lp-session";

function jwtExp(token: string): number | undefined {
  try {
    const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof p.exp === "number" ? p.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function readWalletSession(): LpSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.token || !s?.address) return null;
    if (s.expiresAt && s.expiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { kind: "wallet", token: s.token, address: s.address, expiresAt: s.expiresAt };
  } catch {
    return null;
  }
}

/** A connected external wallet wins; otherwise the Rift login, if any. */
export function readLpSession(): LpSession | null {
  const wallet = readWalletSession();
  if (wallet) return wallet;
  try {
    const token = localStorage.getItem("token");
    if (token) return { kind: "rift", token };
  } catch {
    /* storage blocked */
  }
  return null;
}

export function saveWalletSession(token: string, address: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, address: address.toLowerCase(), expiresAt: jwtExp(token) }));
  } catch {
    /* storage blocked: session lives until reload via the event below */
  }
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function clearWalletSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function useLpSession() {
  const [session, setSession] = useState<LpSession | null>(() => readLpSession());
  useEffect(() => {
    const sync = () => setSession(readLpSession());
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const signOut = useCallback(() => clearWalletSession(), []);
  return { session, signOut };
}

/* ── API ───────────────────────────────────────────────────────────── */

async function lpCall<T>(method: "GET" | "POST", path: string, body?: unknown, session?: LpSession | null): Promise<T> {
  try {
    const { data } = await riftRequest<T>(method, `/v1/lp${path}`, body, session?.token ?? null);
    return data;
  } catch (e: any) {
    // An expired wallet session: drop it so the page offers sign-in again.
    if (session?.kind === "wallet" && e?.status === 401) clearWalletSession();
    throw e;
  }
}

export const lpApi = {
  pool: async () => normalisePool(await lpCall<any>("GET", "/pool")),
  activity: async (limit = 8): Promise<LpActivity[]> => {
    const raw = unwrap(await lpCall<any>("GET", `/pool/activity?limit=${limit}`));
    return arr(Array.isArray(raw) ? raw : raw?.activity ?? raw?.items).map(normActivity);
  },
  terms: async (): Promise<LpTerms> => {
    const t = unwrap(await lpCall<any>("GET", "/terms")) ?? {};
    return { version: t.version || LP_TERMS_VERSION, effectiveAt: t.effectiveAt ?? null, markdown: str(t.markdown) };
  },
  nonce: async (address: string): Promise<string> => {
    const r = unwrap(await lpCall<any>("POST", "/auth/nonce", { address }));
    if (!r?.message) throw new Error("Couldn't start sign-in. Try again.");
    return String(r.message);
  },
  verify: async (address: string, message: string, signature: string): Promise<string> => {
    const r = unwrap(await lpCall<any>("POST", "/auth/verify", { address, message, signature }));
    if (!r?.token) throw new Error("Sign-in failed. Try again.");
    return String(r.token);
  },
  me: async (session: LpSession) => {
    try {
      return normaliseMe(await lpCall<any>("GET", "/me", undefined, session));
    } catch (e: any) {
      // No provider row yet (first visit): an empty position, terms not accepted.
      if (e?.status === 404) return normaliseMe({});
      throw e;
    }
  },
  acceptTerms: (session: LpSession, version: string) => lpCall<any>("POST", "/terms/accept", { version }, session),
  depositCrypto: async (session: LpSession, body: { chain: string; txHash: string }) =>
    normDeposit(unwrap(await lpCall<any>("POST", "/deposits/crypto", body, session)) ?? {}, 0),
  depositFiat: async (session: LpSession, body: { currency: string; amount: number; phone: string; network: string }) =>
    unwrap(await lpCall<any>("POST", "/deposits/fiat", body, session)) ?? {},
  withdraw: async (session: LpSession, body: { amountUsd: number; chain: string; asset: string; toAddress: string }) =>
    normWithdrawal(unwrap(await lpCall<any>("POST", "/withdrawals", body, session)) ?? {}, 0),
};

/* ── Queries ───────────────────────────────────────────────────────── */

export function useLpPool() {
  return useQuery({ queryKey: ["lp", "pool"], queryFn: lpApi.pool, staleTime: 60_000, retry: 1 });
}

export function useLpActivity() {
  return useQuery({ queryKey: ["lp", "activity"], queryFn: () => lpApi.activity(8), staleTime: 60_000, retry: 1 });
}

export function useLpTerms(enabled = true) {
  return useQuery({ queryKey: ["lp", "terms"], queryFn: lpApi.terms, staleTime: 10 * 60_000, retry: 1, enabled });
}

export function useLpMe(session: LpSession | null) {
  return useQuery({
    queryKey: ["lp", "me", session?.kind, session?.token],
    queryFn: () => lpApi.me(session!),
    enabled: !!session,
    staleTime: 30_000,
    retry: false,
  });
}

/* ── External wallet sign-in ───────────────────────────────────────── */

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}
export interface InjectedWallet {
  id: string;
  name: string;
  icon?: string;
  provider: Eip1193Provider;
}

/**
 * Wallets in this browser: EIP-6963 announcements (one per extension), or
 * the legacy window.ethereum when nothing announces.
 */
export function useInjectedWallets(active: boolean) {
  const [wallets, setWallets] = useState<InjectedWallet[]>([]);
  useEffect(() => {
    if (!active) return;
    const found = new Map<string, InjectedWallet>();
    const publish = () => {
      const list = [...found.values()];
      const legacy = (window as any).ethereum as Eip1193Provider | undefined;
      if (!list.length && legacy?.request) list.push({ id: "injected", name: "Browser wallet", provider: legacy });
      setWallets(list);
    };
    const onAnnounce = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.provider?.request || !d?.info) return;
      found.set(String(d.info.uuid ?? d.info.rdns ?? d.info.name), {
        id: String(d.info.rdns ?? d.info.uuid ?? d.info.name),
        name: String(d.info.name ?? "Wallet"),
        icon: typeof d.info.icon === "string" && d.info.icon.startsWith("data:image/") ? d.info.icon : undefined,
        provider: d.provider,
      });
      publish();
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    publish();
    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, [active]);
  return wallets;
}

function utf8Hex(s: string) {
  return "0x" + Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("");
}

function friendlyWalletError(e: any): string {
  const code = e?.code ?? e?.error?.code;
  if (code === 4001 || /reject|denied|cancel/i.test(String(e?.message))) return "You cancelled the request in your wallet.";
  if (code === -32002) return "Your wallet already has a request open. Check the wallet window.";
  return e?.message ? String(e.message) : "Couldn't connect to your wallet.";
}

/** eth_requestAccounts → nonce → personal_sign → verify → LP session. */
export async function signInWithWallet(provider: Eip1193Provider, onStep?: (step: "connect" | "sign" | "verify") => void): Promise<string> {
  let address: string;
  let signature: string;
  let message: string;
  try {
    onStep?.("connect");
    const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
    if (!accounts?.[0]) throw new Error("No account was shared by your wallet.");
    address = String(accounts[0]);
  } catch (e) {
    throw new Error(friendlyWalletError(e));
  }
  message = await lpApi.nonce(address);
  try {
    onStep?.("sign");
    signature = String(await provider.request({ method: "personal_sign", params: [utf8Hex(message), address] }));
  } catch (e) {
    throw new Error(friendlyWalletError(e));
  }
  onStep?.("verify");
  const token = await lpApi.verify(address, message, signature);
  saveWalletSession(token, address);
  return address;
}

/* ── Formatting helpers ────────────────────────────────────────────── */

export const fmtUsd = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : `$${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/** Small amounts (per-tx earnings) need more than cents. */
export const fmtUsdSmall = (n: number) => (Math.abs(n) > 0 && Math.abs(n) < 0.01 ? `$${n.toFixed(4)}` : fmtUsd(n));

export const fmtPct = (fraction: number | null | undefined, digits = 1) =>
  fraction === null || fraction === undefined || !Number.isFinite(fraction) ? "—" : `${(fraction * 100).toFixed(digits)}%`;

export const fmtDate = (iso?: string | null, withYear = true) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });
};

export const fmtPeriod = (period: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period || "—";
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export const directionLabel = (d: string) => (d === "onramp" ? "Cash in" : d === "offramp" ? "Cash out" : d ? d[0].toUpperCase() + d.slice(1) : "—");

export const isTxHash = (v: string) => /^0x[0-9a-fA-F]{64}$/.test(v.trim());
