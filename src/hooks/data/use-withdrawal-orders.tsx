import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface OfframpOrder {
  id: string;
  status: string;
  transactionCode: string;
  amount: number;
  createdAt: string;
  receipt_number?: string | null;
  transaction_hash?: string | null;
  currency?: string; // Currency code (KES, ETB, UGX, GHS, etc.)
}

async function getWithdrawalOrders(): Promise<OfframpOrder[]> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    
    rift.setBearerToken(authToken);
    
    const response = await rift.offramp.getOrders();
    const orders = response.orders || [];
    
    // Sort by createdAt date, latest first
    return orders.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Latest first (descending order)
    });
  } catch (error) {
    console.error("Error fetching withdrawal orders:", error);
    throw error;
  }
}

export default function useWithdrawalOrders() {
  const query = useQuery({
    queryKey: ["withdrawal-orders"],
    queryFn: getWithdrawalOrders,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  return query;
}