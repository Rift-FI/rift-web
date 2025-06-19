import { getChains } from "@/lib/assets/chains";
import { WalletChain } from "@/lib/entities";
import sphere from "@/lib/sphere";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { uniq } from "lodash";

async function aggregateBalancesUsd(): Promise<number> {
  const allChains = (await getChains()) as Array<WalletChain>;

  const chainBalances = await sphere.wallet.getChainBalance();

  let aggregatedIds = allChains.map((token) => token.id);
  aggregatedIds = uniq(aggregatedIds);

  const response = await axios.get<Record<string, { usd: number }>>(
    "https://pro-api.coingecko.com/api/v3/simple/price",
    {
      params: {
        ids: aggregatedIds,
        vs_currencies: "usd",
      },
      headers: {
        "x-cg-pro-api-key": "CG-Whw1meTdSTTT7CSpGZbaB3Yi",
      },
    }
  );

  const geckoUSDPricing = response?.data;

  const total_amount_in_usd = chainBalances?.data?.reduce((agg, chain) => {
    const chain_data = allChains?.find(
      (c) => c?.backend_id == chain?.chainName
    );
    if (!chain_data) return 0 + agg;
    const usd_pricing = geckoUSDPricing[chain_data?.id];
    if (!usd_pricing) return 0 + agg;
    return agg + usd_pricing?.usd * chain?.amount;
  }, 0);

  return total_amount_in_usd as number;
}

export default function useChainsBalance() {
  const query = useQuery({
    queryKey: ["chains-balances"],
    queryFn: aggregateBalancesUsd,
  });

  return query;
}
