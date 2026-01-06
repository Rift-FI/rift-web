import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { handleSuspension } from "@/utils/api-suspension-handler";

export interface User {
  id?: string;
  externalId?: string;
  referrer?: string;
  createdAt?: string;
  updatedAt?: string;
  email?: string;
  telegramId?: string;
  phoneNumber?: string;
  address?: string;
  displayName?: string;
  display_name?: string; // API returns snake_case
  paymentAccount?: string;
  payment_account?: string; // API returns snake_case
  notificationEmail?: string;
  instantWithdrawals?: boolean;
  projectId?: string;
  password?: string;
  [key: string]: any;
}

async function fetchUser(): Promise<User> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    
    rift.setBearerToken(authToken);
    
    const response = await rift.auth.getUser();
    return response;
  } catch (error: any) {
    console.error("Error fetching user:", error);
    
    // Check for account suspension in error response
    if (
      error?.response?.status === 403 ||
      error?.status === 403 ||
      error?.message?.includes("Account suspended")
    ) {
      const errorData = error?.response?.data || error?.data || {};
      if (errorData?.message === "Account suspended") {
        console.log("🚫 [User] Account suspended, redirecting...");
        handleSuspension();
      }
    }
    
    throw error;
  }
}

export default function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}