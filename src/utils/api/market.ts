import { CandlestickData, Time } from "lightweight-charts";

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

export type cgOHLCType = [number, number, number, number, number][];
export type coinPriceType = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
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

  let marketCoins: coinType[] = await res.json();
  let coins: coinType[] = marketCoins.filter(
    (_coin) =>
      _coin.symbol == "btc" ||
      _coin.symbol == "eth" ||
      _coin.symbol == "om" ||
      _coin.symbol == "usdc"
  );

  return { coins: coins, isOk: res.ok };
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

export const fetchCoinPrices = async (
  coinId: string,
  daysRange: number
): Promise<{ prices: CandlestickData[]; isOk: boolean }> => {
  const URL = `https://pro-api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${daysRange}`;

  const res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-pro-api-key": "CG-Whw1meTdSTTT7CSpGZbaB3Yi",
    },
  });

  const data: cgOHLCType = await res.json();

  const chartData: CandlestickData[] = data?.map(
    ([timestamp, open, high, low, close]) => ({
      time: timestamp as Time,
      open,
      high,
      low,
      close,
    })
  );

  return { prices: chartData, isOk: res.ok };
};

// new Date(d.time).valueOf() / 1000
