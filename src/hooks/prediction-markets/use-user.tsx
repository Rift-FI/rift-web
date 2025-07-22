import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, transactionsApi } from "../../lib/prediction-market";

export const useUserProfile = (address?: string) => {
  return useQuery({
    queryKey: ["user-profile", address],
    queryFn: () =>
      address ? userApi.getProfile(address).then((res) => res.data) : null,
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUserStats = (address?: string) => {
  return useQuery({
    queryKey: ["user-stats", address],
    queryFn: () =>
      address ? userApi.getStats(address).then((res) => res.data) : null,
    enabled: !!address,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};

export const useUserPositions = (address?: string) => {
  return useQuery({
    queryKey: ["user-positions", address],
    queryFn: () =>
      address ? userApi.getPositions(address).then((res) => res.data) : [],
    enabled: !!address,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useUserTransactions = (address?: string) => {
  return useQuery({
    queryKey: ["user-transactions", address],
    queryFn: () =>
      address
        ? transactionsApi.getUserTransactions(address).then((res) => res.data)
        : [],
    enabled: !!address,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useTransactionStatus = (hash?: string) => {
  return useQuery({
    queryKey: ["transaction-status", hash],
    queryFn: () =>
      hash ? transactionsApi.getStatus(hash).then((res) => res.data) : null,
    enabled: !!hash,
    refetchInterval: (query) => {
      // Stop polling if transaction is confirmed or failed
      const data = query.state.data;
      if (data?.status === "confirmed" || data?.status === "failed") {
        return false;
      }
      return 2000; // Poll every 2 seconds for pending transactions
    },
  });
};

export const useSubmitTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      signedTx,
      type,
      metadata,
    }: {
      signedTx: string;
      type: string;
      metadata?: any;
    }) => transactionsApi.submitSignedTransaction(signedTx, type, metadata),
    onSuccess: () => {
      // Invalidate transaction-related queries
      queryClient.invalidateQueries({ queryKey: ["user-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
};
