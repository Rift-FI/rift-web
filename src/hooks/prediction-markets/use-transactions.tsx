import { useState } from "react";
import { parseEther, formatEther } from "ethers";
import { useQueryClient } from "@tanstack/react-query";
import sphere from "../../lib/sphere";
import { transactionsApi } from "../../lib/prediction-market";
import { ChainName } from "@stratosphere-network/wallet";

// Transaction data is provided by the backend API, no manual encoding needed

// Custom error class for actionable errors
export class ActionableError extends Error {
  action?: {
    type: "navigate";
    path: string;
    label: string;
  };

  constructor(message: string, action?: ActionableError["action"]) {
    super(message);
    this.name = "ActionableError";
    this.action = action;
  }
}

// Contract addresses (from deployments.json)
const TOKEN_ADDRESS = "0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8"; // rETH token address
const PREDICTION_CONTRACT_ADDRESS =
  "0x38a5c384d7033cabc9b9368beef58190dc82e4fd"; // YieldMark proxy address

// Chain configuration - contracts are on Arbitrum
const CHAIN: ChainName = "ARBITRUM";

interface TransactionHookReturn {
  execute: () => Promise<string>;
  isLoading: boolean;
  error: string | null;
  actionableError: ActionableError | null;
}

// Note: Manual encoding functions removed since we get transaction data from backend API

