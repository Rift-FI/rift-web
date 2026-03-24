import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { handleSuspension } from "@/utils/api-suspension-handler";

export interface OnrampOrder {
  status: string;
  transactionCode: string;
  createdAt: string;
  receipt_number?: string | null;
  transaction_hash?: string | null;
  amount?: string | null;
  currency?: string;
  chain?: string | null;
  token?: string | null;
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
        
        const user = (userResponse as any).user;
        const userId = user?.id || user?.externalId;
        
        if (!userId) {
          throw new Error("User ID not found");
        }

        const response = await rift.onrampV2.getOnrampOrders(userId);
        
        // Extract orders array from the response
        const orders = (response as any)?.orders || [];
        
        // Sort orders by createdAt date (latest first)
        const sortedOrders = orders.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // Latest first (descending order)
        });
        let ordersWithReceipt = sortedOrders.filter((order: any) => order?.receipt_number);
        
        return ordersWithReceipt;
      } catch (error: any) {
        // Check for account suspension
        if (
          error?.response?.status === 403 ||
          error?.status === 403 ||
          error?.message?.includes("Account suspended")
        ) {
          const errorData = error?.response?.data || error?.data || {};
          if (errorData?.message === "Account suspended") {
            handleSuspension();
          }
        }
        
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}
