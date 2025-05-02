import { POLYMARKET_BASE_URL, POLYMARKET_ENDPOINTS } from "./config";

type marketeventtype = {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  liquidity: string;
  startDate: string;
  fee: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  closed: boolean;
  marketMakerAddress: string;
  createdAt: string;
  updatedAt: string;
  wideFormat: boolean;
  new: boolean;
  sentDiscord: boolean;
  archived: boolean;
  resolvedBy: string;
  restricted: boolean;
  groupItemTitle: string;
  questionID: string;
  enableOrderBook: boolean;
  orderPriceMinTickSize: number;
  orderMinSize: number;
  volumeNum: number;
  liquidityNum: number;
  endDateIso: string;
  startDateIso: string;
  hasReviewedDates: boolean;
  readyForCron: boolean;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  gameStartTime: string;
  secondsDelay: number;
  clobTokenIds: string;
  fpmmLive: boolean;
  volume24hrClob: number;
  volume1wkClob: number;
  volume1moClob: number;
  volume1yrClob: number;
  volumeClob: number;
  liquidityClob: number;
  acceptingOrders: boolean;
  negRisk: boolean;
  notificationsEnabled: boolean;
  ready: boolean;
  funded: boolean;
  acceptingOrdersTimestamp: string;
  cyom: boolean;
  competitive: number;
  pagerDutyNotificationEnabled: boolean;
  approved: boolean;
  rewardsMinSize: number;
  rewardsMaxSpread: number;
  spread: number;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  automaticallyActive: boolean;
  clearBookOnStart: boolean;
  manualActivation: boolean;
  negRiskOther: boolean;
  umaResolutionStatuses: string;
  pendingDeployment: boolean;
  deploying: boolean;
};

type markettagtype = {
  label: string;
  publishedAt: string;
};

type seriestype = {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  seriesType: string;
  recurrence: string;
  image: string;
  icon: string;
  layout: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  publishedAt: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  commentsEnabled: boolean;
  competitive: string;
  volume24hr: number;
  volume: number;
  liquidity: number;
  startDate: string;
  commentCount: number;
};

type markettype = {
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
  active: true;
  closed: false;
  archived: false;
  new: false;
  featured: false;
  restricted: true;
  liquidity: number;
  volume: number;
  openInterest: null;
  createdAt: string;
  updatedAt: string;
  competitive: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  enableOrderBook: true;
  liquidityClob: number;
  negRisk: boolean;
  commentCount: number;
  markets: marketeventtype[];
  series: seriestype[];
  tags: markettagtype[];
  cyom: boolean;
  showAllOutcomes: boolean;
  showMarketImages: boolean;
  enableNegRisk: boolean;
  automaticallyActive: boolean;
  eventDate: string;
  startTime: string;
  eventWeek: number;
  seriesSlug: string;
  period: string;
  negRiskAugmented: boolean;
  pendingDeployment: boolean;
  deploying: boolean;
};

type marketbycondition = {
  enable_order_book: boolean;
  active: boolean;
  closed: boolean;
  archived: boolean;
  accepting_orders: boolean;
  accepting_order_timestamp: string;
  minimum_order_size: number;
  minimum_tick_size: number;
  condition_id: string;
  question_id: string;
  question: string;
  description: string;
  market_slug: string;
  end_date_iso: string;
  game_start_time: string | null;
  seconds_delay: number;
  fpmm: string;
  maker_base_fee: string;
  taker_base_fee: number;
  notifications_enabled: boolean;
  neg_risk: boolean;
  neg_risk_market_id: string;
  neg_risk_request_id: string;
  icon: string;
  image: string;
  rewards: {
    rates: [
      {
        asset_address: string;
        rewards_daily_rate: number;
      }
    ];
    min_size: number;
    max_spread: number;
  };
  is_50_50_outcome: boolean;
  tokens: {
    token_id: string;
    outcome: string;
    price: number;
    winner: boolean;
  }[];
};

export const fetchMarkets = async (
  category?: string
): Promise<{ data: markettype[] }> => {
  const URL =
    POLYMARKET_BASE_URL +
    POLYMARKET_ENDPOINTS.markets +
    `?category=${category}`;
  const polymarkettoken = localStorage.getItem("polymarkettoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${polymarkettoken}`,
    },
  });

  return res.json();
};

export const fetchMarketByConditionId = async (
  conditionId: string
): Promise<{ data: marketbycondition }> => {
  const URL =
    POLYMARKET_BASE_URL + POLYMARKET_ENDPOINTS.marketsbycondition + conditionId;
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
