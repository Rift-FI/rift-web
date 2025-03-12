import { QUVAULT_BASEURL, QUVAULT_ENDPOINTS } from "../config";

export type psttoken = {
  symbol: string;
  logo_url: string;
  blockchain: number;
  price: number;
  market_cap: number;
  total_supply: number;
  apy: number;
  margin_percentage: number;
  monthly_sales: number;
  tvl: number;
};

export type tokenoverview = {
  name: string;
  balance: number;
  rate: number;
  period: string;
  apy: number;
  market_cap: number;
  real_name: string;
  symbol: string;
  offering_date: string;
  cost_margin: string;
  icon_url: string;
  address: string;
};

export type swapestimate = {
  price: number;
  total: number;
  trading_fee: number;
  price_impact: number;
};

export const getPstTokens = async (): Promise<{
  data: psttoken[];
}> => {
  let URL = QUVAULT_BASEURL + QUVAULT_ENDPOINTS.tokens;
  let quvaultToken = localStorage.getItem("quvaulttoken");

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${quvaultToken}`,
    },
  });

  return res.json();
};

export const getPstTokenOverview = async (
  tokensymbol: string
): Promise<{
  data: tokenoverview;
}> => {
  let URL =
    QUVAULT_BASEURL +
    QUVAULT_ENDPOINTS.tokens +
    "/" +
    tokensymbol +
    QUVAULT_ENDPOINTS.tokenoverview;
  let quvaultToken = localStorage.getItem("quvaulttoken");

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${quvaultToken}`,
    },
  });

  return res.json();
};

export const getPstTokenBalance = async (
  tokenAddr?: string,
  chain?: number
): Promise<{
  data: string;
}> => {
  let URL =
    QUVAULT_BASEURL +
    QUVAULT_ENDPOINTS.tokenbalance +
    `?token=${
      tokenAddr || "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"
    }&chain=${chain || 137}`;
  let quvaultToken = localStorage.getItem("quvaulttoken");

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${quvaultToken}`,
    },
  });

  return res.json();
};

export const getSwapTokenEstimates = async (
  fromAddress: string,
  toAddress: string,
  amount: number
): Promise<{
  data: swapestimate;
}> => {
  let URL = QUVAULT_BASEURL + QUVAULT_ENDPOINTS.swapestimate;
  let quvaultToken = localStorage.getItem("quvaulttoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${quvaultToken}`,
    },
    body: JSON.stringify({
      tokenFrom: fromAddress,
      tokenTo: toAddress,
      chain: 137,
      amount: amount,
    }),
  });

  return res.json();
};

export const swapPSTTokens = async (
  receiveTokenAddress: string,
  sellAmount: number
): Promise<void> => {
  let URL = QUVAULT_BASEURL + QUVAULT_ENDPOINTS.swappst;
  let quvaultToken = localStorage.getItem("quvaulttoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${quvaultToken}`,
    },
    body: JSON.stringify({
      token: receiveTokenAddress,
      chain: 137,
      amount: sellAmount,
      type: "buy",
    }),
  });

  return res.json();
};
