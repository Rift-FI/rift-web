import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
    console.log("Sending token approval using Sphere proxy wallet...");
    
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

    console.log("Approval transaction details:", {
      tokenAddress,
      spenderAddress,
      chainName,
      data: data.slice(0, 20) + "..." // Truncate for readability
    });

    const result = await (rift as any).proxyWallet.sendTransaction({
      chain: chainName,
      transactionData: approvalTx,
    });

    console.log("Token approval successful:", result.hash);
    
    toast.custom(() => <RenderSuccessToast message="Token approval successful!" />, {
      position: "top-center",
      duration: 2000,
    });

  } catch (error) {
    console.error("Token approval failed:", error);
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
      chain: chainName,
    }); 
    const nativeBalance = nativeBalanceData.data?.[0]?.amount || 0;

    if (nativeBalance * DECIMALS < Number(estimatedGasCost)) {
      console.log("Insufficient native balance for gas fees", nativeBalance, estimatedGasCost);
      toast.custom(() => <RenderErrorToast message="Insufficient native balance for gas fees" />, {
        position: "top-center",
        duration: 3000,
      });
      return false;
    }else{
      console.log("Sufficient native balance for gas fees", nativeBalance, estimatedGasCost);
      toast.custom(() => <RenderSuccessToast message="Sufficient native balance for gas fees" />, {
        position: "top-center",
        duration: 3000,
      });
      console.log("Checking native balance for gas fees...");
    console.log("Wallet address:", walletAddress);
    console.log("Estimated gas cost:", estimatedGasCost);
    console.log("Provider URL:", walletInstance.provider.url);
    
    return true;
    }

    
    
  } catch (error) {
    console.error("Balance check failed:", error);
    return false;
  }
}

export default function useLifiTransaction() {
  const { mutate: executeTransaction, isPending: isExecuting } = useMutation({
    mutationFn: async (args: LifiTransactionArgs) => {
      if (import.meta.env.VITE_TEST === "true") {
        // Simulate transaction for testing
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { hash: "0x1234567890abcdef", success: true };
      }

      try {
        const chainName = getChainName(args.transaction.chainId);
        
        console.log("Getting wallet instance...");
        const walletInstance = await (rift as any).proxyWallet.getWalletInstance({
          chain: chainName,
        });
        
        if (!walletInstance) {
          throw new Error("Failed to get wallet instance");
        }

        console.log("Wallet instance retrieved:", walletInstance.address);

        const estimatedGasCost = (BigInt(args.transaction.gasLimit) * BigInt(args.transaction.gasPrice || args.transaction.maxFeePerGas || "20000000000")).toString();
        const hasBalance = await checkNativeBalance(chainName, walletInstance.address, estimatedGasCost);
        
        if (!hasBalance) {
          throw new Error("Insufficient native token balance for gas fees");
        }

        // Check if token approval is needed
        if (args.approvalAddress && args.tokenAddress && args.amount) {
          console.log("Approval required for:", {
            tokenAddress: args.tokenAddress,
            spenderAddress: args.approvalAddress,
            amount: args.amount
          });
          
          try {
            console.log("Handling token approval...");
            await handleTokenApproval(
              chainName,
              args.tokenAddress,
              args.approvalAddress,
            );
          } catch (approvalError) {
            console.log("Token approval failed, attempting transfer anyway:", approvalError);
          }
        } else {
          console.log("No token approval needed - proceeding directly to transfer");
        }

        console.log("Executing LiFi transaction...");
        
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

        console.log("LiFi transaction successful:", result.hash);
        return { hash: result.hash, success: true };
        
      } catch (error) {
        console.error('LiFi transaction execution error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.custom(() => <RenderSuccessToast message="Cross-chain transfer initiated successfully!" />, {
        position: "top-center",
        duration: 3000,
      });
      console.log('LiFi transaction successful:', data.hash);
    },
    onError: (error) => {
      console.error('LiFi transaction error:', error);
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