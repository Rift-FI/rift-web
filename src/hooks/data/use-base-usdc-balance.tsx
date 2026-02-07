import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export type SupportedCurrency = "KES" | "NGN" | "ETB" | "UGX" | "GHS" | "USD";

export interface BaseUSDCBalance {
  usdcAmount: number;
  localAmount: number;
  exchangeRate: number;
  currency: SupportedCurrency;
}

interface UseBaseUSDCBalanceParams {
  currency?: SupportedCurrency;
}

async function getBaseUSDCBalance(currency: SupportedCurrency = "USD"): Promise<BaseUSDCBalance> {
  // Ensure rift has the auth token
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    throw new Error("No authentication token found");
  }

  // Set the bearer token on rift instance
  rift.setBearerToken(authToken);

  // 1. Get Base USDC balance directly
  const balanceResponse = await rift.wallet.getTokenBalance({
    token: "USDC",
    chain: "BASE", // Base chain
  });

  const balance = balanceResponse?.data?.at(0);
  const usdcAmount = balance?.amount || 0;

  if (usdcAmount === 0) {
    return {
      usdcAmount: 0,
      localAmount: 0,
      exchangeRate: currency === "USD" ? 1 : 0,
      currency,
    };
  }

  // For USD, no conversion needed (USDC = USD)
  if (currency === "USD") {
    return {
      usdcAmount,
      localAmount: usdcAmount,
      exchangeRate: 1,
      currency: "USD",
    };
  }

  // Use rift sdk to get exchange rate for other currencies
  const exchangeRateResponse = await rift.offramp.previewExchangeRate({
    currency: currency as any,
  });
  const exchangeRate = exchangeRateResponse.rate;
  const localAmount = usdcAmount * exchangeRate;

  return {
    usdcAmount,
    localAmount,
    exchangeRate,
    currency,
  };
}

export default function useBaseUSDCBalance(params: UseBaseUSDCBalanceParams = {}) {
  const { currency = "USD" } = params;

  const query = useQuery({
    queryKey: ["base-usdc-balance", currency],
    queryFn: () => getBaseUSDCBalance(currency),
    refetchInterval: 1000, // Refetch every 1 second for real-time updates
    staleTime: 500, // Consider data stale after 500ms
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
  });

  return {
    data: query.data,
    isLoading: query.isPending || (!query.data && !query.error), // Don't show as loaded if we have no data
    error: query.error,
    refetch: query.refetch,
  };
}
