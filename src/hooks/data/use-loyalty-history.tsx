import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { getApiBase } from "@/lib/apiBase";

export interface LoyaltyActivity {
  id: string;
  type: "OFFRAMP" | "ONRAMP" | "PAYMENT" | "BLOCKCHAIN_TXN" | "AIRTIME";
  pointsEarned: number;
  transactionValue: number;
  transactionId: string;
  createdAt: string;
  metadata: {
    currency?: string;
    isUtility?: boolean;
    chain?: string;
    token?: string;
  };
}

interface LoyaltyHistoryResponse {
  success: boolean;
  data: {
    activities: LoyaltyActivity[];
  };
}

export default function useLoyaltyHistory() {
  return useQuery({
    queryKey: ["loyalty-history"],
    queryFn: async (): Promise<LoyaltyActivity[]> => {
      try {
        const authToken = localStorage.getItem("token");
        const apiKey = import.meta.env.VITE_SDK_API_KEY;
        
        if (!authToken || !apiKey) {
          return [];
        }

        rift.setBearerToken(authToken);

        const url = `${getApiBase()}/api/loyalty/history`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
            "x-api-key": apiKey,
          },
        });

        if (!response.ok) {
          return [];
        }

        const data: LoyaltyHistoryResponse = await response.json();
        return data.data.activities;
      } catch {
        return [];
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // 30 seconds
    retry: false,
  });
}
