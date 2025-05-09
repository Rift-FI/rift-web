import { OFFRAMP_BASEURL } from "../config";

type statusRestype = {
  status: string;
  paystackVerificationData: {
    channel: string;
  };
};

export const checkTransactionStatus = async (
  txreference: string
): Promise<statusRestype> => {
  const URL =
    OFFRAMP_BASEURL + `/api/onramp/transactions/${txreference}/status`;

  const res = await fetch(URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return res.json();
};
