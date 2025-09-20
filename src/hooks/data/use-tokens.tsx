import { useQuery } from "@tanstack/react-query";
import { getTokens } from "@/lib/assets/tokens";
import rift from "@/lib/rift";

interface TokenArgs {
  chain?: string;
  search?: string;
  swappable?: boolean;
}

async function _getTokens(args: TokenArgs) {
  const response = await rift.assets.getAllTokens();
  const token_list = response?.data?.map((d) => d.id);
  const tokens = await getTokens();
  return tokens;
}

export default function useTokens(args: TokenArgs) {
  const query = useQuery({
    queryKey: ["get-tokens", args.chain, args.search, args.swappable],
    queryFn: async () => {
      return _getTokens(args);
    },
  });

  return query;
}
