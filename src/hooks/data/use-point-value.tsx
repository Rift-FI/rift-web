import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { getApiBase } from "@/lib/apiBase";

export interface PointValue {
  pointValue: number;
  totalSupply: number;
  budget: number;
  commitment: number;
  remaining: number;
}

interface PointValueResponse {
  success: boolean;
  data: PointValue;
}

export default function usePointValue() {
  return useQuery({
    queryKey: ["point-value"],
    queryFn: async (): Promise<PointValue | null> => {
      try {
        const authToken = localStorage.getItem("token");
        const apiKey = import.meta.env.VITE_SDK_API_KEY;
        
        
        
        if (!apiKey) {
          
          return null;
        }

        // This is a public endpoint, but we still set token if available
        if (authToken) {
          rift.setBearerToken(authToken);
        }

        const url = `${getApiBase()}/api/loyalty/point-value`;
        

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });

        

        if (!response.ok) {
          const errorText = await response.text();
          
          return null;
        }

        const data: PointValueResponse = await response.json();
        
        return data.data;
      } catch (error) {
        
        return null;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes (this doesn't change often)
    retry: false,
  });
}

