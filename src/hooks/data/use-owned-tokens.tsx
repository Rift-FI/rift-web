import { getTokens } from "@/lib/assets/tokens";
import sphere from "@/lib/sphere";
import { useQuery } from "@tanstack/react-query";

interface Args {
  is_swappable?: boolean;
}

async function getOwnedTokens(args?: Args) {
  const chainsResponse = await sphere.assets.getUserTokens();
  const token_list = chainsResponse.data?.map((c) => c.id) ?? [];
  const actual_tokens = await getTokens({
    base: true,
    list: token_list,
    swappable: args?.is_swappable,
  });
  return actual_tokens;
}

export default function useOwnedTokens(swappable?: boolean) {
  const query = useQuery({
    queryKey: ["owned-tokens"],
    queryFn: async () => {
      return getOwnedTokens({
        is_swappable: swappable,
      });
    },
  });

  return query;
}

export function useSearchOwnedTokens(args: { search: string }) {
  const query = useOwnedTokens();

  const searchQuery = useQuery({
    queryKey: [
      "search-owned-tokens",
      args.search,
      query.isLoading,
      query?.data?.length,
    ],
    queryFn: async () => {
      const data = query.data ?? [];
      if (args.search?.trim()?.length == 0) return data;
      return data?.filter((token) => {
        if (
          token.name
            .toLocaleLowerCase()
            .includes(args.search?.toLowerCase().trim())
        )
          return true;
        if (
          token.description
            .toLocaleLowerCase()
            .includes(args.search?.toLowerCase().trim())
        )
          return true;
        return false;
      });
    },
  });

  return searchQuery;
}
