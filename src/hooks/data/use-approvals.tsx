import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveApproval,
  getApproval,
  listPendingApprovals,
  rejectApproval,
} from "@/lib/passkeyWallet";

export const PENDING_APPROVALS_KEY = ["approvals", "pending"] as const;

/** In-app inbox of approval requests created by partners / API / automations. */
export function usePendingApprovals(enabled = true) {
  return useQuery({
    queryKey: PENDING_APPROVALS_KEY,
    queryFn: () => listPendingApprovals().catch(() => []),
    enabled: enabled && !!localStorage.getItem("token"),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useApproval(id: string | undefined) {
  return useQuery({
    queryKey: ["approvals", id],
    queryFn: () => getApproval(id!),
    enabled: !!id && !!localStorage.getItem("token"),
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useApprovalActions(id: string | undefined) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["approvals"] });
  };
  const approve = useMutation({
    mutationFn: () => approveApproval(id!),
    onSettled: refresh,
  });
  const reject = useMutation({
    mutationFn: () => rejectApproval(id!),
    onSettled: refresh,
  });
  return { approve, reject };
}
