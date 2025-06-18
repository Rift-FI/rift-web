import { useMemo } from "react";
import { useReceiveCrypto } from "../context";
import { TokenSketleton } from "@/v2/pages/home/components/TokenSketleton";
import TokenRenderer from "@/features/send/components/token-renderer";
import { WalletToken } from "@stratosphere-network/wallet";
import useTokens from "@/hooks/data/use-tokens";
import { SearchIcon } from "lucide-react";

export default function RequestToken() {
  const { switchRequestStep, state } = useReceiveCrypto();
  const ownedTokensQuery = useTokens({});
  const searchFilter = state?.watch("searchfilter");

  const TOKENS = useMemo(() => {
    if (!searchFilter) return ownedTokensQuery?.data ?? [];
    if ((searchFilter?.trim().length ?? 0) == 0)
      return ownedTokensQuery?.data ?? [];
    const filtered = ownedTokensQuery?.data?.filter((token) =>
      token.name
        .toLocaleLowerCase()
        .includes(searchFilter.trim().toLocaleLowerCase())
    );
    return filtered ?? [];
  }, [
    searchFilter,
    ownedTokensQuery?.isLoading,
    ownedTokensQuery?.data?.length,
  ]);

  const handleTokenClick = (token: WalletToken) => {
    state?.setValue("requestToken", token.id);
    state?.setValue("requestTokenChain", token.chain_id);
    switchRequestStep("amount-input");
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Request Crypto</h2>
        <p className="text-muted-foreground">
          Choose a token to request via a Sphere link
        </p>
      </div>

      <div className="w-full flex flex-row items-center gap-x-2 bg-secondary rounded-lg px-3 py-3">
        <SearchIcon className="text-muted-foreground" size={18} />
        <input
          className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1"
          placeholder="Search for a token"
          onChange={(e) => state?.setValue("searchfilter", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {ownedTokensQuery?.isFetching ? (
          <>
            <TokenSketleton />
            <TokenSketleton />
            <TokenSketleton />
          </>
        ) : TOKENS?.length > 0 ? (
          TOKENS.map((token) => (
            <TokenRenderer
              token={token}
              key={`${token.backend_id}-${token.id}-${token.chain_id}`}
              onClick={handleTokenClick}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tokens found</p>
          </div>
        )}
      </div>
    </div>
  );
}
