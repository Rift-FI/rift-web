import { getChains } from "@/lib/assets/chains";
import { useQuery } from "@tanstack/react-query";

async function getWalletChains() {
  return await getChains();
}

export default function useChains() {
  const query = useQuery({
    queryKey: ["chains"],
    queryFn: async () => {
      return getWalletChains();
    },
  });

  return query;
}
