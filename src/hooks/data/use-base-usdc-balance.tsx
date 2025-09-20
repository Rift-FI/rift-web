import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface BaseUSDCBalance {
  usdcAmount: number;
  kesAmount: number;
  exchangeRate: number;
  currency: "KES";
}

async function getBaseUSDCBalance(): Promise<BaseUSDCBalance> {
  try {
    // Ensure rift has the auth token
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      return {
        usdcAmount: 0,
        kesAmount: 0,
        exchangeRate: 0,
        currency: "KES",
      };
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
        kesAmount: 0,
        exchangeRate: 0,
        currency: "KES",
      };
    }

    // 2. Get exchange rate from Rift offramp service
    const exchangeRateResponse = await rift.offramp.previewExchangeRate({
      currency: "KES" as any, // OfframpCurrency.KES
    });

    const exchangeRate = exchangeRateResponse.rate || 0;
    const kesAmount = usdcAmount * exchangeRate;

    return {
      usdcAmount,
      kesAmount,
      exchangeRate,
      currency: "KES",
    };
  } catch (error) {
    console.error("Failed to get Base USDC balance:", error);
    return {
      usdcAmount: 0,
      kesAmount: 0,
      exchangeRate: 0,
      currency: "KES",
    };
  }
}

export default function useBaseUSDCBalance() {
  const query = useQuery({
    queryKey: ["base-usdc-balance"],
    queryFn: getBaseUSDCBalance,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  return {
    data: query.data,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}