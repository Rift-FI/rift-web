export interface IHistoricalPrice {
  date: string;
  token: number;
}
export interface IUserBalance {
  balance: number;
  usdBalance: number;
  usdPriceChange: number;
  percentPriceChange: number;
}
export interface ITokenDetails {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  circulatingSupply: number;
  maxSupply: number;
  imageUrl: string;
}
export interface IPerformanceData {
  volume: number;
  trades: number;
  traders: number;
}

export interface IError {
  status: string;
  message: string;
}

export interface ITokenActivity {
  date: string;
  amount: number;
  type: string;
  title: string;
  description: string;
  imageUrl: string;
}

const userBalanceData: IUserBalance = {
  balance: 7.68,
  usdBalance: 7.68,
  usdPriceChange: -7.68,
  percentPriceChange: -7.68,
};

const priceChartData: IHistoricalPrice[] = [
  { date: "2025-03-01", token: 0.33695 },
  { date: "2025-03-02", token: 0.253323 },
  { date: "2025-03-03", token: 0.248683 },
  { date: "2025-03-04", token: 0.23423 },
  { date: "2025-03-05", token: 0.25038 },
  { date: "2025-03-06", token: 0.244133 },
  { date: "2025-03-07", token: 0.242441 },
  { date: "2025-03-08", token: 0.22913 },
  { date: "2025-03-09", token: 0.21485 },
  { date: "2025-03-10", token: 0.202706 },
  { date: "2025-03-11", token: 0.195445 },
  { date: "2025-03-12", token: 0.20009 },
  { date: "2025-03-13", token: 0.193733 },
  { date: "2025-03-14", token: 0.191784 },
  { date: "2025-03-15", token: 0.193294 },
  { date: "2025-03-16", token: 0.188584 },
  { date: "2025-03-17", token: 0.19156 },
  { date: "2025-03-18", token: 0.186186 },
  { date: "2025-03-19", token: 0.191162 },
  { date: "2025-03-20", token: 0.192091 },
  { date: "2025-03-21", token: 0.185899 },
  { date: "2025-03-22", token: 0.1839 },
  { date: "2025-03-23", token: 0.183208 },
  { date: "2025-03-24", token: 0.19141 },
  { date: "2025-03-25", token: 0.195676 },
  { date: "2025-03-26", token: 0.195331 },
  { date: "2025-03-27", token: 0.193091 },
  { date: "2025-03-28", token: 0.1879 },
  { date: "2025-03-29", token: 0.1864 },
  { date: "2025-03-30", token: 0.1823 },
  { date: "2025-03-31", token: 0.1879 },
  { date: "2025-04-01", token: 0.1879 },
  { date: "2025-04-02", token: 0.187 },
  { date: "2025-04-03", token: 0.1807 },
  { date: "2025-04-04", token: 0.1823 },
  { date: "2025-04-05", token: 0.1864 },
  { date: "2025-04-06", token: 0.1907 },
  { date: "2025-04-07", token: 0.1906 },
  { date: "2025-04-08", token: 0.1917 },
  { date: "2025-04-09", token: 0.1924 },
  { date: "2025-04-10", token: 0.1883 },
  { date: "2025-04-11", token: 0.1804 },
  { date: "2025-04-12", token: 0.1816 },
  { date: "2025-04-13", token: 0.1696 },
  { date: "2025-04-14", token: 0.1662 },
  { date: "2025-04-15", token: 0.167 },
  { date: "2025-04-16", token: 0.165 },
  { date: "2025-04-17", token: 0.1605 },
  { date: "2025-04-18", token: 0.1575 },
  { date: "2025-04-19", token: 0.1572 },
  { date: "2025-04-20", token: 0.1654 },
  { date: "2025-04-21", token: 0.1654 },
  { date: "2025-04-22", token: 0.1654 },
  { date: "2025-04-23", token: 0.1775 },
  { date: "2025-04-24", token: 0.1678 },
  { date: "2025-04-25", token: 0.1676 },
  { date: "2025-04-26", token: 0.1685 },
  { date: "2025-04-27", token: 0.146 },
  { date: "2025-04-28", token: 0.146 },
  { date: "2025-04-29", token: 0.1528 },
  { date: "2025-04-30", token: 0.1414 },
  { date: "2025-05-01", token: 0.1626 },
  { date: "2025-05-02", token: 0.1646 },
  { date: "2025-05-03", token: 0.163 },
  { date: "2025-05-04", token: 0.1879 },
  { date: "2025-05-05", token: 0.187 },
  { date: "2025-05-06", token: 0.1807 },
  { date: "2025-05-07", token: 0.1823 },
  { date: "2025-05-08", token: 0.1864 },
  { date: "2025-05-09", token: 0.1907 },
  { date: "2025-05-10", token: 0.1906 },
  { date: "2025-05-11", token: 0.1917 },
  { date: "2025-05-12", token: 0.1924 },
  { date: "2025-05-13", token: 0.1883 },
  { date: "2025-05-14", token: 0.1804 },
  { date: "2025-05-15", token: 0.1816 },
  { date: "2025-05-16", token: 0.1696 },
  { date: "2025-05-17", token: 0.1662 },
  { date: "2025-05-18", token: 0.167 },
  { date: "2025-05-19", token: 0.165 },
  { date: "2025-05-20", token: 0.16284 },
];

const tokenDetailsData: ITokenDetails = {
  name: "Sphere",
  symbol: "SPHERE",
  decimals: 18,
  totalSupply: 1000000000,
  circulatingSupply: 1000000000,
  maxSupply: 1000000000,
  imageUrl: "/src/assets/images/logos/bera.png",
};

const performanceData: IPerformanceData = {
  volume: 1000000000,
  trades: 1000000000,
  traders: 1000000000,
};

const tokenActivityData: ITokenActivity[] = [
  {
    date: "2025-03-01",
    amount: 10,
    type: "buy",
    title: "Wallet Interaction",
    description: "Bought 10 SPHERE tokens",
    imageUrl: "/src/assets/images/logos/bera.png",
  },
  {
    date: "2025-03-02",
    amount: 19,
    type: "sell",
    title: "Wallet Interaction",
    description: "Sold 19 SPHERE tokens",
    imageUrl: "/src/assets/images/logos/bera.png",
  },
];

export {
  userBalanceData,
  priceChartData,
  tokenDetailsData,
  performanceData,
  tokenActivityData,
};
