import { useQuery } from "@tanstack/react-query";

interface SwapFeeArgs {
  from_token: string;
  from_chain: string;
  to_token: string;
  to_chain: string;
}

async function getSwapFee(args: SwapFeeArgs) {
  // TODO: connect to backend connection point
  return {
    fee: 0.03, // fee in base token
  };
}

export default function useSwapFee(args: SwapFeeArgs) {
  const swapFeeQuery = useQuery({
    queryKey: [args.from_token, args.from_chain, args.to_token, args.to_chain],
    queryFn: () => getSwapFee(args),
  });

  return swapFeeQuery;
}
