import { priceChartData } from "@/v2/pages/token/mock/tokenDetailsMockData";
import { useQuery } from "@tanstack/react-query";
import { IHistoricalPrice } from "@/v2/pages/token/mock/tokenDetailsMockData";

export const useTokenHistoricalData = (id: string) => {
  const {
    data: historicalData,
    isLoading: isLoadingHistoricalData,
    error: errorHistoricalData,
  } = useQuery({
    queryKey: ["historicalData", id],
    queryFn: () => getHistoricalData(id),
  });
  return {
    historicalData,
    isLoadingHistoricalData,
    errorHistoricalData,
  };
};

async function getHistoricalData(
  id: string
): Promise<IHistoricalPrice[] | undefined> {
  if (!id) {
    throw new Error(
      "Token ID missing! Token ID is required to fetch historical data"
    );
  }
  //TODO: Implement the logic to fetch the historical data from the backend
  return priceChartData;
}
