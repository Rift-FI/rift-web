import { useQuery, keepPreviousData } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { handleSuspension } from "@/utils/api-suspension-handler";
import type { SupportedCurrency } from "./use-base-usdc-balance";

const SUPPORTED_CHAINS = ["BASE", "ETHEREUM", "POLYGON", "CELO", "ARBITRUM", "LISK"] as const;
const SUPPORTED_TOKENS = ["USDC", "USDT"] as const;

// Cache the last successful exchange rate so we never show wrong balance
const lastGoodRate: Record<string, number> = {};

export interface ChainTokenBalance {
  token: "USDC" | "USDT";
  chain: (typeof SUPPORTED_CHAINS)[number];
  amount: number;
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
}

async function fetchAggregateBalance(currency: SupportedCurrency): Promise<AggregateBalance> {
  const authToken = localStorage.getItem("token");
  if (!authToken) throw new Error("No authentication token found");

  rift.setBearerToken(authToken);

  // Fetch all balances in parallel
  const balancePromises: Promise<ChainTokenBalance>[] = [];

  for (const chain of SUPPORTED_CHAINS) {
    for (const token of SUPPORTED_TOKENS) {
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
            return { token, chain, amount: 0 };
          })
      );
    }
  }

  const breakdown = await Promise.all(balancePromises);

  const totalUsdc = breakdown
    .filter((b) => b.token === "USDC")
    .reduce((sum, b) => sum + b.amount, 0);

  const totalUsdt = breakdown
    .filter((b) => b.token === "USDT")
    .reduce((sum, b) => sum + b.amount, 0);

  // USDC ≈ 1 USD, USDT ≈ 1 USD
  const totalUsd = totalUsdc + totalUsdt;

  // Get exchange rate for local currency
  let exchangeRate = 1;
  let localAmount = totalUsd;

  if (currency !== "USD" && totalUsd > 0) {
    try {
      const rateResponse = await rift.offramp.previewExchangeRate({
        currency: currency as any,
      });
      exchangeRate = rateResponse.rate;
      lastGoodRate[currency] = exchangeRate;
      localAmount = totalUsd * exchangeRate;
    } catch {
      // Use last known good rate instead of falling back to USD
      if (lastGoodRate[currency]) {
        exchangeRate = lastGoodRate[currency];
        localAmount = totalUsd * exchangeRate;
      } else {
        localAmount = totalUsd;
      }
    }
  }

  return {
    totalUsd,
    localAmount,
    exchangeRate,
    currency,
    totalUsdc,
    totalUsdt,
    breakdown,
  };
}

export default function useAggregateBalance(params: { currency?: SupportedCurrency } = {}) {
  const { currency = "USD" } = params;

  const query = useQuery({
    queryKey: ["aggregate-balance", currency],
    queryFn: () => fetchAggregateBalance(currency),
    refetchInterval: 5000,
    staleTime: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data,
    isLoading: query.isPending || (!query.data && !query.error),
    error: query.error,
    refetch: query.refetch,
  };
}
