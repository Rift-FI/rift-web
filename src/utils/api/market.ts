import { CandlestickData, Time } from "lightweight-charts";
import { coinType, coinInfoType, cgOHLCType } from "../../types/earn";

export const fetchCoins = async (): Promise<coinType[]> => {
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

  return coins;
};

export const fetchCoinInfo = async (coinId: string): Promise<coinInfoType> => {
  const URL = `https://pro-api.coingecko.com/api/v3/coins/${coinId}?&x_cg_pro_api_key=CG-Whw1meTdSTTT7CSpGZbaB3Yi`;

  const res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  return res.json();
};

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
