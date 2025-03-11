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

export const getLaunchPadProjects = async (): Promise<{
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
