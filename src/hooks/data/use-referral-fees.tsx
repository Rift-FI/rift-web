import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- Types ---

export interface CurrencyBreakdown {
  currency: string;
  amount: number;
  amountUsd: number;
}

export interface ReferralFeeBalance {
  totalUsd: number;
  currencyBreakdown: CurrencyBreakdown[];
  entryCount: number;
  canClaim: boolean;
  nextClaimDate: string | null;
}

export interface ReferralFeeEntry {
  id: string;
  amountLocal: number;
  currency: string;
  transactorUserId: string;
  orderId: string;
  createdAt: string;
}

export interface ReferralFeeEntriesResponse {
  totalUsd: number;
  currencyBreakdown: CurrencyBreakdown[];
  entries: ReferralFeeEntry[];
}

export interface ReferralFeeClaim {
  id: string;
  amountUsd: number;
  transactionHash: string | null;
  status: "COMPLETED" | "PENDING" | "FAILED";
  createdAt: string;
  completedAt: string | null;
}

// --- API helpers ---

import { getApiBase } from "@/lib/apiBase";
const BASE_URL = `${getApiBase()}/api/referral-fees`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const apiKey = import.meta.env.VITE_SDK_API_KEY;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-api-key": apiKey,
  };
}

// --- Hooks ---

export function useReferralFeeBalance() {
  return useQuery({
    queryKey: ["referral-fee-balance"],
    queryFn: async (): Promise<ReferralFeeBalance> => {
      const res = await fetch(`${BASE_URL}/balance`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    staleTime: 1000 * 30,
    retry: false,
  });
}

export function useReferralFeeEntries() {
  return useQuery({
    queryKey: ["referral-fee-entries"],
    queryFn: async (): Promise<ReferralFeeEntriesResponse> => {
      const res = await fetch(`${BASE_URL}/entries`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch entries");
      return res.json();
    },
    staleTime: 1000 * 30,
    retry: false,
  });
}

export function useClaimReferralFees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ReferralFeeClaim> => {
      const res = await fetch(`${BASE_URL}/claim`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Claim failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-fee-balance"] });
      queryClient.invalidateQueries({ queryKey: ["referral-fee-entries"] });
      queryClient.invalidateQueries({ queryKey: ["referral-fee-claims"] });
    },
  });
}

export function useReferralFeeClaims() {
  return useQuery({
    queryKey: ["referral-fee-claims"],
    queryFn: async (): Promise<{ claims: ReferralFeeClaim[] }> => {
      const res = await fetch(`${BASE_URL}/claims`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
    staleTime: 1000 * 60,
    retry: false,
  });
}
