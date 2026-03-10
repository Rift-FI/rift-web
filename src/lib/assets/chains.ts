import { WalletChain } from "../entities";

export const SWAPPABLE = ["42161"];

const chains: Array<WalletChain> = [
  {
    id: "ethereum",
    description: "Ethereum",
    enabled: true,
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    name: "ETH",
    backend_id: "ETHEREUM",
    chain_id: "1",
  },
  {
    id: "optimism",
    description: "Optimism",
    enabled: true,
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
    name: "OP",
    backend_id: "OPTIMISM",
    chain_id: "10",
  },
  {
    id: "bnb",
    name: "BNB",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
    description: "BNB",
    enabled: true,
    backend_id: "BNB",
    chain_id: "56",
  },
  {
    id: "matic-network",
    description: "Polygon",
    name: "Matic",
    enabled: true,
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
    backend_id: "POLYGON",
    chain_id: "137",
  },
  {
    id: "celo",
    name: "CELO",
    icon: "https://coin-images.coingecko.com/coins/images/11090/small/InjsGnYN_400x400.jpg",
    description: "Celo",
    enabled: true,
    backend_id: "CELO",
    chain_id: "42220",
  },
  {
    id: "lisk",
    name: "LISK",
    icon: "https://coin-images.coingecko.com/coins/images/385/small/Lisk_logo.png",
    description: "LISK",
    enabled: true,
    backend_id: "LISK",
    chain_id: "1135",
  },
  {
    id: "arbitrum",
    description: "Arbitrum",
    enabled: true,
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    name: "ARB",
    backend_id: "ARBITRUM",
    chain_id: "42161",
  },
  {
    id: "base",
    name: "BASE",
    description: "Base",
    enabled: true,
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
    backend_id: "BASE",
    chain_id: "8453",
  },
  {
    id: "berachain-bera",
    name: "BERACHAIN",
    icon: "https://coin-images.coingecko.com/coins/images/25235/small/BERA.png",
    description: "Berachain",
    enabled: true,
    backend_id: "BERACHAIN",
    chain_id: "80085",
  },
];

export async function getChains(id?: string, swappable?: boolean) {
  if (!id) return chains;
  if (swappable == true)
    return SWAPPABLE.map((c) => chains.find((chain) => chain.id == c)!);
  return (
    chains?.find(
      (c) => c.chain_id == id || c.name === id || c.backend_id === id
    ) ?? null
  );
}
