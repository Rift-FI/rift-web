export type exchangeRate = {
  status: string;
  data: {
    currentRate: string;
    initialRate: string;
    minRateConfigured: string;
    minRateDirect: string;
  };
};

// Added function to fetch SPHR/WBERA exchange rate
export const getSphrUsdcRate = async (): Promise<exchangeRate | null> => {
  const APIURL =
    "https://rewardsvault-production.up.railway.app/api/exchange/rate-info";

  try {
    const res: Response = await fetch(APIURL, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch exchange rate:", res.statusText);
      return null; // Or throw an error
    }

    const data: exchangeRate = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null; // Or throw an error
  }
};
