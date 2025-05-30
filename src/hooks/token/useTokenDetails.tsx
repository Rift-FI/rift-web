import {
  IError,
  ITokenDetails,
  tokenDetailsData,
} from "@/v2/pages/token/mock/tokenDetailsMockData";
import { useQuery } from "@tanstack/react-query";

const HISTORICAL_URL = "http://localhost:5173/token";

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
  // const { data: performanceData } = useQuery({
  //   queryKey: ["performance", id],
  //   queryFn: () => getPerformanceData(id),
  // });

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
  const response = await fetch(`${HISTORICAL_URL}/details/${id}`);
  console.log(response);
  return tokenDetailsData;
}

// async function getPerformanceData(id: string): Promise<IPerformanceData> {
//   const response = await fetch(`${HISTORICAL_URL}/performance/${id}`);
//   console.log(response);
//   return {
//     volume: 1000000000,
//     trades: 1000000000,
//     traders: 1000000000,
//   };
// }
