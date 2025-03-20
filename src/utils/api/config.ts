import io from "socket.io-client";

export const BASEURL = "https://strato-vault.com";
export const QUVAULT_BASEURL = "https://backend-dev.quvault.app";

export const ENDPOINTS = {
  signup: "/auth/signup",
  createwallet: "/auth/create-account",
  balance: "/wallet/balance",
  usdtbalance: "/wallet/usdt-balance",
  ombalance: "/wallet/om-balance",
  sharewallet: "/authorization/authorize-unchecked-spend",
  spendwithtoken: "/foreign-unchecked-spend",
  importkey: "/key/import",
  getkeys: "/key/fetch",
  sharekey: "/key/share",
  usekey: "/key/use",
  keypayment: "/key/do-key-payment",
  sendeth: "/transaction/spend-eth",
  sendusdc: "/transaction/spend-usdt",
  sendbtc: "/transaction/spend-btc",
  sendom: "/transaction/spend-om",
  promptgpt: "/conversation/ai",
  prompthistory: "/conversation/history",
  // chatwithbot: "/chat-with-bot",
  // chatbothistory: "/conversation-chat-history",
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
  launchpadsubscribe: "/launchpad/subscribe/",
  tokens: "/token",
  tokenoverview: "/overview",
  tokenbalance: "/swap/token-balance",
  swapestimate: "/swap/swap-estimate-v2",
  swappst: "/swap/tx",
  mydividends: "/dividend/user/summary",
  tokendashboard: "/token-dashboard/", //..{symbol}/..
};

export const QUVAULT_TOKEN_ENDPOINTS = {
  overview: "/overview",
  inventory: "/inventory-overview",
  topproducts: "/top-products",
  settlement: "/settlement", //...?from=date&to=date
};

export const SOCKET = io(BASEURL);
