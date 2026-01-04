import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import rift from "@/lib/rift";

// Types
export interface VaultData {
  address: string;
  balance: string;
  rewards: string;
  hasPendingClaim: boolean;
  pendingWithdrawal: string;
  hasPendingWithdrawal: boolean;
}

export interface ProtocolStats {
  tvl: string;
  totalDeposits: string;
  pendingRewards: string;
  rewardsDistributed: string;
  pendingClaimersCount: number;
  pendingWithdrawersCount: number;
}

// Hook to get user's vault data
export function useVaultData() {
  return useQuery({
    queryKey: ["vault-data"],
    queryFn: async (): Promise<VaultData | null> => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) {
          console.log("🏦 [Vault] No auth token");
          return null;
        }

        rift.setBearerToken(authToken);
        console.log("🏦 [Vault] Fetching vault data...");

        const data = await rift.vault.getMyVaultData();
        console.log("🏦 [Vault] Data fetched:", data);
        return data;
      } catch (error: any) {
        console.error("🏦 [Vault] Error fetching vault data:", error);
        return null;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // 30 seconds
    retry: false,
  });
}

// Hook to get protocol stats
export function useProtocolStats() {
  return useQuery({
    queryKey: ["vault-protocol-stats"],
    queryFn: async (): Promise<ProtocolStats | null> => {
      try {
        console.log("🏦 [Vault] Fetching protocol stats...");
        const stats = await rift.vault.getProtocolStats();
        console.log("🏦 [Vault] Protocol stats:", stats);
        return stats;
      } catch (error: any) {
        console.error("🏦 [Vault] Error fetching protocol stats:", error);
        return null;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60, // 1 minute
    retry: false,
  });
}

// Hook to deposit into vault
export function useVaultDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: string) => {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("Please log in to continue");
      }

      console.log("🏦 [Vault] Rift SDK instance:", rift);
      console.log("🏦 [Vault] Vault service:", rift.vault);
      
      rift.setBearerToken(authToken);
      console.log("🏦 [Vault] Depositing:", amount);

      if (!rift.vault) {
        throw new Error("Vault service not available. Please update the app.");
      }

      const result = await rift.vault.deposit({ amount });
      console.log("🏦 [Vault] Deposit result:", result);
      return result;
    },
    onSuccess: () => {
      // Refresh vault data after deposit
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["vault-data"] });
        queryClient.invalidateQueries({ queryKey: ["vault-protocol-stats"] });
      }, 3000);
    },
  });
}

// Hook to withdraw from vault
export function useVaultWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: string) => {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("Please log in to continue");
      }

      rift.setBearerToken(authToken);
      console.log("🏦 [Vault] Requesting withdrawal:", amount);

      const result = await rift.vault.withdraw({ amount });
      console.log("🏦 [Vault] Withdrawal result:", result);
      return result;
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["vault-data"] });
      }, 3000);
    },
  });
}

// Hook to cancel withdrawal
export function useVaultCancelWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("Please log in to continue");
      }

      rift.setBearerToken(authToken);
      console.log("🏦 [Vault] Cancelling withdrawal...");

      const result = await rift.vault.cancelWithdrawal();
      console.log("🏦 [Vault] Cancel withdrawal result:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-data"] });
    },
  });
}

// Hook to claim rewards
export function useVaultClaimRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("Please log in to continue");
      }

      rift.setBearerToken(authToken);
      console.log("🏦 [Vault] Claiming rewards...");

      const result = await rift.vault.claimRewards();
      console.log("🏦 [Vault] Claim result:", result);
      return result;
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["vault-data"] });
      }, 3000);
    },
  });
}

// Hook to cancel claim
export function useVaultCancelClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("Please log in to continue");
      }

      rift.setBearerToken(authToken);
      console.log("🏦 [Vault] Cancelling claim...");

      const result = await rift.vault.cancelClaim();
      console.log("🏦 [Vault] Cancel claim result:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-data"] });
    },
  });
}

