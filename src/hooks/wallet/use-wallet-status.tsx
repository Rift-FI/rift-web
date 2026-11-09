import { useQuery } from "@tanstack/react-query";
import { fetchWalletStatus, getCachedWalletStatus } from "@/lib/passkeyWallet";

export const WALLET_STATUS_KEY = ["wallet-status"] as const;

/**
 * GET /v1/wallet/status, seeded from the login response's `walletStatus`
 * so the passkey-setup gate can open without waiting for a round-trip.
 */
export default function useWalletStatus(enabled = true) {
  return useQuery({
    queryKey: WALLET_STATUS_KEY,
    queryFn: fetchWalletStatus,
    initialData: getCachedWalletStatus() ?? undefined,
    enabled: enabled && !!localStorage.getItem("token"),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
