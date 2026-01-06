import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { checkForSuspension, handleSuspension } from "@/utils/api-suspension-handler";

export interface LoyaltyStats {
  userId: string;
  totalPoints: number;
  currentPointValue: number;
  totalValueUsd: number;
  tier: "EARLY_ADOPTER" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  currentStreak: number;
  longestStreak: number;
  transactionCount: number;
  lastActivityDate: string;
  multiplier: number;
}

interface LoyaltyStatsResponse {
  success: boolean;
  data: LoyaltyStats;
}

export default function useLoyaltyStats() {
  return useQuery({
    queryKey: ["loyalty-stats"],
    queryFn: async (): Promise<LoyaltyStats | null> => {
      try {
        const authToken = localStorage.getItem("token");
        const apiKey = import.meta.env.VITE_SDK_API_KEY;
        
        console.log("🏆 [Loyalty] Fetching loyalty stats...");
        console.log("🏆 [Loyalty] Has auth token:", !!authToken);
        console.log("🏆 [Loyalty] Has API key:", !!apiKey);
        
        if (!authToken) {
          console.error("❌ [Loyalty] No authentication token found");
          throw new Error("No authentication token found");
        }

        if (!apiKey) {
          console.error("❌ [Loyalty] No API key found");
          throw new Error("No API key found");
        }

        rift.setBearerToken(authToken);

        const url = "https://payment.riftfi.xyz/api/loyalty/stats";
        console.log("🏆 [Loyalty] Calling API:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
            "x-api-key": apiKey,
          },
        });

        console.log("🏆 [Loyalty] Response status:", response.status);

        if (!response.ok) {
          // Clone response to read it multiple times if needed
          const clonedResponse = response.clone();
          
          try {
            const errorData = await clonedResponse.json();
            
            // Check for account suspension
            const suspensionCheck = checkForSuspension(response.status, errorData);
            if (suspensionCheck.isSuspended) {
              console.log("🚫 [Loyalty] Account suspended, redirecting...");
              handleSuspension();
              return null;
            }
          } catch {
            // If JSON parse fails, continue with text error
          }
          
          const errorText = await response.text();
          console.error("❌ [Loyalty] API error:", response.status, errorText);
          
          // If 404 or other error, user might not have loyalty account yet
          if (response.status === 404) {
            console.log("ℹ️ [Loyalty] User doesn't have loyalty account yet (404)");
            return null;
          }
          throw new Error(`Failed to fetch loyalty stats: ${response.status}`);
        }

        const data: LoyaltyStatsResponse = await response.json();
        console.log("✅ [Loyalty] Stats fetched successfully:", data.data);
        return data.data;
      } catch (error) {
        console.error("❌ [Loyalty] Error fetching loyalty stats:", error);
        // Return null instead of throwing to prevent UI from breaking
        return null;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // 30 seconds
    retry: false, // Don't retry on error to avoid spam
  });
}

