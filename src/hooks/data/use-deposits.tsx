import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface Deposit {
  id: string;
  userId: string;
  transactionHash: string;
  blockNumber: string;
  blockTimestamp: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  rawAmount: string;
  exchangeRate: number;
  kesAmount: number;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    phoneNumber: string;
  };
}

export interface GetAllDepositsResponse {
  deposits: Deposit[];
}

export const useDeposits = () => {
  const getDeposits = async (): Promise<Deposit[]> => {
    try {
      console.log("🔍 Fetching on-chain deposits...");
      
      // Set auth token
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("No authentication token found");
      }
      rift.setBearerToken(authToken);
      
      console.log("📞 Calling rift.deposits.getAllDeposits()...");
      const response = await (rift as any).deposits.getAllDeposits();
      console.log("📦 Raw deposits response:", response);
      console.log("📦 Response type:", typeof response);
      console.log("📦 Response keys:", Object.keys(response || {}));
      
      // Handle both direct array and nested response
      const deposits = (response as any)?.deposits || response || [];
      console.log("💰 Extracted deposits:", deposits);
      console.log("💰 Deposits type:", typeof deposits);
      console.log("💰 Is deposits array?", Array.isArray(deposits));
      console.log("💰 Deposits length:", deposits?.length);
      
      if (deposits && deposits.length > 0) {
        console.log("💰 First deposit sample:", deposits[0]);
      }
      
      // Ensure we return an array and sort by createdAt (latest first)
      const depositsArray = Array.isArray(deposits) ? deposits : [];
      const sortedDeposits = depositsArray.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Latest first (descending order)
      });
      
      console.log("✅ Final sorted deposits to return:", sortedDeposits);
      return sortedDeposits;
    } catch (error) {
      console.error("❌ Error fetching deposits:", error);
      console.error("❌ Error details:", {
        name: (error as any)?.name,
        message: (error as any)?.message,
        status: (error as any)?.status,
        response: (error as any)?.response
      });
      return [];
    }
  };

  return useQuery({
    queryKey: ["deposits"],
    queryFn: getDeposits,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};