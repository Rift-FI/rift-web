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

export type transactionType = {
  id: string;
  userEmail: string;
  transactionHash: string;
  amount: number;
  currency: string;
  recipientAddress: string;
  createdAt: string;
};

export type supportedassetType = {
  chain: string;
  chainId: number;
  symbol: string;
  address: string | null;
  decimals: number;
  type: string;
  category: string;
  isNative: boolean;
};

/**
 *
 * Create wallet
 * emits io events - AccountCreationSuccess, AccountCreationFailed
 * @param email
 * @param password
 * @param deviceToken
 * @param sphereid_index
 * @param phoneNumber
 */
export const createAccount = async (
  email: string,
  password: string,
  deviceToken: string,
  sphereid_index: number,
  phoneNumber: string
): Promise<{ status: number }> => {
  let URL = BASEURL + ENDPOINTS.createwallet;

  const res = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      telegramId: email,
      password,
      deviceToken,
      sphereid_index,
      phoneNumber,
    }),
    headers: { "Content-Type": "application/json" },
  });

  return { status: res?.status };
};

/**
 *
 * Send eth from wallet to another address
 * io events - TXSent, TXConfirmed
 * @param toAddr
 * @param ethValStr
 * @param intent
 */
export const sendEth = async (
  toAddr: string,
  ethValStr: string,
  intent: string
) => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.sendeth;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      to: toAddr,
      value: ethValStr,
      intent,
      otpCode: "1580",
      type: "gasless",
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 *
 * Send polygon usdc (usdc) from wallet to another address
 * @param toAddr
 * @param usdtCalStr
 * @param intent
 */
export const sendPolygonUSDC = async (
  toAddr: string,
  usdtCalStr: string,
  intent: string
) => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.sendusdc;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      to: toAddr,
      value: usdtCalStr,
      intent,
      otpCode: "1580",
      type: "gasless",
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 *
 * Send berachain usdc (usdc.e) from wallet to another address
 * @param toAddr
 * @param wusdcCalStr
 * @param intent
 */
export const sendBerachainUsdc = async (
  toAddr: string,
  wusdcCalStr: string,
  intent: string
) => {
  let token: string | null = localStorage.getItem("spheretoken");

  let URL = BASEURL + ENDPOINTS.sendwusdc;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      to: toAddr,
      value: wusdcCalStr,
      intent,
      otpCode: "1580",
      type: "gasless",
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 *
 * Send bera from wallet to another address
 * @param toAddr
 * @param wberaValStr
 * @param intent
 */
export const sendWbera = async (
  toAddr: string,
  wberaValStr: string,
  intent: string
) => {
  let URL = BASEURL + ENDPOINTS.sendbera;
  let token: string | null = localStorage.getItem("spheretoken");

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      to: toAddr,
      value: wberaValStr,
      intent,
      otpCode: "1580",
      type: "gasless",
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 *
 * Create a link for others to collect crypto from your wallet
 * @param timeValidFor
 * @param accessAmount
 * @param assetType
 * @returns
 */
export const createCryptoCollectLink = async (
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
      otpCode: "1580",
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  let data: authoriseSpendType = await res.json();

  return { message: data?.message, token: data?.token };
};

/**
 *
 * Collect crypto from a shared link
 * emits io events - TXSent, TXConfirmed
 * @param accessToken
 * @param to
 * @param id
 * @param intent
 * @returns
 */
export const spendOnBehalf = async (
  accessToken: string,
  to: string,
  id: string,
  intent: string
): Promise<{ status: number }> => {
  let URL = BASEURL + ENDPOINTS.spendwithtoken + `?id=${id}&intent=${intent}`;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ to, otpCode: "1580" }),
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

/**
 *
 * Get user's transaction history
 */
export const getTransactionHistory = async (): Promise<{
  transactions: transactionType[];
}> => {
  const URL = BASEURL + ENDPOINTS.txhistory;
  let token: string | null = localStorage.getItem("spheretoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otpCode: "1245" }),
  });

  return res?.json();
};

/**
 *
 * Retreive assets supported by sphere
 */
export const getSupportedAssets = async (): Promise<{
  assets: supportedassetType[];
}> => {
  const URL = BASEURL + ENDPOINTS.supportedassets;
  let token: string | null = localStorage.getItem("spheretoken");

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res?.json();

  return { assets: data?.assets };
};
