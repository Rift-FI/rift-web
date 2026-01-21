import { useQuery } from "@tanstack/react-query";

// Fee preview endpoint (payment service)
const PREVIEW_BASE_URL = "https://payment.riftfi.xyz";
const SDK_API_KEY = import.meta.env.VITE_SDK_API_KEY;

export interface OfframpFeePreview {
  rate: number;           // Exchange rate (buying rate for offramp)
  buying_rate: number;    // Buying rate
  selling_rate: number;   // Selling rate  
  feeBps: number;         // Fee in basis points (100 = 1%)
  feePercentage: number;  // Fee as percentage (1 = 1%)
}

export interface FeeBreakdown {
  // User input
  localAmount: number;           // Amount user wants to receive in local currency
  
  // Calculated values
  feeLocal: number;              // Fee in local currency
  totalLocalDeducted: number;    // Total local value deducted (amount + fee)
  usdcAmount: number;            // USDC amount to send to backend (WITHOUT fee)
  usdcNeeded: number;            // Total USDC needed from wallet (WITH fee) - for balance check
  
  // Rates
  exchangeRate: number;          // Exchange rate used
  feePercentage: number;         // Fee percentage (e.g., 1 for 1%)
  feeBps: number;                // Fee in basis points
}

/**
 * Fetch fee preview from API
 * Calls /api/offramp/preview-exchange-rate directly with auth headers.
 *
 * Backend returns:
 * { rate, selling_rate, buying_rate, feePercentage, feeBps }
 *
 * We only really care about the fee (feePercentage / feeBps) for displaying
 * how much extra the user pays and how much is taken as fees.
 */
async function fetchOfframpFeePreview(currency: string): Promise<OfframpFeePreview> {
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${PREVIEW_BASE_URL}/offramp/preview_exchange_rate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      "x-api-key": SDK_API_KEY || "",
    },
    // Per backend spec, body only needs the currency
    body: JSON.stringify({ currency }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch fee preview: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    rate: data.rate || data.buying_rate,
    buying_rate: data.buying_rate || data.rate,
    selling_rate: data.selling_rate || data.rate,
    feeBps: data.feeBps || data.fee_bps || 100, // Default to 100 bps (1%) if not provided
    feePercentage: data.feePercentage || data.fee_percentage || (data.feeBps || data.fee_bps || 100) / 100,
  };
}

/**
 * Calculate fee breakdown for offramp
 * User enters local amount they want to receive, we calculate how much USDC is needed
 * 
 * IMPORTANT: 
 * - usdcAmount = amount to SEND to backend (backend will deduct fee from this)
 * - usdcNeeded = total USDC user needs in wallet (for balance check only)
 */
export function calculateOfframpFeeBreakdown(
  localAmount: number,
  feePreview: OfframpFeePreview
): FeeBreakdown {
  const { buying_rate, feeBps } = feePreview;
  const feePercentage = feeBps / 100; // Convert bps to percentage (100 bps = 1%)
  
  // Fee is calculated on the local amount
  const feeLocal = Math.ceil(localAmount * (feePercentage / 100));
  
  // Total local currency value that will be deducted (user receives + fee)
  const totalLocalDeducted = localAmount + feeLocal;
  
  // USDC amount to send to backend (just the local amount, backend handles fee)
  // Round to 6 decimal places (USDC precision)
  const usdcAmount = Math.ceil((localAmount / buying_rate) * 1e6) / 1e6;
  
  // Total USDC needed = amount + fee (for balance check)
  const usdcNeeded = Math.ceil((totalLocalDeducted / buying_rate) * 1e6) / 1e6;
  
  return {
    localAmount,
    feeLocal,
    totalLocalDeducted,
    usdcAmount,      // Send this to backend
    usdcNeeded,      // Use this for balance check
    exchangeRate: buying_rate,
    feePercentage,
    feeBps,
  };
}

/**
 * Hook to fetch offramp fee preview
 */
export function useOfframpFeePreview(
  currency: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["offramp-fee-preview", currency],
    queryFn: () => fetchOfframpFeePreview(currency),
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  });
}

/**
 * Hook to get full fee breakdown for a given amount
 */
export function useOfframpFeeBreakdown(
  localAmount: number,
  currency: string,
  enabled: boolean = true
) {
  const { data: feePreview, isLoading, error, refetch } = useOfframpFeePreview(currency, enabled);
  
  const feeBreakdown = feePreview && localAmount > 0
    ? calculateOfframpFeeBreakdown(localAmount, feePreview)
    : null;
  
  return {
    feeBreakdown,
    feePreview,
    isLoading,
    error,
    refetch,
  };
}

// ============================================
// ONRAMP FEE CALCULATION (Fiat → USDC)
// ============================================

export interface OnrampFeeBreakdown {
  // User input
  localAmount: number;           // Amount user wants to pay in local currency
  
  // Calculated values
  feeLocal: number;              // Fee in local currency (added to payment)
  totalLocalToPay: number;       // Total local currency user pays (amount + fee)
  usdcToReceive: number;         // USDC user will receive
  
  // Rates
  exchangeRate: number;          // Selling rate used
  feePercentage: number;         // Fee percentage (e.g., 1 for 1%)
  feeBps: number;                // Fee in basis points
}

/**
 * Calculate fee breakdown for onramp (buying USDC)
 * User enters local amount they want to pay, we calculate how much USDC they'll receive
 * Fee is ADDED to what they pay, so they receive the full USDC value
 */
export function calculateOnrampFeeBreakdown(
  localAmount: number,
  feePreview: OfframpFeePreview
): OnrampFeeBreakdown {
  const { selling_rate, feeBps } = feePreview;
  const feePercentage = feeBps / 100; // Convert bps to percentage
  
  // For onramp: user pays localAmount, fee is calculated on top
  // Fee is calculated on the base amount (before fee)
  const feeLocal = Math.ceil(localAmount * (feePercentage / 100));
  
  // Total user pays = amount + fee
  const totalLocalToPay = localAmount + feeLocal;
  
  // USDC user receives = localAmount / selling_rate (fee doesn't reduce USDC)
  // Round to 6 decimal places (USDC precision)
  const usdcToReceive = Math.floor((localAmount / selling_rate) * 1e6) / 1e6;
  
  return {
    localAmount,
    feeLocal,
    totalLocalToPay,
    usdcToReceive,
    exchangeRate: selling_rate,
    feePercentage,
    feeBps,
  };
}

/**
 * Hook to get onramp fee breakdown for a given local amount
 */
export function useOnrampFeeBreakdown(
  localAmount: number,
  currency: string,
  enabled: boolean = true
) {
  const { data: feePreview, isLoading, error, refetch } = useOfframpFeePreview(currency, enabled);
  
  const feeBreakdown = feePreview && localAmount > 0
    ? calculateOnrampFeeBreakdown(localAmount, feePreview)
    : null;
  
  return {
    feeBreakdown,
    feePreview,
    isLoading,
    error,
    refetch,
  };
}

export default useOfframpFeePreview;
