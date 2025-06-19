import { useQuery } from "@tanstack/react-query";

export async function getSupportedChains(): Promise<Array<string> | "ALL"> {
  return ["42161"];
}

export default function useSwapSupport() {
  const supportedChainsQuery = useQuery({
    queryKey: ["supported-chains"],
    queryFn: getSupportedChains,
  });

  return supportedChainsQuery;
}
