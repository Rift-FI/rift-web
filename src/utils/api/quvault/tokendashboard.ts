import {
  QUVAULT_BASEURL,
  QUVAULT_ENDPOINTS,
  QUVAULT_TOKEN_ENDPOINTS,
} from "../config";

export type tokendashboardoverview = {
  name: string;
  balance: number;
  rate: number;
  period: string;
  apy: number;
  market_cap: number;
  real_name: string;
  symbol: string;
  offering_date: string;
  cost_margin: number;
  icon_url: string;
  address: string; // opens -> https://polygonscan.com/token/{token-address}
};

export type settlement = {
  year_month: string;
  sales_order_amount: number;
  wavg_refund_ratio: number;
  wavg_settlement_ratio: number;
};

export type topproduct = {
  rank: number;
  shop_id: string;
  asin: string;
  sku: string;
  title: string;
  image_url: string;
  p30d_sales_amt: number;
  sku_dio_12m: number;
};

export type inventoryoverview = {
  curr_inv_value: number;
  wavg_dio_all_sku_curr_inv_value: number;
  top_10_proportion_curr_inv_value: number;
  top_50_percent_proportion_curr_inv_value: number;
  top_75_percent_proportion_curr_inv_value: number;
};

export const getTokenOverview = async (
  tokensymbol: string
): Promise<{ data: tokendashboardoverview }> => {
  let URL =
    QUVAULT_BASEURL +
    QUVAULT_ENDPOINTS.tokendashboard +
    tokensymbol +
    QUVAULT_TOKEN_ENDPOINTS.overview;
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

export const getTopProducts = async (
  tokensymbol: string
): Promise<{ data: topproduct[] }> => {
  let URL =
    QUVAULT_BASEURL +
    QUVAULT_ENDPOINTS.tokendashboard +
    tokensymbol +
    QUVAULT_TOKEN_ENDPOINTS.topproducts;
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

export const getInventoryOverview = async (
  tokensymbol: string
): Promise<{ data: inventoryoverview }> => {
  let URL =
    QUVAULT_BASEURL +
    QUVAULT_ENDPOINTS.tokendashboard +
    tokensymbol +
    QUVAULT_TOKEN_ENDPOINTS.inventory;
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

export const getTokenSettlement = async (
  tokensymbol: string,
  _fromdate?: string,
  _todate?: string
): Promise<{ data: settlement[] }> => {
  let URL =
    QUVAULT_BASEURL +
    QUVAULT_ENDPOINTS.tokendashboard +
    tokensymbol +
    QUVAULT_TOKEN_ENDPOINTS.settlement +
    "?from=2023-01-01T08:22:42.330Z&to=2025-01-01T08:22:42.330Z";
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
