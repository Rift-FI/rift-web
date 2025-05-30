import { useQuery } from "@tanstack/react-query";
import { IUserBalance } from "@/v2/pages/token/mock/tokenDetailsMockData";
import {
  IError,
  userBalanceData,
} from "@/v2/pages/token/mock/tokenDetailsMockData";

// const TOKEN_BALANCE_URL = import.meta.env.VITE_TOKEN_BALANCE_URL;

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
  //TODO: Implement the logic to fetch the user balance details from the backend

  return userBalanceData as IUserBalance;
}
