import { useQuery, keepPreviousData } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { handleSuspension } from "@/utils/api-suspension-handler";

// Cache last known good exchange rate per currency
const lastGoodRate: Record<string, number> = {};

export type SupportedCurrency = "KES" | "NGN" | "UGX" | "TZS" | "CDF" | "MWK" | "BRL" | "USD";

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
  let balanceResponse;
  try {
    balanceResponse = await rift.wallet.getTokenBalance({
      token: "USDC",
      chain: "BASE", // Base chain
    });
  } catch (error: any) {
    // Check for account suspension
    const status = error?.response?.status || error?.status;
    const data = error?.response?.data || error?.data || {};
    if (status === 403 && data?.message === "Account suspended") {
      handleSuspension();
    }
    throw error;
  }

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
  let exchangeRate: number;
  try {
    const exchangeRateResponse = await rift.offramp.previewExchangeRate({
      currency: currency as any,
    });
    exchangeRate = exchangeRateResponse.rate;
    lastGoodRate[currency] = exchangeRate;
  } catch {
    // Use last known good rate if available
    if (lastGoodRate[currency]) {
      exchangeRate = lastGoodRate[currency];
    } else {
      throw new Error("Failed to fetch exchange rate");
    }
  }
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
    refetchInterval: 3000, // Refetch every 3 seconds (was 1s, too aggressive on bad network)
    staleTime: 2000, // Consider data stale after 2 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data,
    isLoading: query.isPending || (!query.data && !query.error), // Don't show as loaded if we have no data
    error: query.error,
    refetch: query.refetch,
  };
}
