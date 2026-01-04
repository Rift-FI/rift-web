import { useState, useCallback } from "react";
import rift from "@/lib/rift";
import { ethers } from "ethers";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Quote response types
export interface BuyQuote {
  canExecute: boolean;
  usdcToSwap: string;
  usdcToSwapFormatted: string;
  estimatedSailR: string;
  estimatedSailRFormatted: string;
  totalUsdcNeeded: string;
  totalUsdcNeededFormatted: string;
  fees: {
    gasRefund: string;
    gasRefundFormatted: string;
  };
  balances: {
    smartWallet: string;
    smartWalletFormatted: string;
    hasSufficientBalance: boolean;
  };
  warnings: string[];
}

export interface SellQuote {
  canExecute: boolean;
  sailrToSell: string;
  sailrToSellFormatted: string;
  estimatedUsdcGross: string;
  estimatedUsdcGrossFormatted: string;
  estimatedUsdcNet: string;
  estimatedUsdcNetFormatted: string;
  fees: {
    gasRefund: string;
    gasRefundFormatted: string;
  };
  warnings: string[];
}

export interface USDeSellQuote {
  canExecute: boolean;
  usdeToSell: string;
  usdeToSellFormatted: string;
  estimatedUsdcGross: string;
  estimatedUsdcGrossFormatted: string;
  estimatedUsdcNet: string;
  estimatedUsdcNetFormatted: string;
  fees: {
    gasRefund: string;
    gasRefundFormatted: string;
  };
  priceInfo: {
    effectiveRate: string;
  };
  warnings: string[];
}

export interface TradeResult {
  success: boolean;
  swapTransactions: string[];
  eoaAddress: string;
}

// Hook for buying SAIL.R
export function useBuySailr() {
  const [quote, setQuote] = useState<BuyQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const getQuote = useCallback(async (usdcAmount: number): Promise<BuyQuote | null> => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem("token");
      if (!authToken) {
        setError("Please log in to continue");
        return null;
      }

      rift.setBearerToken(authToken);

      // Convert USDC to wei (6 decimals)
      const amountWei = ethers.parseUnits(usdcAmount.toString(), 6).toString();

      console.log("⚓ [Sailr] Getting buy quote for:", usdcAmount, "USDC");

      const response = await (rift as any).sailr.getBuyQuote(amountWei);

      if (!response.quote.canExecute) {
        setError(response.quote.warnings.join(", "));
        return null;
      }

      setQuote(response.quote);
      return response.quote;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to get quote";
      setError(errorMsg);
      console.error("⚓ [Sailr] Buy quote error:", errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeBuy = useCallback(async (usdcAmount: number): Promise<TradeResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem("token");
      if (!authToken) {
        setError("Please log in to continue");
        return null;
      }

      rift.setBearerToken(authToken);

      const amountWei = ethers.parseUnits(usdcAmount.toString(), 6).toString();

      console.log("⚓ [Sailr] Executing buy for:", usdcAmount, "USDC");

      const result = await (rift as any).sailr.buy({ amount: amountWei });

      // Refresh balances after successful purchase
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["sailr-balances"] });
      }, 5000);

      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Transaction failed";
      setError(errorMsg);
      console.error("⚓ [Sailr] Buy execution error:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return { getQuote, executeBuy, quote, loading, error, clearQuote };
}

// Hook for selling SAIL.R
export function useSellSailr() {
  const [quote, setQuote] = useState<SellQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const getQuote = useCallback(async (sailrAmount: number): Promise<SellQuote | null> => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem("token");
      if (!authToken) {
        setError("Please log in to continue");
        return null;
      }

      rift.setBearerToken(authToken);

      // Convert SAIL.R to wei (18 decimals)
      const amountWei = ethers.parseUnits(sailrAmount.toString(), 18).toString();

      console.log("⚓ [Sailr] Getting sell quote for:", sailrAmount, "SAIL.R");

      const response = await (rift as any).sailr.getSellQuote(amountWei);

      if (!response.quote.canExecute) {
        setError(response.quote.warnings.join(", "));
        return null;
      }

      setQuote(response.quote);
      return response.quote;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to get quote";
      setError(errorMsg);
      console.error("⚓ [Sailr] Sell quote error:", errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeSell = useCallback(async (sailrAmount: number, returnToSmartWallet = true): Promise<TradeResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem("token");
      if (!authToken) {
        setError("Please log in to continue");
        return null;
      }

      rift.setBearerToken(authToken);

      const amountWei = ethers.parseUnits(sailrAmount.toString(), 18).toString();

      console.log("⚓ [Sailr] Executing sell for:", sailrAmount, "SAIL.R");

      const result = await (rift as any).sailr.sell({
        amount: amountWei,
        returnToSmartWallet,
      });

      // Refresh balances after successful sale
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["sailr-balances"] });
      }, 5000);

      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Transaction failed";
      setError(errorMsg);
      console.error("⚓ [Sailr] Sell execution error:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return { getQuote, executeSell, quote, loading, error, clearQuote };
}

// Hook for selling USDe
export function useSellUSDe() {
  const [quote, setQuote] = useState<USDeSellQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const getQuote = useCallback(async (usdeAmount: number): Promise<USDeSellQuote | null> => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem("token");
      if (!authToken) {
        setError("Please log in to continue");
        return null;
      }

      rift.setBearerToken(authToken);

      // Convert USDe to wei (18 decimals)
      const amountWei = ethers.parseUnits(usdeAmount.toString(), 18).toString();

      console.log("⚓ [Sailr] Getting USDe sell quote for:", usdeAmount, "USDe");

      const response = await (rift as any).sailr.getUSDeSellQuote(amountWei);

      if (!response.quote.canExecute) {
        setError(response.quote.warnings.join(", "));
        return null;
      }

      setQuote(response.quote);
      return response.quote;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to get quote";
      setError(errorMsg);
      console.error("⚓ [Sailr] USDe sell quote error:", errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeSell = useCallback(async (usdeAmount: number, returnToSmartWallet = true): Promise<TradeResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem("token");
      if (!authToken) {
        setError("Please log in to continue");
        return null;
      }

      rift.setBearerToken(authToken);

      const amountWei = ethers.parseUnits(usdeAmount.toString(), 18).toString();

      console.log("⚓ [Sailr] Executing USDe sell for:", usdeAmount, "USDe");

      const result = await (rift as any).sailr.sellUSDe({
        amount: amountWei,
        returnToSmartWallet,
      });

      // Refresh balances after successful sale
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["sailr-balances"] });
      }, 5000);

      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Transaction failed";
      setError(errorMsg);
      console.error("⚓ [Sailr] USDe sell execution error:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return { getQuote, executeSell, quote, loading, error, clearQuote };
}

