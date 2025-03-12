import { QUVAULT_BASEURL, QUVAULT_ENDPOINTS } from "../config";

export type dividends = {
  total_amount: number;
  total_tokens: number;
  summary: {
    approved: {
      total_amount: number;
      total_tokens: number;
      total_dividends: number;
    };
    in_progress: {
      total_amount: number;
      total_tokens: number;
      total_dividends: number;
    };
    pending_accumulated: {
      total_amount: number;
      total_tokens: number;
      total_dividends: number;
    };
    sent: {
      total_amount: number;
      total_tokens: number;
      total_dividends: number;
    };
    failed: {
      total_amount: number;
      total_tokens: number;
      total_dividends: number;
    };
  };
};

export const getMyDividends = async (): Promise<{
  data: dividends;
}> => {
  let URL = QUVAULT_BASEURL + QUVAULT_ENDPOINTS.mydividends;
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
