import { POLYMARKET_GAMMA, POLYMARKET_ENDPOINTS } from "./config";

type marketeventtype = {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  creationDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number;
  volume: number;
  openInterest: number;
  sortBy: string;
  category: string;
  published_at: string;
  createdAt: string;
  updatedAt: string;
  competitive: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  liquidityAmm: number;
  liquidityClob: number;
  commentCount: number;
  cyom: boolean;
  closedTime: string;
  showAllOutcomes: boolean;
  showMarketImages: boolean;
  enableNegRisk: boolean;
  negRiskAugmented: boolean;
};

type markettype = {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  twitterCardImage: string;
  endDate: string;
  category: string;
  liquidity: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  marketType: string;
  closed: boolean;
  marketMakerAddress: string;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  closedTime: string;
  mailchimpTag: string;
  archived: boolean;
  restricted: boolean;
  volumeNum: number;
  liquidityNum: number;
  endDateIso: string;
  hasReviewedDates: boolean;
  readyForCron: boolean;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  clobTokenIds: string;
  fpmmLive: boolean;
  volume1wkAmm: number;
  volume1moAmm: number;
  volume1yrAmm: number;
  volume1wkClob: number;
  volume1moClob: number;
  volume1yrClob: number;
  events: marketeventtype[];
  creator: string;
  ready: boolean;
  funded: boolean;
  cyom: boolean;
  competitive: number;
  pagerDutyNotificationEnabled: boolean;
  approved: boolean;
  rewardsMinSize: number;
  rewardsMaxSpread: number;
  spread: number;
  oneDayPriceChange: number;
  oneHourPriceChange: number;
  oneWeekPriceChange: number;
  oneMonthPriceChange: number;
  oneYearPriceChange: number;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  clearBookOnStart: boolean;
  manualActivation: boolean;
  negRiskOther: boolean;
  umaResolutionStatuses: string;
};

export const fetchMarkets = async (): Promise<{
  markets: markettype[];
  status: number;
}> => {
  const URL = POLYMARKET_GAMMA + POLYMARKET_ENDPOINTS.markets;

  const res = await fetch(URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data: markettype[] = await res?.json();
  return { markets: data, status: res?.status };
};
