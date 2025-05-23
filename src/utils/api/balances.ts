import { BASEURL, ENDPOINTS } from "./config";

export type walletBalTtype = {
  balance: string;
  btcBalance: number;
};

export type usdtBalTYpe = {
  message: string;
  data: {
    email: string;
    address: string;
    balance: string;
  };
};

export type liskbalType = {
  email: string;
  address: string;
  balances: {
    LSK: string;
    USDC: string;
    USDT: string;
  };
};

export type basebalType = {
  email: string;
  address: string;
  balances: {
    ETH: string;
    USDC: string;
    USDT: string;
  };
};

export type bnbbalType = {
  email: string;
  address: string;
  balances: {
    BNB: string;
    USDC: string;
    USDT: string;
  };
};

export type arbitrumbalType = {
  email: string;
  address: string;
  balances: {
    ETH: string;
    USDC: string;
    USDT: string;
  };
};

export type supportedchains =
  | "ARBITRUM"
  | "BASE"
  | "OPTIMISM"
  | "ETHEREUM"
  | "LISK"
  | "BNB"
  | "BERACHAIN"
  | "POLYGON";

export type supportedtokens =
  | "ETH"
  | "WETH"
  | "USDC"
  | "USDT"
  | "DAI"
  | "WSTETH"
  | "RETH"
  | "WBTC"
  | "ARB"
  | "CBETH"
  | "CBBTC"
  | "TBTC"
  | "OP"
  | "LSK"
  | "BNB"
  | "BERA"
  | "WBERA"
  | "USDC.e"
  | "MATIC";

export type tokencategories =
  | "stablecoin"
  | "native"
  | "native-wrapped"
  | "btc-derivative"
  | "staked-eth"
  | "governance";

export type balanceType = {
  chain: supportedchains;
  chainId: number;
  symbol: supportedtokens;
  address: string | null;
  decimals: number;
  type: string;
  category: tokencategories;
  balance: string;
};

export const getAllBalances = async (): Promise<{
  data: {
    arbitrum: balanceType[];
    base: balanceType[];
    optimism: balanceType[];
    ethereum: balanceType[];
    lisk: balanceType[];
    bnb: balanceType[];
    berachain: balanceType[];
    polygon: balanceType[];
  };
}> => {
  const URL = BASEURL + ENDPOINTS.allbalances;
  let token: string | null = localStorage.getItem("spheretoken");

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res?.json();
};

export const getEthBalance = async (): Promise<walletBalTtype> => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.balance;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res?.json();
};

export const getPolygonUsdBalance = async (): Promise<usdtBalTYpe> => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.usdtbalance;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.json();
};

export const getBeraUsdcBalance = async (): Promise<usdtBalTYpe> => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.wusdcbalance;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.json();
};

export const getBeraBalance = async (): Promise<usdtBalTYpe> => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.wberaBalance;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.json();
};

export const getLiskBalances = async (): Promise<liskbalType> => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.liskbalances;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const res_data = await res?.json();

  return res_data?.data;
};

export const getBaseBalances = async (): Promise<basebalType> => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.basebalances;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const res_data = await res?.json();

  return res_data?.data;
};

export const getBnbBalances = async (): Promise<bnbbalType> => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.bnbbalances;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const res_data = await res?.json();

  return res_data?.data;
};

export const getArbitrumBalances = async (): Promise<arbitrumbalType> => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.arbitrumbalances;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const res_data = await res?.json();

  return res_data?.data;
};
