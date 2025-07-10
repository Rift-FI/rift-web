import { useQuery } from "@tanstack/react-query";
import useGeckoPrice from "./use-gecko-price";

interface SwapPairArgs {
  from_token: string;
  from_chain: string;
  to_token: string;
  to_chain: string;
}

// async function getSwapPairPricing(args: SwapPairArgs) {
//   // TODO: setup backend connection point for calculation
//   return {
//     price: 1.2,
//   };
// }

export default function useSwapPairPricing(args: SwapPairArgs) {
  const { from_chain, from_token, to_chain, to_token } = args;
  const { convertedAmount: SELL_TOKEN_PRICE } = useGeckoPrice({
    base: "usd",
    token: from_token,
    amount: 1,
  });
  const { convertedAmount: BUY_TOKEN_PRICE } = useGeckoPrice({
    base: "usd",
    token: to_token,
    amount: 1,
  });

  // const swapPairPricingQuery = useQuery({
  //   queryKey: ["swap-pair-pricing", from_token, from_chain, to_token, to_chain],
  //   queryFn: () => getSwapPairPricing(args),
  // });

  return { SELL_TOKEN_PRICE, BUY_TOKEN_PRICE };
}
