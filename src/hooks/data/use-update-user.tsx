import { useMutation, useQueryClient } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface UpdateUserRequest {
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
  paymentAccount?: string;
  notificationEmail?: string;
  instantWithdrawals?: boolean;
  [key: string]: any;
}

export interface UpdateUserResponse {
  message: string;
  user: any;
}

async function updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    
    rift.setBearerToken(authToken);
    
    const response = await rift.auth.updateUser(request);
    return response;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export default function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUser,
    onMutate: async (newUserData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["user"] });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(["user"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["user"], (old: any) => ({
        ...old,
        ...newUserData,
        // Handle snake_case conversion for API compatibility
        display_name: newUserData.displayName || old?.display_name,
        payment_account: newUserData.paymentAccount || old?.payment_account,
      }));

      // Return a context object with the snapshotted value
      return { previousUser };
    },
    onError: (err, newUserData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser) {
        queryClient.setQueryData(["user"], context.previousUser);
      }
    },
    onSuccess: (data, variables) => {
      // If the API response includes updated user data, use it
      if (data?.user) {
        queryClient.setQueryData(["user"], data.user);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}