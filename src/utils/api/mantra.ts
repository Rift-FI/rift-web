type mantraUSD = {
  [key: string]: {
    usd: number;
  };
};

export const getMantraUsdVal = async (): Promise<number> => {
  const APIURL =
    "https://pro-api.coingecko.com/api/v3/simple/price?ids=mantra-dao&vs_currencies=usd";

  let res: Response = await fetch(APIURL, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-pro-api-key": "CG-Whw1meTdSTTT7CSpGZbaB3Yi",
    },
  });

  let data: mantraUSD = await res.json();

  return data["mantra-dao"]?.usd;
};

export const getBerachainUsdVal = async (): Promise<number> => {
  const APIURL =
    "https://pro-api.coingecko.com/api/v3/simple/price?ids=berachain-bera&vs_currencies=usd";

  let res: Response = await fetch(APIURL, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-pro-api-key": "CG-Whw1meTdSTTT7CSpGZbaB3Yi",
    },
  });

  let data: mantraUSD = await res.json();

  return data["berachain-bera"]?.usd;
};

// Added type for the exchange rate API response
export type ExchangeRateInfo = {
  status: string;
  data: {
    currentRate: string;
    initialRate: string;
    minRateConfigured: string;
    minRateDirect: string;
  };
};

// Added function to fetch SPHR/WBERA exchange rate
export const getSphrWberaRate = async (): Promise<ExchangeRateInfo | null> => {
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

    const data: ExchangeRateInfo = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null; // Or throw an error
  }
};
