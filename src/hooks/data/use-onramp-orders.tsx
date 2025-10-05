import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface OnrampOrder {
  status: string;
  transactionCode: string;
  createdAt: string;
  receipt_number?: string | null;
  transaction_hash?: string | null;
  amount?: string | null;
}

export default function useOnrampOrders() {
  return useQuery({
    queryKey: ["onramp-orders"],
    queryFn: async (): Promise<OnrampOrder[]> => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) {
          throw new Error("No authentication token found");
        }

        rift.setBearerToken(authToken);
        
        // Get user info to get userId
        const userResponse = await rift.auth.getUser();
        console.log("🔍 User response:", userResponse);
        console.log("🔍 User object:", (userResponse as any).user);
        
        const user = (userResponse as any).user;
        const userId = user?.id || user?.externalId;
        console.log("🆔 Extracted userId:", userId);
        
        if (!userId) {
          console.error("❌ User ID not found. Full response:", userResponse);
          throw new Error("User ID not found");
        }

        console.log("📞 Calling rift.onrampV2.getOnrampOrders with userId:", userId);
        const response = await rift.onrampV2.getOnrampOrders(userId);
        console.log("📦 Onramp orders response:", response);
        
        // Extract orders array from the response
        const orders = (response as any)?.orders || [];
        console.log("📦 Extracted orders:", orders);
        console.log("📦 Orders count:", orders.length);
        
        // Sort orders by createdAt date (latest first)
        const sortedOrders = orders.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // Latest first (descending order)
        });
        let ordersWithReceipt = sortedOrders.filter((order: any) => order?.receipt_number);
        
        console.log("📦 Sorted orders (latest first):", sortedOrders);
        return ordersWithReceipt;
      } catch (error: any) {
        console.error("Error fetching onramp orders:", error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}