import { useQuery } from "@tanstack/react-query";

// --- Types ---

export type PoolStatus = "ACTIVE" | "DRAWING" | null;

export interface WeeklyPoolUser {
  transactionVolume: number;
  referralCount: number;
  multiplier: number;
  effectiveVolume: number;
  qualificationThreshold: number;
  progressPercent: number;
  isQualified: boolean;
  rank: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  effectiveVolume: number;
  isQualified: boolean;
  isCurrentUser: boolean;
}

export interface PastWinner {
  weekLabel: string;
  displayName: string;
  prizeAmount: number;
}

export interface WeeklyPoolData {
  status: PoolStatus;
  prizeAmount: number;
  weekStart: string | null;
  weekEnd: string | null;
  totalParticipants: number;
  qualifiedParticipants: number;
  qualificationThreshold: number;
  user: WeeklyPoolUser | null;
  leaderboard: LeaderboardEntry[];
  pastWinners: PastWinner[];
}

export interface ReferralInfo {
  referralCode: string;
  totalReferred: number;
  activeReferrals: number;
  combinedVolume: number;
  multiplierActive: boolean;
  multiplier: number;
  volumeThreshold: number;
  referrals: { displayName: string; joinedAt: string }[];
}

// --- Countdown helper ---

export function getCountdownToSunday() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  const nextSunday = new Date(now);
  nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
  nextSunday.setUTCHours(23, 59, 59, 999);

  const diff = Math.max(0, nextSunday.getTime() - now.getTime());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

// --- API helpers ---

import { getApiBase } from "@/lib/apiBase";
const WEEKLY_POOL_BASE = `${getApiBase()}/api/weekly-pool`;

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

export default function useWeeklyPool() {
  return useQuery({
    queryKey: ["weekly-pool"],
    queryFn: async (): Promise<WeeklyPoolData> => {
      const res = await fetch(WEEKLY_POOL_BASE, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch weekly pool");
      return res.json();
    },
    staleTime: 1000 * 30,
    retry: false,
  });
}

export function useWeeklyPoolHistory(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["weekly-pool-history", page, limit],
    queryFn: async () => {
      const res = await fetch(
        `${WEEKLY_POOL_BASE}/history?page=${page}&limit=${limit}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) throw new Error("Failed to fetch pool history");
      return res.json() as Promise<{
        pools: {
          id: string;
          weekLabel: string;
          prizeAmount: number;
          winnerDisplayName: string;
          totalParticipants: number;
          qualifiedParticipants: number;
        }[];
        pagination: { page: number; limit: number; total: number };
      }>;
    },
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useReferralInfo() {
  return useQuery({
    queryKey: ["weekly-pool-referral"],
    queryFn: async (): Promise<ReferralInfo> => {
      const res = await fetch(`${WEEKLY_POOL_BASE}/referral`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch referral info");
      return res.json();
    },
    staleTime: 1000 * 60,
    retry: false,
  });
}
