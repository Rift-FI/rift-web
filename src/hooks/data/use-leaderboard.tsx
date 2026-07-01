import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { getApiBase } from "@/lib/apiBase";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  totalPoints: number;
  totalVolume: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
}

interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
  };
}

export default function useLeaderboard(limit: number = 100) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      try {
        const apiKey = import.meta.env.VITE_SDK_API_KEY;
        
        
        
        if (!apiKey) {
          
          return [];
        }

        const url = `${getApiBase()}/api/loyalty/leaderboard?limit=${limit}`;
        

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });

        

        if (!response.ok) {
          const errorText = await response.text();
          
          return [];
        }

        const data: LeaderboardResponse = await response.json();
        
        return data.data.leaderboard;
      } catch (error) {
        
        return [];
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

