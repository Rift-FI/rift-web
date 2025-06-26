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
    // Only show tokens when user starts typing
    if (!searchFilter || (searchFilter?.trim().length ?? 0) == 0) return [];

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
    <div className="h-fit max-h-[40vh] space-y-4">
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
        {!searchFilter || searchFilter.trim().length === 0 ? (
          <div className="text-center py-8">
            <div className="space-y-2">
              <p className="text-muted-foreground text-lg">
                Start typing to search for tokens
              </p>
              <p className="text-muted-foreground text-sm">
                Enter a token name to see your available tokens
              </p>
            </div>
          </div>
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
            <p className="text-muted-foreground">
              No tokens found matching "{searchFilter}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
