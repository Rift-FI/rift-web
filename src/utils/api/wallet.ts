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
export const createEVMWallet = async (tgUsername: string) => {
  let URL = BASEURL + ENDPOINTS.createwallet;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ email: tgUsername, password: tgUsername }),
    headers: { "Content-Type": "application/json" },
  });
};

// HTTP - Get eth wallet balance
export const walletBalance = async (): Promise<walletBalTtype> => {
  let token: string | null = localStorage.getItem("token");

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

export const mantraBalance = async (): Promise<usdtBalTYpe> => {
  let token: string | null = localStorage.getItem("token");

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

// HTTP - Spend / Send eth from wallet to another address
// io events - TXSent, TXConfirmed
export const sendEth = async (toAddr: string, ethValStr: string) => {
  let token: string | null = localStorage.getItem("token");

  let URL = BASEURL + ENDPOINTS.spend;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: ethValStr }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const sendUSDT = async (toAddr: string, usdtValStr: string) => {
  let token: string | null = localStorage.getItem("token");

  let URL = BASEURL + ENDPOINTS.sendusdt;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: usdtValStr }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const sendBTC = async (toAddr: string, btcValStr: string) => {
  let token: string | null = localStorage.getItem("token");

  let URL = BASEURL + ENDPOINTS.sendbtc;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: btcValStr }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// HTTP - Get an access token to authorise spend on behalf
export const shareWalletAccess = async (
  timeValidFor: string,
  accessAmount: string
): Promise<authoriseSpendType> => {
  let token: string | null = localStorage.getItem("token");

  let URL = BASEURL + ENDPOINTS.sharewallet;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ time: timeValidFor, value: accessAmount }),
    headers: {
      Authorization: `Bearer ${token}`,
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
