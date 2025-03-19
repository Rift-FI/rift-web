import { BASEURL, ENDPOINTS } from "./config";

export type walletBalTtype = {
  message: string;
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

export type authoriseSpendType = {
  message: string;
  token: string;
};

// HTTP - Create wallet
// io events - AccountCreationSuccess, AccountCreationFailed
export const createAccount = async (
  email: string,
  password: string,
  deviceToken: string,
  sphereid_index: number
) => {
  let URL = BASEURL + ENDPOINTS.createwallet;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      telegramId: email,
      password,
      deviceToken,
      sphereid_index,
    }),
    headers: { "Content-Type": "application/json" },
  });
};

// HTTP - Get eth wallet balance
export const walletBalance = async (): Promise<walletBalTtype> => {
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

export const mantraBalance = async (): Promise<usdtBalTYpe> => {
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

export const usdtBalance = async (): Promise<usdtBalTYpe> => {
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

// HTTP - Spend / Send eth from wallet to another address
// io events - TXSent, TXConfirmed
export const sendEth = async (
  toAddr: string,
  ethValStr: string,
  intent: string
) => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.sendeth;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: ethValStr, intent }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const sendUSDC = async (
  toAddr: string,
  usdtCalStr: string,
  intent: string
) => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.sendusdc;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: usdtCalStr, intent }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const sendBTC = async (
  toAddr: string,
  btcValStr: string,
  intent: string
) => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.sendbtc;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: btcValStr, intent }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const sendOM = async (
  toAddr: string,
  omValStr: string,
  intent: string
) => {
  let URL = BASEURL + ENDPOINTS.sendom;
  let token: string | null = localStorage.getItem("spheretoken");

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to: toAddr, value: omValStr, intent }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// HTTP - Get an access token to authorise spend on behalf
export const shareWalletAccess = async (
  timeValidFor: string,
  accessAmount: string,
  assetType: string
): Promise<authoriseSpendType> => {
  let URL = BASEURL + ENDPOINTS.sharewallet;
  let token: string | null = localStorage.getItem("spheretoken");

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      value: accessAmount,
      time: timeValidFor,
      type: assetType, // ETH, BTC, OM, USDC
    }),
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
  id: string,
  intent: string
): Promise<{ status: number }> => {
  let URL = BASEURL + ENDPOINTS.spendwithtoken + `?id=${id}&intent=${intent}`;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status == 200) {
    return { status: res?.status };
  } else {
    return { status: res?.status };
  }
};
