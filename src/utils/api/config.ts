import io from "socket.io-client";

export const BASEURL = "https://strato-vault.com";
export const QUVAULT_BASEURL = "https://backend-dev.quvault.app";

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
  ombalance: "/usdt-balance",
  sendusdt: "/spend-usdt",
  sendbtc: "/spend-btc",
  promptgpt: "/conversational-ai",
  chatwithbot: "/chat-with-bot",
  chatbothistory: "/conversation-chat-history",
  prompthistory: "/conversation-history",
  createReferralLink: "/create-refferal",
  createairdrop: "/airdrop-campaign",
  claimairdrop: "/claim-airdrop",
  unlocktokens: "/unlock-tokens",
  unlockhistory: "/unlock-history",
  getunlockedtokens: "/fetch-unlock-tokens",
  importawxkey: "/import-airwallex",
  awxbalances: "/get-airwallex-balances",
};

export const QUVAULT_ENDPOINTS = {
  signup: "/auth/signup",
  signin: "/auth/signin",
  currentuser: "/auth/me",
  launchpad: "/launchpad",
  tokens: "/token",
  tokenoverview: "/overview",
  tokenbalance: "/swap/token-balance",
  swapestimate: "/swap/swap-estimate-v2",
  swappst: "/swap/tx",
};

export const SOCKET = io(BASEURL);
