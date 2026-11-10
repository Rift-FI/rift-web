import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { handleSuspension } from "@/utils/api-suspension-handler";
import type { SupportedCurrency } from "./use-base-usdc-balance";

const SUPPORTED_CHAINS = ["BASE", "ETHEREUM", "POLYGON", "CELO", "ARBITRUM", "LISK"] as const;
const SUPPORTED_TOKENS = ["USDC", "USDT"] as const;

// Cache the last successful exchange rate so we never show wrong balance
const lastGoodRate: Record<string, number> = {};

// Last successfully fetched amount per chain/token, per wallet. A failed
// request reuses it instead of counting as 0 (a network blip used to make
// the balance read $0). Persisted so a reload while offline still shows
// the last known balance, flagged as stale.
const LAST_KEY = "rift:last-balance";

function walletKey() {
  return localStorage.getItem("address") || "anon";
}

function readLast(): { at: number; amounts: Record<string, number> } | null {
  try {
    const all = JSON.parse(localStorage.getItem(LAST_KEY) || "{}");
    return all[walletKey()] ?? null;
  } catch {
    return null;
  }
}

function writeLast(amounts: Record<string, number>) {
  try {
    const all = JSON.parse(localStorage.getItem(LAST_KEY) || "{}");
    all[walletKey()] = { at: Date.now(), amounts };
    localStorage.setItem(LAST_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — fine, we just lose the offline fallback */
  }
}

export interface ChainTokenBalance {
  token: "USDC" | "USDT";
  chain: (typeof SUPPORTED_CHAINS)[number];
  amount: number;
  /** true when this amount is the last known value, not a fresh read */
  stale?: boolean;
}

export interface AggregateBalance {
  /** Total USD value across all tokens and chains */
  totalUsd: number;
  /** Total converted to local currency */
  localAmount: number;
  /** Exchange rate used */
  exchangeRate: number;
  /** Currency used */
  currency: SupportedCurrency;
  /** Total USDC across all chains */
  totalUsdc: number;
  /** Total USDT across all chains */
  totalUsdt: number;
  /** Per-chain-token breakdown */
  breakdown: ChainTokenBalance[];
  /** Some or all amounts are last-known values because a request failed */
  stale: boolean;
  /** When the amounts were last read successfully (ms) */
  updatedAt: number;
}

function summarise(breakdown: ChainTokenBalance[], currency: SupportedCurrency, rate: number, updatedAt: number): AggregateBalance {
  const totalUsdc = breakdown.filter((b) => b.token === "USDC").reduce((s, b) => s + b.amount, 0);
  const totalUsdt = breakdown.filter((b) => b.token === "USDT").reduce((s, b) => s + b.amount, 0);
  const totalUsd = totalUsdc + totalUsdt;
  return {
    totalUsd,
    localAmount: currency === "USD" ? totalUsd : totalUsd * rate,
    exchangeRate: rate,
    currency,
    totalUsdc,
    totalUsdt,
    breakdown,
    stale: breakdown.some((b) => b.stale),
    updatedAt,
  };
}

/** Last known balance for this wallet, for first paint before (or without) a fresh read. */
function lastKnownBalance(currency: SupportedCurrency): AggregateBalance | undefined {
  const last = readLast();
  if (!last) return undefined;
  const breakdown: ChainTokenBalance[] = [];
  for (const chain of SUPPORTED_CHAINS)
    for (const token of SUPPORTED_TOKENS)
      breakdown.push({ token, chain, amount: last.amounts[`${chain}:${token}`] ?? 0, stale: true });
  const rate = currency === "USD" ? 1 : lastGoodRate[currency];
  if (currency !== "USD" && !rate) return undefined;
  return summarise(breakdown, currency, rate ?? 1, last.at);
}

async function fetchAggregateBalance(currency: SupportedCurrency): Promise<AggregateBalance> {
  const authToken = localStorage.getItem("token");
  if (!authToken) throw new Error("No authentication token found");

  rift.setBearerToken(authToken);

  const last = readLast();

  // Fetch all balances in parallel
  const balancePromises: Promise<ChainTokenBalance & { failed?: boolean }>[] = [];

  for (const chain of SUPPORTED_CHAINS) {
    for (const token of SUPPORTED_TOKENS) {
      const key = `${chain}:${token}`;
      balancePromises.push(
        rift.wallet
          .getTokenBalance({ token: token as any, chain: chain as any })
          .then((res) => ({
            token,
            chain,
            amount: res?.data?.at(0)?.amount || 0,
          }))
          .catch((error: any) => {
            // Check for suspension
            const status = error?.response?.status || error?.status;
            const data = error?.response?.data || error?.data || {};
            if (status === 403 && data?.message === "Account suspended") {
              handleSuspension();
            }
            // Never count a failed read as 0: keep the last known amount.
            return { token, chain, amount: last?.amounts[key] ?? 0, stale: true, failed: true };
          })
      );
    }
  }

  const results = await Promise.all(balancePromises);
  const failures = results.filter((r) => r.failed).length;
  if (failures === results.length && !last) {
    // Nothing read and nothing known: an error, not "$0".
    throw new Error("Couldn't load your balance");
  }
  const breakdown: ChainTokenBalance[] = results.map(({ failed: _f, ...b }) => b);

  const amounts: Record<string, number> = { ...(last?.amounts ?? {}) };
  for (const r of results) if (!r.failed) amounts[`${r.chain}:${r.token}`] = r.amount;
  if (failures < results.length) writeLast(amounts);

  // USDC ≈ 1 USD, USDT ≈ 1 USD
  const totalUsd = breakdown.reduce((s, b) => s + b.amount, 0);

  // Get exchange rate for local currency
  let exchangeRate = 1;
  if (currency !== "USD" && totalUsd > 0) {
    try {
      const rateResponse = await rift.offramp.previewExchangeRate({
        currency: currency as any,
      });
      exchangeRate = rateResponse.rate;
      lastGoodRate[currency] = exchangeRate;
    } catch {
      // Use last known good rate instead of falling back to USD
      exchangeRate = lastGoodRate[currency] ?? 1;
    }
  }

  return summarise(breakdown, currency, exchangeRate, failures < results.length ? Date.now() : last!.at);
}

export default function useAggregateBalance(params: { currency?: SupportedCurrency } = {}) {
  const { currency = "USD" } = params;

  const query = useQuery({
    queryKey: ["aggregate-balance", currency],
    queryFn: () => fetchAggregateBalance(currency),
    refetchInterval: 15_000,
    staleTime: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    placeholderData: (prev) => prev ?? lastKnownBalance(currency),
  });

  return {
    data: query.data,
    isLoading: query.isPending && !query.data,
    error: query.error,
    /** Showing last-known amounts (a refresh failed) */
    isStale: !!query.data?.stale || (query.isError && !!query.data),
    refetch: query.refetch,
  };
}
