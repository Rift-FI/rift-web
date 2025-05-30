import {
  IError,
  ITokenActivity,
  tokenActivityData,
} from "@/v2/pages/token/mock/tokenDetailsMockData";
import { useQuery } from "@tanstack/react-query";

export const useTokenActivity = (tokenID: string | undefined) => {
  const {
    data: tokenActivity,
    isLoading: isLoadingTokenActivity,
    error: errorTokenActivity,
  } = useQuery({
    queryKey: ["tokenActivity", tokenID],
    queryFn: () => getTokenActivity(tokenID),
    enabled: !!tokenID,
  });

  return { tokenActivity, isLoadingTokenActivity, errorTokenActivity };
};

async function getTokenActivity(
  tokenID: string | undefined
): Promise<ITokenActivity[] | IError> {
  if (!tokenID) {
    return {
      status: "error",
      message: "Token ID is required to fetch token activity",
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return tokenActivityData;
}
