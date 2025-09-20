import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface Invoice {
  id: string;
  description: string;
  chain: string;
  token: string;
  amount: number;
  recipientEmail?: string;
  recipientPhone?: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED";
  url: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  expiresAt?: string;
  userId: string;
}

export interface GetInvoicesRequest {
  status?: "PENDING" | "COMPLETED" | "EXPIRED" | any;
  sortBy?: "createdAt" | "updatedAt" | "paidAt";
  sortOrder?: "asc" | "desc";
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

async function getInvoices(request?: GetInvoicesRequest): Promise<Invoice[]> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    
    rift.setBearerToken(authToken);
    
    const response = await rift.merchant.getInvoices(request);
    // API returns invoices directly as an array, not wrapped in an object
    return Array.isArray(response) ? response : (response.invoices || []);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
}

export default function useInvoices(request?: GetInvoicesRequest) {
  const query = useQuery({
    queryKey: ["invoices", request],
    queryFn: () => getInvoices(request),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  return query;
}