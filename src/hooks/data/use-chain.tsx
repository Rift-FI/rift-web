import { getChains } from "@/lib/assets/chains";
import { WalletChain } from "@/lib/entities";
import { useQuery } from "@tanstack/react-query";

interface ChainArgs {
  id: string;
}

async function getWalletChain(args: ChainArgs) {
  const chain = (await getChains(args.id)) as WalletChain | null;
  return chain;
}

export default function useChain(args: ChainArgs) {
  const { id } = args;

  const query = useQuery({
    queryKey: ["chain", args.id],
    queryFn: async () => {
      return getWalletChain(args);
    },
  });

  return query;
}
