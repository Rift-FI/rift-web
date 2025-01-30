import { BASEURL, ENDPOINTS } from "./config";

export const claimAirdrop = async (
  airDropid: string
): Promise<{ isOK: boolean; status: number }> => {
  const URL = BASEURL + ENDPOINTS.claimairdrop + `?id=${airDropid}`;
  const accessToken = localStorage.getItem("token");

  let res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return { isOK: res?.ok, status: res?.status };
};

type unlockTokensType = {
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

  const data: unlockTokensType = await res.json();

  return { amount: data?.amount, unlocked: data?.unlocked };
};

export const unlockTokens = async (
  amount: number
): Promise<{ isOk: boolean; status: number }> => {
  const URL = BASEURL + ENDPOINTS.unlocktokens;
  const accessToken = localStorage.getItem("token");

  const res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ amount }),
  });

  return { isOk: res?.ok, status: res?.status };
};
