import { getChains } from "@/lib/assets/chains";
import { getTokens } from "@/lib/assets/tokens";
import { WalletChain } from "@/lib/entities";
import sphere from "@/lib/sphere";
import { useMutation } from "@tanstack/react-query";

export interface SendTransactionArgs {
  recipient: string;
  amount: string;
  token: string;
  chain: string;
}

export interface TransactionResult {
  hash: string;
  timestamp: number;
}

async function commitTransaction(
  args: SendTransactionArgs
): Promise<TransactionResult> {
  const token = (
    await getTokens({
      id: args.token,
      chain: args.chain,
    })
  )?.at(0);

  if (!token) throw new Error("Token not found");

  const chain = (await getChains(args.chain)) as WalletChain | null;

  if (!chain) throw new Error("Chain not found");

  const response = await sphere.transactions.send({
    chain: chain.backend_id as any,
    token: token.name as any,
    to: args.recipient,
    value: args.amount,
    type: "gasless",
  });

  return {
    hash: response.transactionHash,
    timestamp: Date.now(),
  };
}

export default function useSendTranaction() {
  const sendTransactionMutation = useMutation({
    mutationFn: async (args: SendTransactionArgs) => {
      return commitTransaction(args);
    },
  });

  return {
    sendTransactionMutation,
  };
}
