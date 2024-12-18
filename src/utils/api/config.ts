import io from "socket.io-client";

export const BASEURL = "https://strato-vault.com";

export const ENDPOINTS = {
  signup: "/signup",
  createwallet: "/create-evm",
  balance: "/balance",
  spend: "/spend",
  sharewallet: "/authorize-unchecked-spend",
  spendwithtoken: "/foreign-unchecked-spend",
  importkey: "/import-key",
  getkeys: "/fetch-keys",
  sharekey: "/share-key",
};

export const SOCKET = io(BASEURL);
