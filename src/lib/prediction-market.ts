import axios from "axios";

const API_BASE_URL = "https://poly-production.up.railway.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export interface BackendMarket {
  marketId: string;
  question: string;
  endTime: string;
  createdAt: string;
  state: string;
  outcome: boolean;
  totalYESStake: string;
  totalNOStake: string;
  totalYESBonusPool: string;
  totalNOBonusPool: string;
  initialTokenBalance: string;
  resolvedAt: string;
  depositsAtCreation: string;
  depositsAtResolution: string;
  participants?: string[];
  poolInfo: {
    totalStaked: string;
    totalBonusPool: string;
    participantCount: string;
  };
  metrics: {
    yesPercentage: number;
    noPercentage: number;
    yesPrice: number;
    noPrice: number;
    totalStake: number;
    priceDisplay: {
      yes: string;
      no: string;
    };
    percentageDisplay: {
      yes: string;
      no: string;
    };
  };
}

export interface Market {
  id: string;
  question: string;
  description: string;
  category: string;
  endTime: string;
  totalStaked: string;
  yesStake: string;
  noStake: string;
  yieldAPY: number;
  isResolved: boolean;
  outcome?: boolean;
  createdAt: string;
  updatedAt: string;
  participants?: string[];
  participantCount?: number;
  metrics?: {
    yesPercentage: number;
    noPercentage: number;
    yesPrice: number;
    noPrice: number;
    totalStake: number;
    priceDisplay: {
      yes: string;
      no: string;
    };
    percentageDisplay: {
      yes: string;
      no: string;
    };
  };
}

export interface Listing {
  id: number;
  listing: {
    seller: string;
    marketId: string;
    askPrice: string;
    listedAt: string;
    expiresAt: string;
    active: boolean;
  };
  isValid: boolean;
  timeRemaining: string;
}

export interface Transaction {
  id: string;
  hash: string;
  type:
    | "stake"
    | "purchase"
    | "claim"
    | "create_listing"
    | "purchase_listing"
    | "claim_payout";
  status: "pending" | "confirmed" | "failed";
  marketId?: string;
  listingId?: string;
  amount: string;
  gasUsed?: string;
  createdAt: string;
}

export interface UserStats {
  totalStaked: string;
  totalReturns: string;
  activePositions: number;
  resolvedPositions: number;
  successRate: number;
  totalVolume: string;
}

export interface OracleData {
  question: string;
  sources: string[];
  confidence: number;
  reasoning: string;
  outcome: boolean;
  signature: string;
  timestamp: string;
}

const transformMarket = (backendMarket: BackendMarket): Market => {
  const question =
    backendMarket.question.split("-")[1] || backendMarket.question;
  let category = "General";
  if (
    question.toLowerCase().includes("president") ||
    question.toLowerCase().includes("election")
  ) {
    category = "Politics";
  } else if (
    question.toLowerCase().includes("sports") ||
    question.toLowerCase().includes("game")
  ) {
    category = "Sports";
  } else if (
    question.toLowerCase().includes("crypto") ||
    question.toLowerCase().includes("bitcoin")
  ) {
    category = "Crypto";
  }

  const bonusPool =
    parseFloat(backendMarket.totalYESBonusPool) +
    parseFloat(backendMarket.totalNOBonusPool);
  const totalStaked = parseFloat(backendMarket.poolInfo.totalStaked);
  const yieldAPY = totalStaked > 0 ? (bonusPool / totalStaked) * 100 : 0;

  return {
    id: backendMarket.marketId,
    question: question,
    description: `Prediction market: ${question}`,
    category,
    endTime: new Date(parseInt(backendMarket.endTime)).toISOString(),
    totalStaked: backendMarket.poolInfo.totalStaked,
    yesStake: backendMarket.totalYESStake,
    noStake: backendMarket.totalNOStake,
    yieldAPY,
    isResolved: backendMarket.state !== "0",
    outcome: backendMarket.outcome,
    createdAt: new Date(parseInt(backendMarket.createdAt) * 1000).toISOString(),
    updatedAt: new Date(parseInt(backendMarket.createdAt) * 1000).toISOString(),
    participants: backendMarket.participants || [], // Participants array from backend
    participantCount: parseInt(backendMarket.poolInfo.participantCount),
    // Include the backend's pre-calculated metrics
    metrics: backendMarket.metrics,
  };
};

