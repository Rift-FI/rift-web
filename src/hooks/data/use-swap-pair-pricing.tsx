import { useQuery } from "@tanstack/react-query";

interface SwapPairArgs {
  from_token: string;
  from_chain: string;
  to_token: string;
  to_chain: string;
}

async function getSwapPairPricing(args: SwapPairArgs) {
  // TODO: setup backend connection point for calculation
  return {
    price: 1.2,
  };
}

export default function useSwapPairPricing(args: SwapPairArgs) {
  const { from_chain, from_token, to_chain, to_token } = args;

  const swapPairPricingQuery = useQuery({
    queryKey: ["swap-pair-pricing", from_token, from_chain, to_token, to_chain],
    queryFn: () => getSwapPairPricing(args),
  });

  return swapPairPricingQuery;
}
