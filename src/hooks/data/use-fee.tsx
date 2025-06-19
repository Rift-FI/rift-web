import { getTokens } from "@/lib/assets/tokens";
import sphere from "@/lib/sphere";
import { useQuery } from "@tanstack/react-query";

interface FeeArgs {
  recipient: string;
  amount: string;
  token: string;
  chain: string;
}

async function getFee(args: FeeArgs) {
  const token = (
    await getTokens({
      id: args.token,
      chain: args.chain,
    })
  )?.at(0);

  if (!token) {
    return {
      amount: 0,
      token: "USDC",
    };
  }

  const transactionFee = await sphere.transactions.getFee({
    amount: args.amount,
    chain: args.chain as string,
    recipient: args.recipient as string,
    token: token.name as string,
  });

  return transactionFee;
}

export default function useFee(args: FeeArgs) {
  const transactionFeeQuery = useQuery({
    queryKey: [
      "transaction-fee",
      args.recipient,
      args.amount,
      args.token,
      args.chain,
    ],
    queryFn: () => getFee(args),
  });

  return transactionFeeQuery;
}
