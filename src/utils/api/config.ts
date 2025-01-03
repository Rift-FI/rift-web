import io from "socket.io-client";

export const BASEURL = "https://strato-vault.com";

export const ENDPOINTS = {
  signup: "/signup",
  createwallet: "/create-account",
  balance: "/balance",
  spend: "/spend",
  sharewallet: "/authorize-unchecked-spend",
  spendwithtoken: "/foreign-unchecked-spend",
  importkey: "/import-key",
  getkeys: "/fetch-keys",
  sharekey: "/share-key",
  usekey: "/use-key",
  usdtbalance: "/usdt-balance",
  sendusdt: "/spend-usdt",
  sendbtc: "/spend-btc",
  promptgpt: "/conversational-ai", // prompt gpt
  prompthistory: "/conversation-history",
};

export const SOCKET = io(BASEURL);
