import { OFFRAMP_BASEURL } from "../config";

export const checkTransactionStatus = async (
  txreference: string
): Promise<{ status: string }> => {
  const URL =
    OFFRAMP_BASEURL + `/api/onramp/transactions/${txreference}/status`;

  const res = await fetch(URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return res.json();
};
