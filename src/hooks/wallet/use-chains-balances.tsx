import { getChains } from "@/lib/assets/chains";
import { getTokens } from "@/lib/assets/tokens";
import { WalletChain } from "@/lib/entities";
import sphere from "@/lib/sphere";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { uniq } from "lodash";

async function aggregateBalancesUsd(): Promise<number> {
  try {
    // Ensure sphere has the auth token
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      return 0;
    }

    // Set the bearer token on sphere instance
    sphere.setBearerToken(authToken);

    // 1. Get user's owned tokens
    const userTokensResponse = await sphere.assets.getUserTokens();
    const userTokenIds = userTokensResponse.data?.map((c) => c.id) ?? [];

    if (userTokenIds.length === 0) {
      return 0;
    }

    // 2. Get token details for owned tokens
    const ownedTokens = await getTokens({
      base: true,
      list: userTokenIds,
    });

    if (!ownedTokens || ownedTokens.length === 0) {
      return 0;
    }

    // 3. Get unique CoinGecko IDs for price fetching
    let tokenIds = ownedTokens.map((token) => token.id);
    tokenIds = uniq(tokenIds);

    // 4. Fetch USD prices from CoinGecko
    const response = await axios.get<Record<string, { usd: number }>>(
      "https://pro-api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: tokenIds,
          vs_currencies: "usd",
        },
        headers: {
          "x-cg-pro-api-key": "CG-Whw1meTdSTTT7CSpGZbaB3Yi",
        },
      }
    );

    const geckoUSDPricing = response?.data;

    // 5. Calculate total value by getting balance for each token
    let totalValue = 0;

    for (const token of ownedTokens) {
      try {
        // Get the chain data
        const chain = (await getChains(token.chain_id)) as WalletChain | null;
        if (!chain) {
          continue;
        }

        // Get token balance
        const balanceResponse = await sphere.wallet.getTokenBalance({
          token: token.name as any,
          chain: chain.backend_id as any,
        });

        const balance = balanceResponse?.data?.at(0);

        if (!balance || balance.amount === 0) {
          continue;
        }

        // Get USD price
        const usdPrice = geckoUSDPricing[token.id]?.usd;

        if (!usdPrice) {
          continue;
        }

        const tokenValue = balance.amount * usdPrice;
        totalValue += tokenValue;
      } catch (error) {
        continue;
      }
    }

    return totalValue;
  } catch (error) {
    return 0;
  }
}

export default function useChainsBalance() {
  const query = useQuery({
    queryKey: ["chains-balances"],
    queryFn: aggregateBalancesUsd,
  });

  return query;
}
