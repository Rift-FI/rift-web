import { BASEURL, ENDPOINTS } from "./config";

export const swapTokensNormal = async (
  token_to_sell: string,
  token_to_sell_address: string,
  token_to_buy: string,
  value: string,
  isEth: boolean
): Promise<{ status: number }> => {
  let URL = BASEURL + ENDPOINTS.swap;
  let token: string | null = localStorage.getItem("spheretoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      chain: "arbitrum",
      flow: "normal",
      token_to_sell,
      token_to_sell_address,
      token_to_buy,
      value,
      isEth,
    }),
  });

  return { status: res?.status };
};

export const swapTokensGassless = async (
  token_to_sell_address: string,
  token_to_buy_address: string,
  value: string,
  amountOut: string,
  isEth: boolean,
  isBuyingEth: boolean
): Promise<{ status: number }> => {
  let URL = BASEURL + ENDPOINTS.swap;
  let token: string | null = localStorage.getItem("spheretoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      chain: "arbitrum",
      flow: "gasless",
      token_to_sell_address,
      token_to_buy_address,
      value,
      amountOut,
      isEth,
      isBuyingEth,
    }),
  });

  return { status: res?.status };
};
