import { POLYMARKET_BASE_URL, POLYMARKET_ENDPOINTS } from "./config";

type createorderres = {
  errorMsg: string;
  orderID: string;
  takingAmount: string;
  makingAmount: string;
  status: string;
  transactionsHashes: string | null;
  success: boolean;
};

type cancelorderres = {
  canceled: string[];
};

type ordertype = {
  id: string;
  status: string;
  owner: string;
  maker_address: string;
  market: string;
  asset_id: string;
  side: string;
  original_size: string;
  size_matched: string;
  price: string;
  outcome: string;
  expiration: string;
  order_type: string;
  associate_trades: any[];
  created_at: number;
};

export const getOrders = async (): Promise<{ data: ordertype[] }> => {
  const URL = POLYMARKET_BASE_URL + POLYMARKET_ENDPOINTS.userorders;
  const polymarkettoken = localStorage.getItem("polymarkettoken");

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${polymarkettoken}`,
    },
  });

  return res.json();
};

export const createOrder = async (
  token_id: string,
  price: number,
  side: "BUY" | "SELL",
  size: number
): Promise<{ data: createorderres }> => {
  const URL = POLYMARKET_BASE_URL + POLYMARKET_ENDPOINTS.createorder;
  const polymarkettoken = localStorage.getItem("polymarkettoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${polymarkettoken}`,
    },
    body: JSON.stringify({
      token_id: token_id,
      price: price,
      side: side,
      size: size,
    }),
  });

  return res.json();
};

export const cancelOrder = async (
  orderId: string
): Promise<{ data: cancelorderres }> => {
  const URL = POLYMARKET_BASE_URL + POLYMARKET_ENDPOINTS.cancelorder;
  const polymarkettoken = localStorage.getItem("polymarkettoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${polymarkettoken}`,
    },
    body: JSON.stringify({
      orderId,
    }),
  });

  return res.json();
};
