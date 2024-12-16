export type coinType = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
};

export type coinInfoType = {
  id: string;
  symbol: string;
  name: string;
  categories: string[];
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    whitepaper: string;
    official_forum_url: string[];
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  genesis_date: string;
  market_cap_rank: number;
  market_data: {
    current_price: {
      usd: number;
    };
    price_change_percentage_24h: number;
    total_supply: number;
    max_supply: number;
    circulating_supply: number;
    market_cap: {
      usd: number;
    };
  };
};

export const fetchCoins = async (): Promise<{
  coins: coinType[];
  isOk: boolean;
}> => {
  const URL =
    "https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&x_cg_pro_api_key=CG-Whw1meTdSTTT7CSpGZbaB3Yi";

  const res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });
  let coins: coinType[] = await res.json();

  return { coins, isOk: res.ok };
};

export const fetchCoinInfo = async (
  coinId: string
): Promise<{ coinInfo: coinInfoType; isOK: boolean }> => {
  const URL = `https://pro-api.coingecko.com/api/v3/coins/${coinId}?&x_cg_pro_api_key=CG-Whw1meTdSTTT7CSpGZbaB3Yi`;

  const res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });
  const coinInfo: coinInfoType = await res.json();

  return { coinInfo, isOK: res.ok };
};
