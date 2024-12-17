import { BASEURL, ENDPOINTS } from "./config";

export type walletBalTtype = {
  message: string;
  balance: string;
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

  return { message: data?.message, balance: data?.balance };
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

// HTTP - Get an access token to authorise spend on behalf
export const shareWalletAccess = async (
  accessToken: string,
  timeValidFor: string,
  receiver: string,
  accessAmount: string
): Promise<authoriseSpendType> => {
  let URL = BASEURL + ENDPOINTS.sharewallet;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ time: timeValidFor, receiver, value: accessAmount }),
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

  if (res.status == 200)
  {
     localStorage.removeItem("utxoId");
      return { spendOnBehalfSuccess: true, status: res?.status };
  }
   
  else {
    localStorage.removeItem("utxoId");
     return { spendOnBehalfSuccess: true, status: res?.status };
  

  }
};
