import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface SupportedToken {
  id: string;
  name: string;
  chain_id: string;
  chain_name: string;
  contract_address?: string;
  description?: string;
  enabled?: boolean;
}

export default function useSupportedTokens() {
  return useQuery({
    queryKey: ["supported-tokens"],
    queryFn: async (): Promise<SupportedToken[]> => {
      const authToken = localStorage.getItem("token");
      if (authToken) rift.setBearerToken(authToken);

      const response = await rift.assets.getAllTokens();
      const tokens = response?.data ?? [];

      return tokens.map((t: any) => ({
        id: t.id,
        name: t.name,
        chain_id: t.chain_id,
        chain_name: t.id.split("-")[0],
        contract_address: t.contract_address,
        description: t.description,
        enabled: t.enabled,
      }));
    },
    staleTime: 60_000,
  });
}
