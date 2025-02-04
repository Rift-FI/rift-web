import { BASEURL, ENDPOINTS } from "./config";

export type unlockhistorytype = {
  _id: string;
  username: string;
  message: string[];
};

export const createAirdropCampaign = async (
  campaignname: string,
  maxsupply: number,
  qtyperuser: number
): Promise<string> => {
  // return airdrop url
  const URL = BASEURL + ENDPOINTS.createairdrop;
  const accessToken = localStorage.getItem("token");

  const res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      campaign_name: campaignname,
      max_tokens: maxsupply,
      amount_per_user: qtyperuser,
    }),
  });

  return res.json();
};

export const claimAirdrop = async (airDropid: string) => {
  const URL = BASEURL + ENDPOINTS.claimairdrop + `?id=${airDropid}`;
  const accessToken = localStorage.getItem("token");

  await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export type unlockTokensType = {
  amount: number;
  unlocked: number;
};

export const getUnlockedTokens = async (): Promise<unlockTokensType> => {
  const URL = BASEURL + ENDPOINTS.getunlockedtokens;
  const accessToken = localStorage.getItem("token");

  const res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await res.json();
};

export const unlockTokens = async (amount: number) => {
  const URL = BASEURL + ENDPOINTS.unlocktokens;
  const accessToken = localStorage.getItem("token");

  await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ amount }),
  });
};

export const unlockTokensHistory = async (): Promise<unlockhistorytype[]> => {
  const accessToken = localStorage.getItem("token");
  const URL = BASEURL + ENDPOINTS.unlockhistory;

  const res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.json();
};
