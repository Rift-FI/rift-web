import { BASEURL, ENDPOINTS } from "./config";

export type awxbalType = {
  message: string;
  balances: {
    USD: number;
    HKD: number;
  };
};

// get USD - HKD balances
export const fetchAirWllxBalances = async (
  ownerUsername: string
): Promise<{ balances: awxbalType; status: number }> => {
  const URL = BASEURL + ENDPOINTS.awxbalances;
  let accessToken: string | null = localStorage.getItem("token");

  const res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ username: ownerUsername }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data: awxbalType = await res?.json();
  return { balances: data, status: res?.status };
};

export const importAwxKey = async (
  accessToken: string,
  awxkey: string,
  ownerUsername: string
): Promise<{ isOk: boolean }> => {
  const URL = BASEURL + ENDPOINTS.importawxkey;

  const res = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ username: ownerUsername, api_key: awxkey }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return { isOk: res.ok };
};
