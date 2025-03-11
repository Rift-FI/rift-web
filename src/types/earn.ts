import { Time } from "lightweight-charts";

// stake products
export type stakeproducttype = {
  id: string;
  name: string;
  apy: string;
  currentTvl: string;
  maxCapacity: string;
  network: string;
};

// yield tokens
export type yieldtokentype = {
  name: string;
  apy: number;
  hasMonthlyDividend: boolean;
  minDeposit: number | null;
  minLockPeriod: number | null;
};

// coins (coin gecko)
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

export type cgOHLCType = [number, number, number, number, number][]; // Open, High, Low, Close - market values

export type coinPriceType = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};
