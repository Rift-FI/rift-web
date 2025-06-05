import { useQuery } from "@tanstack/react-query";
import { IUserBalance } from "@/v2/pages/token/mock/tokenDetailsMockData";
import {
  IError,
  userBalanceData,
} from "@/v2/pages/token/mock/tokenDetailsMockData";
import Sphere, {
  Environment,
  WalletChain,
  WalletToken,
  ApiResponse,
} from "@stratosphere-network/wallet";
import sphere from "@/lib/sphere";

export const useTokenBalance = (id: string | undefined) => {
  const {
    data: userBalanceDetails,
    isLoading: isLoadingUserBalanceDetails,
    error: errorUserBalanceDetails,
  } = useQuery({
    queryKey: ["userBalanceDetails", id],
    queryFn: () => getUserBalanceDetails(id),
    enabled: !!id,
  });
  return {
    userBalanceDetails,
    isLoadingUserBalanceDetails,
    errorUserBalanceDetails,
  };
};

async function getUserBalanceDetails(
  id: string | undefined
): Promise<IUserBalance | IError> {
  if (!id) {
    return {
      status: "error",
      message:
        "Token ID missing! Token ID is required to fetch user balance details",
    };
  }

  try {
    const userOwnedTokens = await getUserOwnedTokens();
    console.log("userOwnedTokens", userOwnedTokens);
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    return userBalanceData as IUserBalance;
  }

  return userBalanceData as IUserBalance;
}

async function getUserOwnedTokens(): Promise<WalletToken[] | null> {
  if (!sphere.isAuthenticated()) {
    console.error("User must be authenticated to fetch owned tokens");
    return null;
  }

  try {
    const response = await sphere.assets.getUserTokens();

    if (response.data) {
      console.log(`User owns ${response.data.length} different tokens:`);
      response.data.forEach((token) => {
        console.log(`\n  Token: ${token.name}`);
        console.log(`  ID: ${token.id}`);
        console.log(`  Chain: ${token.chain_id}`);
        if (token.contract_address) {
          console.log(`  Contract: ${token.contract_address}`);
        }
      });
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    throw error;
  }
}
