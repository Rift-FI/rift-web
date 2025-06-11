import { CandlestickData, Time } from "lightweight-charts";

export type coinPriceType = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type cgOHLCType = [number, number, number, number, number][]; // Open, High, Low, Close - market values

type tokenInfoType = {
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
    price_change_24h_in_currency: {
      usd: number;
    };
    total_supply: number;
    max_supply: number;
    circulating_supply: number;
    market_cap: {
      usd: number;
    };
  };
};

/**
 *
 * Fetch coin details
 * @param coinId
 * @returns tokenInfoType
 */
export const fetchCoinInfo = async (coinId: string): Promise<tokenInfoType> => {
  const URL = `https://pro-api.coingecko.com/api/v3/coins/${coinId}?&x_cg_pro_api_key=CG-Whw1meTdSTTT7CSpGZbaB3Yi`;

  const res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  return res.json();
};

/**
 *
 * Fetch historical price data for a coin (1 day, 7 days, 30 days) for use in a candlestick chart
 * @param coinId
 * @param daysRange
 * @returns CandlestickData[]
 */
export const fetchCoinPrices = async (
  coinId: string,
  daysRange: number
): Promise<CandlestickData[]> => {
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

  return chartData;
};