// Hook for handling complete transaction flow with allowance checking
export const useTransaction = (
  operation:
    | "stake"
    | "claim"
    | "create-listing"
    | "purchase-listing"
    | "early-exit"
    | "claim-payout",
  params: {
    marketId?: string;
    position?: "YES" | "NO";
    amount?: string;
    listingId?: string;
    askPrice?: string;
    duration?: string;
  }
): TransactionHookReturn => {
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionableError, setActionableError] =
    useState<ActionableError | null>(null);

  const execute = async (): Promise<string> => {
    if (!sphere.auth.isAuthenticated()) {
      throw new Error("Wallet not authenticated");
    }

    setIsLoading(true);
    setError(null);
    setActionableError(null);

    try {
      // Get wallet instance for the chain
      console.log("🔍 Getting wallet instance...");
      const walletResponse = await sphere.proxyWallet.getWalletInstance({
        chain: CHAIN,
      });

      const userAddress = walletResponse.address;
      console.log("👤 User address:", userAddress);

      // For operations that require tokens, check balances first
      if (
        (operation === "stake" || operation === "purchase-listing") &&
        params.amount
      ) {
        // Check ETH balance for gas fees using Sphere SDK
        console.log("🔍 Checking ETH balance for gas fees...");
        try {
          const ethBalanceResponse = await sphere.wallet.getChainBalance({
            chain: CHAIN,
          });

          // Find ETH balance from the response
          const ethBalance = ethBalanceResponse.data?.find(
            (balance) =>
              balance.token === "ETH" && balance.chainName === "ARBITRUM"
          );

          const ethAmount = ethBalance?.amount || 0;
          console.log("💰 ETH balance:", ethAmount);

          // Minimum 0.001 ETH required for gas fees
          if (ethAmount < 0.0001) {
            throw new Error(
              `Insufficient ETH for gas fees. You have ${ethAmount.toFixed(
                4
              )} ETH but need at least 0.001 ETH. Please get more ETH on Arbitrum.`
            );
          }
          console.log(`✅ ETH balance sufficient: ${ethAmount.toFixed(4)} ETH`);
        } catch (ethError: any) {
          if (ethError.message.includes("Insufficient ETH")) {
            throw ethError;
          }
          console.warn("⚠️ Could not check ETH balance, proceeding anyway");
        }

        // Check token balance for betting using Sphere SDK
        console.log("🔍 Checking token balance...");
        try {
          // Try to get token balance - we'll check all balances since rETH might not be in TokenSymbol enum
          const tokenBalanceResponse = await sphere.wallet.getChainBalance({
            chain: CHAIN,
          });

          // Look for rETH token by contract address or symbol
          const rethBalance = tokenBalanceResponse.data?.find(
            (balance) =>
              balance.token.toLowerCase().includes("reth") ||
              balance.token === "RETH" ||
              balance.chainName === "ARBITRUM"
          );

          const tokenAmount = rethBalance?.amount || 0;
          const requiredAmount = parseFloat(params.amount);
          console.log("💰 rETH balance:", tokenAmount);
          console.log("💰 required amount:", requiredAmount);

          if (tokenAmount < requiredAmount) {
            throw new ActionableError(
              `Insufficient rETH balance. You have ${tokenAmount.toFixed(
                4
              )} rETH but need ${requiredAmount} rETH.`,
              {
                type: "navigate",
                path: "/app/swap",
                label: "Get rETH",
              }
            );
          }
          console.log(
            `✅ rETH balance sufficient: ${tokenAmount.toFixed(4)} rETH`
          );
        } catch (tokenError: any) {
          if (tokenError.message.includes("Insufficient rETH")) {
            throw tokenError;
          }
          console.warn("⚠️ Could not check token balance, proceeding anyway");
        }

        // Check allowance and approve if needed
        console.log("🔍 Checking token allowance via API...");

        try {
          // Check current allowance via backend API
          const allowanceResponse = await transactionsApi.getAllowance(
            userAddress
          );
          console.log("📊 Allowance check response:", allowanceResponse.data);

          // The response contains transaction data if approval is needed
          if (allowanceResponse.data.data) {
            console.log(
              "❌ Insufficient allowance, requesting approval transaction..."
            );

            // Get approval transaction data from backend
            const approvalResponse =
              await transactionsApi.getApproveTransaction(
                userAddress,
                params.amount!
              );

            const approvalTxData = approvalResponse.data.data;
            console.log("📝 Sending approval transaction:", approvalTxData);

            // Send approval transaction via Sphere SDK
            const approveResponse = await sphere.proxyWallet.sendTransaction({
              chain: CHAIN,
              transactionData: {
                to: approvalTxData.to,
                data: approvalTxData.data,
                value: approvalTxData.value,
                gasLimit: approvalTxData.gasLimit,
                maxFeePerGas: approvalTxData.maxFeePerGas,
                maxPriorityFeePerGas: approvalTxData.maxPriorityFeePerGas,
                nonce: approvalTxData.nonce,
                chainId: approvalTxData.chainId,
              },
            });

            console.log("✅ Approval confirmed:", approveResponse.hash);
          } else {
            console.log("✅ Sufficient allowance already exists");
          }
        } catch (allowanceError) {
          console.error(
            "❌ Allowance check or approval failed:",
            allowanceError
          );
          throw new Error(`Allowance check/approval failed: ${allowanceError}`);
        }
      }

      // Generate main transaction through backend
      console.log(`🔍 Generating ${operation} transaction...`);
      let txResponse;

      switch (operation) {
        case "stake": {
          // Use new place-bet endpoint
          const prediction = params.position === "YES";
          txResponse = await transactionsApi.getPlaceBetTransaction(
            params.marketId!,
            userAddress,
            params.amount!,
            prediction
          );
          break;
        }
        case "claim":
          txResponse = await transactionsApi.getClaimTransaction(
            params.marketId!
          );
          break;
        case "create-listing":
          txResponse = await transactionsApi.getCreateListingTransaction(
            params.marketId!,
            userAddress,
            params.askPrice!,
            params.duration!
          );
          break;
        case "purchase-listing":
          txResponse = await transactionsApi.getPurchaseListingTransaction(
            params.listingId!,
            userAddress
          );
          break;
        case "early-exit":
          txResponse = await transactionsApi.getEarlyExitTransaction(
            params.marketId!,
            userAddress
          );
          break;
        case "claim-payout":
          txResponse = await transactionsApi.getClaimPayoutTransaction(
            params.marketId!,
            userAddress
          );
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      const txData = txResponse.data.data || txResponse.data;
      console.log(`📦 Generated transaction data:`, txData);

      console.log(`🔐 Sending ${operation} transaction through Sphere SDK...`);

      // Send transaction using Sphere's proxy wallet with proper data handling
      const finalTxResponse = await sphere.proxyWallet.sendTransaction({
        chain: CHAIN,
        transactionData: {
          to: txData.to,
          data: txData.data,
          value: txData.value,
          gasLimit: txData.gasLimit,
          maxFeePerGas: txData.maxFeePerGas,
          maxPriorityFeePerGas: txData.maxPriorityFeePerGas,
          nonce: txData.nonce,
          chainId: txData.chainId,
        },
      });

      const finalTxHash = finalTxResponse.hash;
      console.log(`✅ ${operation} transaction successful:`, finalTxHash);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["p2p-listings"] });

      return finalTxHash;
    } catch (err: any) {
      console.error(`❌ ${operation} transaction failed:`, err);

      // Handle ActionableError first
      if (err instanceof ActionableError) {
        setError(err.message);
        setActionableError(err);
        throw err;
      }

      let errorMessage = "Transaction failed";

      // Handle Sphere SDK 500 errors (usually gas-related)
      if (err.response?.status === 500 || err.status === 500) {
        errorMessage =
          "Insufficient ETH for gas fees. Please check your ETH balance on Arbitrum and get more ETH to pay for transaction fees.";
      }
      // Handle insufficient balance errors we threw earlier
      else if (
        err.message?.includes("Insufficient ETH") ||
        err.message?.includes("Insufficient rETH")
      ) {
        errorMessage = err.message;
      }
      // Handle allowance/approval errors
      else if (
        err.message?.includes("allowance") ||
        err.message?.includes("approval")
      ) {
        errorMessage = "Token approval failed. Please try again.";
      }
      // Handle network/connectivity errors
      else if (
        err.message?.includes("network") ||
        err.message?.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }
      // Handle transaction reverted errors
      else if (
        err.message?.includes("reverted") ||
        err.message?.includes("execution reverted")
      ) {
        errorMessage =
          "Transaction failed on blockchain. Please check your rETH balance and try again.";
      }
      // Default to the original error message if available
      else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      console.error(`💥 Error message: ${errorMessage}`);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error, actionableError };
};

