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
  ombalance: "/usdt-balance",
  sendusdt: "/spend-usdt",
  sendbtc: "/spend-btc",
  promptgpt: "/conversational-ai",
  chatwithbot: "/chat-with-bot",
  chatbothistory: "/conversation-chat-history",
  prompthistory: "/conversation-history",
  createReferralLink: "/create-refferal",
  incentivize: "/earn-from-referral",
  rewardnewuser: "/reward-new-user",
  createairdrop: "/airdrop-campaign",
  claimairdrop: "/claim-airdrop",
  unlocktokens: "/unlock-tokens",
  unlockhistory: "/unlock-history",
  getunlockedtokens: "/fetch-unlock-tokens",
  importawxkey: "/import-airwallex",
  awxbalances: "/get-airwallex-balances",
};

export const SOCKET = io(BASEURL);
