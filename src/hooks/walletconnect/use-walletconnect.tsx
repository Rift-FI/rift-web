/**
 * WalletConnect React Hooks
 * Transactions are queued — user must approve or reject.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  pairWithDApp,
  getActiveSessions,
  disconnectSession,
  getPendingRequests,
  approveRequest,
  previewRequest,
  rejectRequest,
  handleWCError,
  type WCSupportedChain,
} from "@/lib/walletconnect";
import { signTicket } from "@/lib/nonCustodial";

export function useWalletConnectPair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uri,
      chain,
      token,
    }: {
      uri: string;
      chain: WCSupportedChain;
      token: string;
    }) => pairWithDApp(uri, chain, token),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          result.peerName
            ? `Connected to ${result.peerName}`
            : "Connected to DApp!"
        );
        queryClient.invalidateQueries({
          queryKey: ["walletconnect", "sessions"],
        });
      } else {
        toast.error(handleWCError(result.error || "Connection failed"));
      }
    },
    onError: () => {
      toast.error("Failed to connect to DApp");
    },
  });
}

export function useWalletConnectSessions() {
  return useQuery({
    queryKey: ["walletconnect", "sessions"],
    queryFn: () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");
      return getActiveSessions(token);
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useWalletConnectDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topic, token }: { topic: string; token: string }) =>
      disconnectSession(topic, token),
    onSuccess: (success) => {
      if (success) {
        toast.success("Disconnected from DApp");
      } else {
        toast.error("Failed to disconnect");
      }
      queryClient.invalidateQueries({
        queryKey: ["walletconnect", "sessions"],
      });
    },
    onError: () => {
      toast.error("Failed to disconnect");
    },
  });
}

export function useWalletConnectRequests(enabled: boolean = true) {
  return useQuery({
    queryKey: ["walletconnect", "requests"],
    queryFn: () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");
      return getPendingRequests(token);
    },
    enabled,
    refetchInterval: 3000,
    staleTime: 1000,
  });
}

export function useWalletConnectApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, token }: { requestId: number; token: string }) => {
      // Every dApp request (eth_sendTransaction → SafeOp hash;
      // personal_sign / typed data → ERC-1271 SafeMessage hash) is
      // approved with a passkey: preview for the ticket + hash_to_sign,
      // sign it, then approve with { ticketId, authProof }. Approving
      // without a proof is no longer possible (backend answers 202
      // APPROVAL_REQUIRED).
      const preview = await previewRequest(requestId, token);
      if (!preview.success) {
        return { success: false, error: preview.error || "Preview failed", result: undefined as string | undefined };
      }
      if (!preview.hash_to_sign) {
        return {
          success: false,
          error: "Preview returned no hash to sign",
          result: undefined as string | undefined,
        };
      }
      let authProof;
      try {
        authProof = await signTicket({
          hashToSign: preview.hash_to_sign,
          allowCredentials: preview.allowCredentials ?? [],
        });
      } catch (e: any) {
        return {
          success: false,
          error: e?.message || "Signing was cancelled",
          result: undefined as string | undefined,
        };
      }
      return approveRequest(requestId, token, authProof, preview.ticketId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          result.result
            ? `Approved! Tx: ${result.result.slice(0, 10)}...`
            : "Transaction approved!"
        );
      } else {
        toast.error(result.error || "Approval failed");
      }
      queryClient.invalidateQueries({
        queryKey: ["walletconnect", "requests"],
      });
    },
    onError: () => {
      toast.error("Failed to approve transaction");
    },
  });
}

export function useWalletConnectReject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      token,
    }: {
      requestId: number;
      token: string;
    }) => rejectRequest(requestId, token),
    onSuccess: () => {
      toast.success("Transaction rejected");
      queryClient.invalidateQueries({
        queryKey: ["walletconnect", "requests"],
      });
    },
    onError: () => {
      toast.error("Failed to reject transaction");
    },
  });
}

/**
 * Convenience hook that bundles all WalletConnect operations.
 */
export function useWalletConnect() {
  const queryClient = useQueryClient();
  const pair = useWalletConnectPair();
  const sessions = useWalletConnectSessions();
  const disconnect = useWalletConnectDisconnect();
  const approve = useWalletConnectApprove();
  const reject = useWalletConnectReject();

  return {
    // Data
    sessions: sessions.data || [],
    sessionsLoading: sessions.isPending,

    // Pair
    pairWithDApp: (uri: string, chain: WCSupportedChain, token: string) =>
      pair.mutateAsync({ uri, chain, token }),
    isPairing: pair.isPending,
    pairResult: pair.data,

    // Disconnect
    disconnectSession: (topic: string, token: string) =>
      disconnect.mutate({ topic, token }),
    isDisconnecting: disconnect.isPending,

    // Requests
    approveRequest: (requestId: number, token: string) =>
      approve.mutateAsync({ requestId, token }),
    rejectRequest: (requestId: number, token: string) =>
      reject.mutate({ requestId, token }),
    isApproving: approve.isPending,
    isRejecting: reject.isPending,

    // Refresh
    refreshSessions: () => {
      queryClient.invalidateQueries({
        queryKey: ["walletconnect", "sessions"],
      });
    },
  };
}