// Specific hooks for common operations
export const useStakeTransaction = (
  marketId: string,
  position: "YES" | "NO",
  amount: string
) => useTransaction("stake", { marketId, position, amount });

export const useClaimTransaction = (marketId: string) =>
  useTransaction("claim", { marketId });

export const useCreateListingTransaction = (
  marketId: string,
  askPrice: string,
  duration: string
) => useTransaction("create-listing", { marketId, askPrice, duration });

export const usePurchaseListingTransaction = (listingId: string) =>
  useTransaction("purchase-listing", { listingId });

export const useEarlyExitTransaction = (marketId: string) =>
  useTransaction("early-exit", { marketId });

export const useClaimPayoutTransaction = (marketId: string) =>
  useTransaction("claim-payout", { marketId });

// Hook for checking allowance via backend API
export const useAllowance = () => {
  const [allowance, setAllowance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const checkAllowance = async () => {
    if (!sphere.auth.isAuthenticated()) return 0;

    setIsLoading(true);
    try {
      // Get wallet instance
      const walletResponse = await sphere.proxyWallet.getWalletInstance({
        chain: CHAIN,
      });

      // Check allowance via backend API
      const allowanceResponse = await transactionsApi.getAllowance(
        walletResponse.address
      );

      // If response contains transaction data, it means approval is needed (allowance is insufficient)
      // If no transaction data, allowance is sufficient
      const allowanceValue = allowanceResponse.data.data ? 0 : 1;
      setAllowance(allowanceValue);
      return allowanceValue;
    } catch (error) {
      console.error("Failed to check allowance:", error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  return { allowance, checkAllowance, isLoading };
};

// Hook for checking token balance using Sphere SDK
export const useTokenBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const checkBalance = async () => {
    if (!sphere.auth.isAuthenticated()) return 0;

    setIsLoading(true);
    try {
      // Get token balances using Sphere SDK
      const balanceResponse = await sphere.wallet.getChainBalance({
        chain: CHAIN,
      });

      // Look for rETH token balance
      const rethBalance = balanceResponse.data?.find(
        (balance) =>
          balance.token.toLowerCase().includes("reth") ||
          balance.token === "rETH" ||
          balance.chainName === "ARBITRUM"
      );

      const balanceValue = rethBalance?.amount || 0;
      setBalance(balanceValue);
      return balanceValue;
    } catch (error) {
      console.error("Failed to check balance:", error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  return { balance, checkBalance, isLoading };
};
