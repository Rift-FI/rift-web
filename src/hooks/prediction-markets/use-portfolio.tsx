import { useQuery } from "@tanstack/react-query";
import { marketsApi } from "../../lib/prediction-market";

// Portfolio interfaces
export interface PortfolioPosition {
  marketId: string;
  question: string;
  position: "YES" | "NO";
  amount: string;
  currentValue: string;
  pnl: string;
  pnlPercentage: number;
  isResolved: boolean;
  endTime: string;
  category: string;
}

export interface PortfolioSummary {
  totalValue: string;
  totalInvested: string;
  totalPnL: string;
  pnlPercentage: number;
  activePositions: number;
  resolvedPositions: number;
  winRate: number;
  totalVolume: string;
  bestPerformer: {
    marketId: string;
    question: string;
    pnl: string;
    pnlPercentage: number;
  } | null;
  recentActivity: Array<{
    id: string;
    type: "stake" | "claim" | "resolve";
    marketId: string;
    question: string;
    amount: string;
    timestamp: string;
    status: "success" | "pending" | "failed";
  }>;
}

export interface Portfolio {
  summary: PortfolioSummary;
  positions: PortfolioPosition[];
}

// Hook to get user's complete portfolio
export const usePortfolio = (userAddress?: string) => {
  return useQuery({
    queryKey: ["portfolio", userAddress],
    queryFn: async () => {
      if (!userAddress) throw new Error("User address required");

      const response = await marketsApi.getPortfolio(userAddress);
      return response.data.data as Portfolio;
    },
    enabled: !!userAddress,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};

// Hook to get user's portfolio summary only (lighter weight)
export const usePortfolioSummary = (userAddress?: string) => {
  return useQuery({
    queryKey: ["portfolio-summary", userAddress],
    queryFn: async () => {
      if (!userAddress) throw new Error("User address required");

      const response = await marketsApi.getPortfolioSummary(userAddress);
      return response.data.data as PortfolioSummary;
    },
    enabled: !!userAddress,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};
