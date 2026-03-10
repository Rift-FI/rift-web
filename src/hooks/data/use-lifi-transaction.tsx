import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import posthog from "posthog-js";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import RenderSuccessToast from "@/components/ui/helpers/render-success-toast";
import rift from "@/lib/rift";
const DECIMALS = 1e18;

type SupportedChainName = "BASE" | "POLYGON" | "ARBITRUM" | "BERACHAIN";
const getChainName = (chainId: number): SupportedChainName => {
  switch (chainId) {
    case 8453: return "BASE";
    case 137: return "POLYGON";  
    case 42161: return "ARBITRUM";
    case 80085: return "BERACHAIN";
    default: throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

interface LifiTransactionArgs {
  transaction: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    chainId: number;
  };
  fromAddress: string;
  approvalAddress?: string;
  tokenAddress?: string;
  amount?: string;
}



async function handleTokenApproval(
  chainName: SupportedChainName,
  tokenAddress: string,
  spenderAddress: string,
): Promise<void> {
  try {
    
    
    // ERC-20 approve function: approve(address spender, uint256 amount)
    const approveSelector = "0x095ea7b3";
    
    // Use maximum approval to avoid future approvals
    const maxApproval = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    
    // Encode function call data
    const paddedSpender = spenderAddress.slice(2).padStart(64, "0");
    const paddedAmount = maxApproval.slice(2).padStart(64, "0");
    const data = `${approveSelector}${paddedSpender}${paddedAmount}`;
    
    const approvalTx = {
      to: tokenAddress,
      value: "0",
      data: data,
      gasLimit: "100000",
      gasPrice: "2000000000", // 2 Gwei
      chainId: chainName === "BASE" ? 8453 : 
               chainName === "POLYGON" ? 137 : 
               chainName === "ARBITRUM" ? 42161 : 80085,
      type: 0, // Legacy transaction
    };

    const result = await (rift as any).proxyWallet.sendTransaction({
      chain: chainName,
      transactionData: approvalTx,
    });

    
    
    toast.custom(() => <RenderSuccessToast message="Token approval successful!" />, {
      position: "top-center",
      duration: 2000,
    });

  } catch (error) {
    
    toast.custom(() => <RenderErrorToast message="Token approval failed" />, {
      position: "top-center",
      duration: 3000,
    });
    throw error;
  }
}

async function checkNativeBalance(
  chainName: SupportedChainName,
  walletAddress: string,
  estimatedGasCost: string,
): Promise<boolean> {
  try {
    const walletInstance = await (rift as any).proxyWallet.getWalletInstance({
      chain: chainName,
    });
    
    if (!walletInstance) {
      throw new Error("Failed to get wallet instance for balance check");
    }

    // TODO: Implement actual native balance checking
    const nativeBalanceData = await rift.wallet.getTokenBalance({
      token: "ETH",
      chain: chainName as any,
    }); 
    const nativeBalance = nativeBalanceData.data?.[0]?.amount || 0;

    if (nativeBalance * DECIMALS < Number(estimatedGasCost)) {
      
      toast.custom(() => <RenderErrorToast message="Insufficient native balance for gas fees" />, {
        position: "top-center",
        duration: 3000,
      });
      return false;
    }else{
      
      toast.custom(() => <RenderSuccessToast message="Sufficient native balance for gas fees" />, {
        position: "top-center",
        duration: 3000,
      });
      
    
    
    
    
    return true;
    }

    
    
  } catch (error) {
    
    return false;
  }
}

export default function useLifiTransaction() {
  const queryClient = useQueryClient();
  const { mutate: executeTransaction, isPending: isExecuting } = useMutation({
    mutationFn: async (args: LifiTransactionArgs) => {
      if (import.meta.env.VITE_TEST === "true") {
        // Simulate transaction for testing
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { hash: "0x1234567890abcdef", success: true };
      }

      try {
        const chainName = getChainName(args.transaction.chainId);
        
        
        const walletInstance = await (rift as any).proxyWallet.getWalletInstance({
          chain: chainName,
        });
        
        if (!walletInstance) {
          throw new Error("Failed to get wallet instance");
        }

        

        const estimatedGasCost = (BigInt(args.transaction.gasLimit) * BigInt(args.transaction.gasPrice || args.transaction.maxFeePerGas || "20000000000")).toString();
        const hasBalance = await checkNativeBalance(chainName, walletInstance.address, estimatedGasCost);
        
        if (!hasBalance) {
          throw new Error("Insufficient native token balance for gas fees");
        }

        // Check if token approval is needed
        if (args.approvalAddress && args.tokenAddress && args.amount) {
          try {
            await handleTokenApproval(
              chainName,
              args.tokenAddress,
              args.approvalAddress,
            );
          } catch {
            // Approval failed, continue anyway
          }
        }

        
        
        // Use Sphere proxy wallet for the LiFi transfer (this was working)
        const result = await (rift as any).proxyWallet.sendTransaction({
          chain: chainName,
          transactionData: {
            to: args.transaction.to,
            data: args.transaction.data,
            value: args.transaction.value,
            gasLimit: args.transaction.gasLimit,
            gasPrice: args.transaction.gasPrice,
            maxFeePerGas: args.transaction.maxFeePerGas,
            maxPriorityFeePerGas: args.transaction.maxPriorityFeePerGas,
            chainId: args.transaction.chainId,
            type: args.transaction.maxFeePerGas ? 2 : 0,
          },
        });

        
        return { hash: result.hash, success: true };
        
      } catch (error) {
        
        throw error;
      }
    },
    onSuccess: () => {
      posthog.capture("SWAP_COMPLETED");
      toast.custom(() => <RenderSuccessToast message="Cross-chain transfer initiated successfully!" />, {
        position: "top-center",
        duration: 3000,
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["base-usdc-balance"] });
        queryClient.invalidateQueries({ queryKey: ["sailr-balances"] });
        queryClient.invalidateQueries({ queryKey: ["chains-balances"] });
      }, 3000);
    },
    onError: (error) => {
      posthog.capture("SWAP_FAILED", { error: error.message });

      let errorMessage = "Transfer failed";

      if (error.message.includes("Insufficient")) {
        errorMessage = "Insufficient balance for gas fees";
      } else if (error.message.includes("approval")) {
        errorMessage = "Token approval failed";
      } else if (error.message.includes("Unsupported chain")) {
        errorMessage = "Unsupported blockchain network";
      }

      toast.custom(() => <RenderErrorToast message={errorMessage} />, {
        position: "top-center",
        duration: 4000,
      });
    }
  });

  return {
    executeTransaction,
    isExecuting,
  };
}