// Markets API
export const marketsApi = {
  // Get all markets
  getAll: () =>
    api
      .get<{
        success: boolean;
        data: { items: BackendMarket[]; pagination: any };
      }>("/markets")
      .then((response) => {
        return {
          ...response,
          data: response.data.data.items.map(transformMarket),
        };
      }),

  getById: (id: string) =>
    api
      .get<{ success: boolean; data: BackendMarket }>(`/markets/${id}`)
      .then((response) => ({
        ...response,
        data: transformMarket(response.data.data),
      })),

  // Get market statistics
  getStats: (id: string) => api.get(`/markets/${id}/stats`),

  // Get market history
  getHistory: (id: string) => api.get(`/markets/${id}/history`),

  // NEW: Early exit endpoints
  canEarlyExit: (marketId: string, userAddress: string) =>
    api.get<{ success: boolean; data: { canExit: boolean; reason: string } }>(
      `/markets/${marketId}/can-early-exit/${userAddress}`
    ),

  getEarlyExitValue: (marketId: string, userAddress: string) =>
    api.get<{
      success: boolean;
      data: { exitAmount: string; penalty: string; platformFee: string };
    }>(`/markets/${marketId}/early-exit-value/${userAddress}`),

  // Portfolio endpoints
  getPortfolio: (userAddress: string) =>
    api.get<{ success: boolean; data: any }>(
      `/markets/portfolio/${userAddress}`
    ),

  getPortfolioSummary: (userAddress: string) =>
    api.get<{ success: boolean; data: any }>(
      `/markets/portfolio/${userAddress}/summary`
    ),

  // Stake in market (placeholder - actual staking done via wallet)
  stake: (marketId: string, position: "YES" | "NO", amount: string) =>
    api.post("/markets/stake", { marketId, position, amount }),

  // Claim payout (placeholder - actual claiming done via wallet)
  claim: (marketId: string) => api.post(`/markets/${marketId}/claim`),
};

// P2P Marketplace API
export const p2pApi = {
  getListings: (marketId: string) =>
    api.get<{
      success: boolean;
      data: { marketId: string; listings: Listing[]; count: number };
    }>(`/markets/${marketId}/listings`),
  getUserListings: (address: string) =>
    api.get(`/markets/listings/user/${address}`),
  createListing: (data: {
    marketId: string;
    askPrice: number;
    duration: number;
  }) => api.post("/p2p/create", data),
  purchaseListing: (listingId: string) =>
    api.post(`/p2p/purchase/${listingId}`),
  cancelListing: (listingId: string) => api.post(`/p2p/cancel/${listingId}`),
};

// Note: Token operations (approve, allowance, balance) are now handled directly through viem in useTransactions.ts

