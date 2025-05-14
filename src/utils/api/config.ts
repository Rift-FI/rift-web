import io from "socket.io-client";

export const BASEURL = "https://strato-vault.com";
export const QUVAULT_BASEURL = "https://backend-dev.quvault.app";

export const ENDPOINTS = {
  signup: "/auth/signup",
  sendotp: "/otp/send",
  verifyotp: "/otp/verify",
  createwallet: "/auth/create-account",
  balance: "/wallet/balance",
  usdtbalance: "/wallet/usdt-balance",
  wusdcbalance: "/wallet/usdc-balance",
  wberaBalance: "/wallet/wbera-balance",
  liskbalances: "/wallet/lisk-balances",
  basebalances: "/wallet/base-balances",
  bnbbalances: "/wallet/bnb-balances",
  arbitrumbalances: "/wallet/arbitrum-balances",
  sharewallet: "/authorization/authorize-unchecked-spend",
  spendwithtoken: "/authorization/foreign-unchecked-spend",
  importkey: "/key/import",
  getkeys: "/key/fetch",
  fetchkey: "/key/single-key",
  sharekey: "/key/share",
  usekey: "/key/use",
  keyearnings: "/key/earnings",
  keypayment: "/key/do-key-payment",
  keypaymentsuccess: "/key/payment-success",
  keysbyowner: "/key/fetch-by-owner",
  revokekeyaccess: "/key/revoke-key",
  sendeth: "/transaction/spend-eth",
  sendusdc: "/transaction/spend-usdt",
  sendbtc: "/transaction/spend-btc",
  sendom: "/transaction/spend-om",
  sendbera: "/transaction/spend-wbera",
  sendwusdc: "/transaction/spend-usdc",
  txhistory: "/transaction/history",
  supportedassets: "/assets",
  getfaucet: "/wallet/faucet/",
  promptgpt: "/conversation/ai",
  prompthistory: "/conversation/history",
  chatwithbot: "/conversation/chat-with-bot",
  chatbothistory: "/conversation/chat-with-bot-history",
  createReferralLink: "/referral/create",
  createairdrop: "/airdrop/create-campaign",
  claimairdrop: "/airdrop/claim",
  dailycheckin: "/airdrop/daily-checkin",
  unlocktokens: "/referral/unlock",
  unlockhistory: "/referral/unlock-history",
  getunlockedtokens: "/referral/fetch-unlocked",
  importawxkey: "/import-airwallex",
  awxbalances: "/get-airwallex-balances",
  stakinginfo: "/staking/info",
  stakebalance: "/staking/user/",
  stakelst: "/staking/stake",
  unstakelst: "/staking/initiate-unstake",
  burnsphere: "/burnAndReward",
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
