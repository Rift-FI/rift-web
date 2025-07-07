import { useMemo } from "react";
import { CgSpinner } from "react-icons/cg";

import useOwnedTokens from "@/hooks/data/use-owned-tokens";
import { WalletToken } from "@/lib/entities";
import { useFlow } from "../known/flow-context";
import TokenRenderer from "./token-renderer";

interface Props {
  searchFilter?: string;
}

export default function ChooseToken(props: Props) {
  const { searchFilter } = props;
  const flowControl = useFlow();
  const ownedTokensQuery = useOwnedTokens();

  const tokens = useMemo(() => {
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

  function handleSelect(token: WalletToken) {
    flowControl.state?.setValue("token", token.id);
    flowControl.state?.setValue("chain", token.chain_id);
    flowControl.goToNext();
  }

  if (ownedTokensQuery?.isLoading) {
    return (
      <div className="flex flex-row items-center justify-center w-full h-full">
        <CgSpinner className="animate-spin text-accent-primary" />
      </div>
    );
  }

  // Show empty state when no search filter
  if (!searchFilter || searchFilter.trim().length === 0) {
    return (
      <div className="flex flex-col w-full h-[80vh] items-center justify-center py-8">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-lg">
            Start typing to search for tokens
          </p>
          <p className="text-muted-foreground text-sm">
            Enter a token name to see your available tokens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[80vh] items-center py-4 gap-y-2 overflow-y-scroll">
      {tokens?.length > 0 ? (
        tokens.map((token) => {
          return (
            <TokenRenderer
              token={token}
              key={`${token.backend_id}-${token.id}-${token.chain_id}`}
              onClick={handleSelect}
            />
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">
            No tokens found matching "{searchFilter}"
          </p>
        </div>
      )}
    </div>
  );
}
