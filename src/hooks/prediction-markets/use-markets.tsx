import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketsApi, p2pApi } from "../../lib/prediction-market";

export const useMarkets = () => {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => marketsApi.getAll().then((res) => res.data),
    // staleTime: 1000 * 60 * 2,
  });
};

export const useMarket = (id: string) => {
  return useQuery({
    queryKey: ["market", id],
    queryFn: () => marketsApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useMarketStats = (id: string) => {
  return useQuery({
    queryKey: ["market-stats", id],
    queryFn: () => marketsApi.getStats(id).then((res) => res.data),
    enabled: !!id,
    // staleTime: 1000 * 30, // 30 seconds
  });
};

export const useMarketHistory = (id: string) => {
  return useQuery({
    queryKey: ["market-history", id],
    queryFn: () => marketsApi.getHistory(id).then((res) => res.data),
    enabled: !!id,
    // staleTime: 1000 * 60, // 1 minute
  });
};

// === NEW: Early Exit Hooks ===

export const useCanEarlyExit = (marketId: string, userAddress?: string) => {
  return useQuery({
    queryKey: ["can-early-exit", marketId, userAddress],
    queryFn: () =>
      marketsApi
        .canEarlyExit(marketId, userAddress!)
        .then((res) => res.data.data),
    enabled: !!marketId && !!userAddress,
    // staleTime: 1000 * 30, // 30 seconds
  });
};

export const useEarlyExitValue = (marketId: string, userAddress?: string) => {
  return useQuery({
    queryKey: ["early-exit-value", marketId, userAddress],
    queryFn: () =>
      marketsApi
        .getEarlyExitValue(marketId, userAddress!)
        .then((res) => res.data.data),
    enabled: !!marketId && !!userAddress,
    // staleTime: 1000 * 30, // 30 seconds
  });
};

export const useMarketListings = (marketId: string) => {
  return useQuery({
    queryKey: ["market-listings", marketId],
    queryFn: () => p2pApi.getListings(marketId).then((res) => res.data),
    enabled: !!marketId,
    // staleTime: 1000 * 30, // 30 seconds
  });
};

export const useStakeMarket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      marketId,
      position,
      amount,
    }: {
      marketId: string;
      position: "YES" | "NO";
      amount: string;
    }) => marketsApi.stake(marketId, position, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });
};

export const useClaimPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (marketId: string) => marketsApi.claim(marketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });
};
