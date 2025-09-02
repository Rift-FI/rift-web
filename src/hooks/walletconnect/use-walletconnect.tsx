/**
 * WalletConnect React Hook
 * Main hook for managing WalletConnect functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  checkWCStatus,
  startWCService,
  connectToDApp,
  getActiveSessions,
  disconnectSession,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  handleWCError,
  type WCConnectionResult,
  type WCApprovalResult
} from '@/lib/walletconnect';

export function useWalletConnectStatus() {
  return useQuery({
    queryKey: ['walletconnect', 'status'],
    queryFn: checkWCStatus,
    enabled: false, // DISABLED - no automatic polling
    staleTime: Infinity, // Never consider stale
  });
}

export function useWalletConnectStart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (token: string) => startWCService(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletconnect', 'status'] });
    },
    onError: (error) => {
      console.error('Failed to start WalletConnect service:', error);
      toast.error('Failed to start WalletConnect service');
    }
  });
}

export function useWalletConnectConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uri, token }: { uri: string; token: string }) => 
      connectToDApp(uri, token),
    onSuccess: async (result: WCConnectionResult) => {
      if (result.success) {
        toast.success('Successfully connected to dApp!');
        
        // Wait a moment for backend to process the connection
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['walletconnect', 'sessions'] });
          queryClient.refetchQueries({ queryKey: ['walletconnect', 'sessions'] });
        }, 1000); // 1 second delay to allow backend processing
      } else {
        toast.error(handleWCError(result.error || 'Connection failed'));
      }
    },
    onError: () => {
      toast.error('Failed to connect to dApp');
    }
  });
}

export function useWalletConnectSessions() {
  return useQuery({
    queryKey: ['walletconnect', 'sessions'],
    queryFn: () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token');
      }
      return getActiveSessions(token);
    },
    enabled: true,
    staleTime: 5 * 1000, // 5 seconds - shorter for faster updates
    refetchOnWindowFocus: false,
    retry: 3, // Retry failed requests
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

export function useWalletConnectDisconnect() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ topic, token }: { topic: string; token: string }) =>
      disconnectSession(topic, token),
    onSuccess: () => {
      toast.success('Disconnected from dApp');
      queryClient.invalidateQueries({ queryKey: ['walletconnect', 'sessions'] });
    },
    onError: (error) => {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  });
}

export function useWalletConnectRequests() {
  return useQuery({
    queryKey: ['walletconnect', 'requests'],
    queryFn: () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      return getPendingRequests(token);
    },
    enabled: false, // DISABLED - no automatic polling
    staleTime: Infinity, // Never consider stale
  });
}

export function useWalletConnectApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, token }: { requestId: string; token: string }) =>
      approveRequest(requestId, token),
    onSuccess: (result: WCApprovalResult) => {
      if (result.success) {
        toast.success('Transaction approved!');
        if (result.txHash) {
          toast.success(`Transaction hash: ${result.txHash.slice(0, 10)}...`);
        }
      } else {
        toast.error(handleWCError(result.error || 'Approval failed'));
      }
      queryClient.invalidateQueries({ queryKey: ['walletconnect', 'requests'] });
    },
    onError: (error) => {
      console.error('Approval error:', error);
      toast.error('Failed to approve transaction');
    }
  });
}

export function useWalletConnectRejection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, reason, token }: { requestId: string; reason: string; token: string }) =>
      rejectRequest(requestId, reason, token),
    onSuccess: () => {
      toast.success('Transaction rejected');
      queryClient.invalidateQueries({ queryKey: ['walletconnect', 'requests'] });
    },
    onError: (error) => {
      console.error('Rejection error:', error);
      toast.error('Failed to reject transaction');
    }
  });
}

/**
 * Main WalletConnect hook that orchestrates everything
 */
export function useWalletConnect() {
  const queryClient = useQueryClient();
  
  const status = useWalletConnectStatus();
  const startService = useWalletConnectStart();
  const connect = useWalletConnectConnection();
  const sessions = useWalletConnectSessions();
  const disconnect = useWalletConnectDisconnect();
  const requests = useWalletConnectRequests();
  const approve = useWalletConnectApproval();
  const reject = useWalletConnectRejection();

  return {
    // Status
    isServiceRunning: status.data?.running || false,
    sessionsCount: status.data?.sessions || 0,
    
    // Actions
    startService: (token: string) => startService.mutate(token),
    connectToDApp: (uri: string, token: string) => connect.mutate({ uri, token }),
    disconnectSession: (topic: string, token: string) => disconnect.mutate({ topic, token }),
    approveRequest: (requestId: string, token: string) => approve.mutate({ requestId, token }),
    rejectRequest: (requestId: string, reason: string, token: string) => 
      reject.mutate({ requestId, reason, token }),
    
    // Data
    sessions: sessions.data || [],
    pendingRequests: requests.data || [],
    
    // Loading states
    isConnecting: connect.isPending,
    isDisconnecting: disconnect.isPending,
    isApproving: approve.isPending,
    isRejecting: reject.isPending,
    
    // Refresh functions
    refreshSessions: () => {
      queryClient.invalidateQueries({ queryKey: ['walletconnect', 'sessions'] });
      return queryClient.refetchQueries({ queryKey: ['walletconnect', 'sessions'] });
    },
    refreshRequests: () => {
      queryClient.invalidateQueries({ queryKey: ['walletconnect', 'requests'] });
      return queryClient.refetchQueries({ queryKey: ['walletconnect', 'requests'] });
    },
  };
}


