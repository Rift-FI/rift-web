import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface OnchainTransaction {
  id: string;
  transactionHash: string;
  type: "send" | "receive";
  amount: number;
  token: string;
  chain: string;
  recipientAddress: string;
  createdAt: string;
  userId: string;
  currency?: string | null;
}

async function getOnchainHistory(): Promise<OnchainTransaction[]> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    
    rift.setBearerToken(authToken);
    
    const response = await rift.transactions.getHistory({});
    const transactions = (response as any).transactions || response || [];
    
    // Get current user's address to determine send vs receive
    const userAddress = localStorage.getItem("address");
    
    // Transform and determine transaction type
    const transformedTransactions = transactions.map((tx: any) => {
      // Determine if it's a send or receive based on recipient address
      // If recipient is a phone number (like "0797168636"), it's likely a send to M-Pesa
      // If recipient is the user's address, it's a receive
      // Otherwise, it's a send to another address
      const isPhoneNumber = /^\d+$/.test(tx.recipientAddress);
      const isToUserAddress = tx.recipientAddress?.toLowerCase() === userAddress?.toLowerCase();
      
      let type: "send" | "receive" = "send"; // Default to send
      if (isToUserAddress) {
        type = "receive";
      }
      
      return {
        id: tx.id,
        transactionHash: tx.transactionHash,
        type,
        amount: tx.amount,
        token: tx.token,
        chain: tx.chain,
        recipientAddress: tx.recipientAddress,
        createdAt: tx.createdAt,
        userId: tx.userId,
        currency: tx.currency,
      };
    });
    
    // Sort by createdAt, latest first
    return transformedTransactions.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Latest first (descending order)
    });
  } catch (error) {
    console.error("Error fetching onchain history:", error);
    throw error;
  }
}

export default function useOnchainHistory() {
  const query = useQuery({
    queryKey: ["onchain-history"],
    queryFn: getOnchainHistory,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  return query;
}