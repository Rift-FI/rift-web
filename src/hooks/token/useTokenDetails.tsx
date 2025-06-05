import {
  IError,
  ITokenDetails,
  tokenDetailsData,
} from "@/v2/pages/token/mock/tokenDetailsMockData";
import { useQuery } from "@tanstack/react-query";
import { WalletToken } from "@stratosphere-network/wallet";
import sphere from "@/lib/sphere";

// async function getUserOwnedTokens(): Promise<WalletToken[] | null> {
//   try {
//     const response = await sphere.assets.getUserTokens();

//     if (response.data) {
//       console.log(`User owns ${response.data.length} different tokens:`);
//       response.data.forEach((token) => {
//         console.log(`\n  Token: ${token.name}`);
//         console.log(`  ID: ${token.id}`);
//         console.log(`  Chain: ${token.chain_id}`);
//         if (token.contract_address) {
//           console.log(`  Contract: ${token.contract_address}`);
//         }
//       });
//       return response.data;
//     }
//     return null;
//   } catch (error) {
//     throw error;
//   }
// }

export const useTokenDetails = (id: string | undefined) => {
  const {
    data: tokenDetails,
    isLoading: isLoadingTokenDetails,
    error: errorTokenDetails,
  } = useQuery({
    queryKey: ["tokenDetails", id],
    queryFn: () => getTokenDetails(id),
    enabled: !!id,
  });

  return { tokenDetails, isLoadingTokenDetails, errorTokenDetails };
};

async function getTokenDetails(
  id: string | undefined
): Promise<ITokenDetails | IError> {
  if (!id) {
    return {
      status: "error",
      message: "Token ID is required",
    };
  }
  return tokenDetailsData;
}