// Transactions API (for unsigned transaction generation)
export const transactionsApi = {
  // Check allowance for betting contract
  getAllowance: (userAddress: string) =>
    api.get<{ success: boolean; data: any }>(
      `/markets/allowance/${userAddress}`
    ),

  // Generate unsigned transactions - NEW betting endpoint
  getPlaceBetTransaction: (
    marketId: string,
    userAddress: string,
    amount: string,
    prediction: boolean
  ) =>
    api.get<{ success: boolean; data: any }>(
      `/transactions/place-bet/${marketId}`,
      {
        params: { userAddress, amount, prediction },
      }
    ),

  // Legacy stake transaction (keeping for backward compatibility)
  getStakeTransaction: (
    marketId: string,
    position: "YES" | "NO",
    amount: string
  ) =>
    api.get("/transactions/stake", { params: { marketId, position, amount } }),

  getClaimTransaction: (marketId: string) =>
    api.get(`/transactions/claim/${marketId}`),

  getCreateListingTransaction: (
    marketId: string,
    userAddress: string,
    askPrice: string,
    duration: string
  ) =>
    api.get<{ success: boolean; data: any }>(
      `/transactions/create-listing/${marketId}`,
      {
        params: { userAddress, askPrice, duration },
      }
    ),

  getPurchaseListingTransaction: (listingId: string, userAddress: string) =>
    api.get<{ success: boolean; data: any }>(
      `/transactions/purchase-listing/${listingId}`,
      {
        params: { userAddress },
      }
    ),

  // NEW: Token approval transaction
  getApproveTransaction: (userAddress: string, amount: string) =>
    api.get<{ success: boolean; data: any }>("/transactions/approve-token", {
      params: { userAddress, amount },
    }),

  // NEW: Early exit transaction
  getEarlyExitTransaction: (marketId: string, userAddress: string) =>
    api.get<{ success: boolean; data: any }>(
      `/transactions/early-exit/${marketId}`,
      {
        params: { userAddress },
      }
    ),

  // NEW: Claim payout transaction
  getClaimPayoutTransaction: (marketId: string, userAddress: string) =>
    api.get<{ success: boolean; data: any }>(
      `/transactions/claim-payout/${marketId}`,
      {
        params: { userAddress },
      }
    ),

  // Submit signed transaction - NEW format
  submitSignedTransaction: (
    transactionData: string,
    signature: string,
    userAddress: string
  ) =>
    api.post<{
      success: boolean;
      data: {
        transactionHash: string;
        blockNumber: number;
        gasUsed: string;
        status: string;
      };
    }>("/transactions/submit", {
      transactionData,
      signature,
      userAddress,
    }),

  // Get transaction status
  getStatus: (hash: string) => api.get(`/transactions/status/${hash}`),

  // Get user transactions
  getUserTransactions: (address: string) =>
    api
      .get<{ success: boolean; data: Transaction[] }>(
        `/transactions/user/${address}`
      )
      .then((response) => ({
        ...response,
        data: response.data.data || [],
      })),
};

// Oracle API
export const oracleApi = {
  // Get market data
  getMarketData: (marketId: string) =>
    api.get<OracleData>(`/oracle/${marketId}`),

  // Get confidence score
  getConfidence: (question: string) =>
    api.post("/oracle/confidence", { question }),

  // Trigger resolution
  triggerResolution: (marketId: string) =>
    api.post(`/oracle/resolve/${marketId}`),
};

// Admin API
export const adminApi = {
  // Create market
  createMarket: (data: { question: string; endTime: number }) =>
    api.post<{ success: boolean; data: any }>("/admin/markets", data),

  // Resolve market
  resolveMarket: (id: string, outcome: boolean) =>
    api.put<{ success: boolean; data: any }>(`/admin/markets/${id}/resolve`, {
      outcome,
    }),

  // Get system stats
  getSystemStats: () =>
    api.get<{ success: boolean; data: any }>("/admin/status"),

  // Get users (placeholder)
  getUsers: () => api.get("/admin/users"),

  // Get analytics
  getAnalytics: () => api.get("/admin/analytics"),
};

// User API
export const userApi = {
  // Get user profile
  getProfile: (address: string) => api.get(`/users/${address}`),

  // Get user stats
  getStats: (address: string) => api.get<UserStats>(`/users/${address}/stats`),

  // Get user positions
  getPositions: (address: string) => api.get(`/users/${address}/positions`),

  // Get user listings
  getListings: (address: string) => api.get(`/users/${address}/listings`),
};

// Auth API
export const authApi = {
  // Get nonce for signing
  getNonce: (address: string) => api.get(`/auth/nonce/${address}`),

  // Sign in with wallet signature
  signIn: (signature: string, message: string, address: string) =>
    api.post("/auth/signin", { signature, message, address }),

  // Verify auth token
  verify: () => api.get("/auth/verify"),

  // Sign out
  signOut: () => api.post("/auth/signout"),
};

// Development API (for testing)
export const devApi = {
  // Sign transaction with server wallet (dev only)
  signTransaction: (txData: any) => api.post("/dev-sign", txData),

  // Sign and submit transaction (dev only)
  signAndSubmit: (txData: any) => api.post("/dev-sign-and-submit", txData),
};
