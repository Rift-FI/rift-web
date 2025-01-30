import { BASEURL, ENDPOINTS } from "./config";

export type walletBalTtype = {
  message: string;
  balance: string;
  btcBalance: number;
};

export type usdtBalTYpe = {
  message: string;
  data: {
    balance: string;
  };
};

export type authoriseSpendType = {
  message: string;
  token: string;
};

// HTTP - Create wallet
// io events - AccountCreationSuccess, AccountCreationFailed
export const createEVMWallet = async (
  email: string,
  password: string
): Promise<{ createWalletSuccess: boolean }> => {
  let URL = BASEURL + ENDPOINTS.createwallet;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
  });

  if (res.status == 200) return { createWalletSuccess: true };
  else return { createWalletSuccess: false };
};

// HTTP - Get eth wallet balance
export const walletBalance = async (
  accessToken: string
): Promise<walletBalTtype> => {
  let URL = BASEURL + ENDPOINTS.balance;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  let data: walletBalTtype = await res.json();

  return {
    message: data?.message,
    balance: data?.balance,
    btcBalance: data?.btcBalance,
  };
};

export const mantraBalance = async (
  accessToken: string
): Promise<usdtBalTYpe> => {
  let URL = BASEURL + ENDPOINTS.usdtbalance;

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  let data: usdtBalTYpe = await res.json();

  return {
    message: data?.message,
    data: data?.data,
  };
};

// HTTP - Spend / Send eth from wallet to another address
// io events - TXSent, TXConfirmed
export const sendEth = async (
  accessToken: string,
  toAddr: string,
  ethValStr: string
): Promise<{ spendSuccess: boolean }> => {
  let URL = BASEURL + ENDPOINTS.spend;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: ethValStr }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status == 200) return { spendSuccess: true };
  else return { spendSuccess: false };
};

export const sendUSDT = async (
  accessToken: string,
  toAddr: string,
  usdtValStr: string
): Promise<{ spendSuccess: boolean }> => {
  let URL = BASEURL + ENDPOINTS.sendusdt;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: usdtValStr }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status == 200) return { spendSuccess: true };
  else return { spendSuccess: false };
};

export const sendBTC = async (
  accessToken: string,
  toAddr: string,
  btcValStr: string
): Promise<{ spendSuccess: boolean }> => {
  let URL = BASEURL + ENDPOINTS.sendbtc;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: btcValStr }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status == 200) return { spendSuccess: true };
  else return { spendSuccess: false };
};

// HTTP - Get an access token to authorise spend on behalf
export const shareWalletAccess = async (
  accessToken: string,
  timeValidFor: string,

  accessAmount: string
): Promise<authoriseSpendType> => {
  let URL = BASEURL + ENDPOINTS.sharewallet;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ time: timeValidFor, value: accessAmount }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  let data: authoriseSpendType = await res.json();

  return { message: data?.message, token: data?.token };
};

// HTTP - Foreign send or spend on behalf using access token
// io events - TXSent, TXConfirmed
export const spendOnBehalf = async (
  accessToken: string,
  to: string,
  id: string
): Promise<{ spendOnBehalfSuccess: boolean; status: number }> => {
  let URL = BASEURL + ENDPOINTS.spendwithtoken + `?id=${id}`;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status == 200) {
    return { spendOnBehalfSuccess: true, status: res?.status };
  } else {
    return { spendOnBehalfSuccess: true, status: res?.status };
  }
};
