import { WalletToken } from "../entities"
import { SWAPPABLE } from "./chains"
//"USDC" | "USDT" | "ETH" | "BTC" | "WBERA" | "USDC.e" | "LSK" | "BNB" | "MATIC"

const tokens: Array<WalletToken> = [
  {
    "id": "ethereum",
    "name": "ETH",
    "description": "Ethereum",
    "enabled": true,
    "contract_address": null,
    "chain_id": "1",
    "icon": "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
    "backend_id": "ETHEREUM-ETH",
    is_base: true,
    is_native: true,
  },
  {
    "id": "ethereum",
    "name": "ETH",
    "description": "Ethereum",
    "enabled": true,
    "contract_address": null,
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
    "backend_id": "BASE-ETH",
    is_base: true,
    "onramp_id": "ETH"
  },
  {
    "id": "usd-coin",
    "name": "USDC",
    "description": "USDC",
    "enabled": true,
    "contract_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "chain_id": "1",
    "icon": "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    "backend_id": "ETHEREUM-USDC",
    is_base: true
  },
  {
    "id": "tether",
    "name": "USDT",
    "description": "Tether",
    "enabled": true,
    "contract_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "chain_id": "1",
    "icon": "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    "backend_id": "ETHEREUM-USDT",
    is_base: true
  },
  {
    "id": "matic-network",
    "name": "MATIC",
    "description": "Polygon",
    "enabled": true,
    "contract_address": null,
    "chain_id": "137",
    "icon": "https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233745",
    "backend_id": "POLYGON-MATIC",
    is_base: true,
    is_native: true
  },
  {
    "id": "weth",
    "name": "WETH",
    "description": "WETH",
    "enabled": true,
    "contract_address": "0x4200000000000000000000000000000000000006",
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/2518/large/weth.png?1696503332",
    "backend_id": "BASE-WETH"
  },
  {
    "id": "usd-coin",
    "name": "USDC",
    "description": "USDC",
    "enabled": true,
    "contract_address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    "backend_id": "BASE-USDC"
  },
  {
    "id": "tether",
    "name": "USDT",
    "description": "Tether",
    "enabled": true,
    "contract_address": "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    "backend_id": "BASE-USDT"
  },
  {
    "id": "dai",
    "name": "DAI",
    "description": "Dai",
    "enabled": true,
    "contract_address": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/9956/large/Badge_Dai.png?1696509996",
    "backend_id": "BASE-DAI"
  },
  {
    "id": "coinbase-wrapped-staked-eth",
    "name": "CBETH",
    "description": "Coinbase Wrapped Staked ETH",
    "enabled": true,
    "contract_address": "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/27008/large/cbeth.png?1709186989",
    "backend_id": "BASE-CBETH"
  },
  {
    "id": "arbitrum-bridged-wsteth-arbitrum",
    "name": "WSTETH",
    "description": "Arbitrum Bridged wstETH (Arbitrum)",
    "enabled": true,
    "contract_address": "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/53102/large/arbitrum-bridged-wsteth-arbitrum.webp?1735227527",
    "backend_id": "BASE-WSTETH"
  },
  {
    "id": "coinbase-wrapped-btc",
    "name": "CBBTC",
    "description": "Coinbase Wrapped BTC",
    "enabled": true,
    "contract_address": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/40143/large/cbbtc.webp?1726136727",
    "backend_id": "BASE-CBBTC"
  },
  {
    "id": "tbtc",
    "name": "TBTC",
    "description": "tBTC",
    "enabled": true,
    "contract_address": "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b",
    "chain_id": "8453",
    "icon": "https://coin-images.coingecko.com/coins/images/11224/large/0x18084fba666a33d37592fa2633fd49a74dd93a88.png?1696511155",
    "backend_id": "BASE-TBTC"
  },
  {
    "id": "lisk",
    "name": "LSK",
    "description": "Lisk",
    "enabled": true,
    "contract_address": null,
    "chain_id": "1135",
    "icon": "https://coin-images.coingecko.com/coins/images/385/large/Lisk_logo.png?1722338450",
    "backend_id": "LISK-LSK",
    is_native: true
  },
  {
    "id": "usd-coin",
    "name": "USDC",
    "description": "USDC",
    "enabled": true,
    "contract_address": "0xF242275d3a6527d877f2c927a82D9b057609cc71",
    "chain_id": "1135",
    "icon": "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    "backend_id": "LISK-USDC"
  },
  {
    "id": "tether",
    "name": "USDT",
    "description": "Tether",
    "enabled": true,
    "contract_address": "0x05D032ac25d322df992303dCa074EE7392C117b9",
    "chain_id": "1135",
    "icon": "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    "backend_id": "LISK-USDT"
  },
  {
    "id": "binancecoin",
    "name": "BNB",
    "description": "BNB",
    "enabled": true,
    "contract_address": null,
    "chain_id": "56",
    "icon": "https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970",
    "backend_id": "BNB-BNB",
    is_native: true
  },
  {
    "id": "usd-coin",
    "name": "USDC",
    "description": "USDC",
    "enabled": true,
    "contract_address": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    "chain_id": "56",
    "icon": "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    "backend_id": "BNB-USDC"
  },
  {
    "id": "tether",
    "name": "USDT",
    "description": "Tether",
    "enabled": true,
    "contract_address": "0x55d398326f99059fF775485246999027B3197955",
    "chain_id": "56",
    "icon": "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    "backend_id": "BNB-USDT"
  },
  {
    "id": "berachain-bera",
    "name": "BERA",
    "description": "Berachain",
    "enabled": true,
    "contract_address": null,
    "chain_id": "80085",
    "icon": "https://coin-images.coingecko.com/coins/images/25235/large/BERA.png?1738822008",
    "backend_id": "BERACHAIN-BERA",
    is_native: true
  },
  {
    "id": "wrapped-bera",
    "name": "WBERA",
    "description": "Wrapped Bera",
    "enabled": true,
    "contract_address": "0x6969696969696969696969696969696969696969",
    "chain_id": "80085",
    "icon": "https://coin-images.coingecko.com/coins/images/54219/large/BERA_%282%29.png?1738848488",
    "backend_id": "BERACHAIN-WBERA",
    "onramp_id": "WBERA"
  },
  {
    "id": "bob-network-bridged-usdce-bob-network",
    "name": "USDC.e",
    "description": "BOB Network Bridged USDC.E (BOB Network)",
    "enabled": true,
    "contract_address": "0x549943e04f40284185054145c6E4e9568C1D3241",
    "chain_id": "80085",
    "icon": "https://coin-images.coingecko.com/coins/images/51174/large/USDC.png?1730285236",
    "backend_id": "BERACHAIN-USDC.e",
    "onramp_id": "BERA-USDC"
  },
  {
    "id": "usd-coin",
    "name": "USDC",
    "description": "USDC",
    "enabled": true,
    "contract_address": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    "chain_id": "137",
    "icon": "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    "backend_id": "POLYGON-USDC",
    "onramp_id": "POL-USDC"
  },

  {
    "id": "weth",
    "name": "WETH",
    "description": "WETH",
    "enabled": true,
    "contract_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "chain_id": "1",
    "icon": "https://coin-images.coingecko.com/coins/images/2518/large/weth.png?1696503332",
    "backend_id": "ETHEREUM-WETH"
  },
  {
    "id": "dai",
    "name": "DAI",
    "description": "Dai",
    "enabled": true,
    "contract_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    "chain_id": "1",
    "icon": "https://coin-images.coingecko.com/coins/images/9956/large/Badge_Dai.png?1696509996",
    "backend_id": "ETHEREUM-DAI"
  },
  {
    "id": "arbitrum-bridged-wsteth-arbitrum",
    "name": "WSTETH",
    "description": "Arbitrum Bridged wstETH (Arbitrum)",
    "enabled": true,
    "contract_address": "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    "chain_id": "1",
    "icon": "https://coin-images.coingecko.com/coins/images/53102/large/arbitrum-bridged-wsteth-arbitrum.webp?1735227527",
    "backend_id": "ETHEREUM-WSTETH"
  },
  {
    "id": "rocket-pool-eth",
    "name": "RETH",
    "description": "Rocket Pool ETH",
    "enabled": true,
    "contract_address": "0xae78736Cd615f374D3085123A210448E74Fc6393",
    "chain_id": "1",
    "icon": "https://coin-images.coingecko.com/coins/images/20764/large/reth.png?1696520159",
    "backend_id": "ETHEREUM-RETH"
  },
  {
    "id": "arbitrum-bridged-wbtc-arbitrum-one",
    "name": "WBTC",
    "description": "Arbitrum Bridged WBTC (Arbitrum One)",
    "enabled": true,
    "contract_address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    "chain_id": "1",
    "icon": "https://coin-images.coingecko.com/coins/images/39532/large/wbtc.png?1722810336",
    "backend_id": "ETHEREUM-WBTC"
  },
  {
    "id": "ethereum",
    "name": "ETH",
    "description": "Ethereum",
    "enabled": true,
    "contract_address": null,
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
    "backend_id": "ARBITRUM-ETH"
  },
  {
    "id": "weth",
    "name": "WETH",
    "description": "WETH",
    "enabled": true,
    "contract_address": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/2518/large/weth.png?1696503332",
    "backend_id": "ARBITRUM-WETH"
  },
  {
    "id": "usd-coin",
    "name": "USDC",
    "description": "USDC",
    "enabled": true,
    "contract_address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    "backend_id": "ARBITRUM-USDC"
  },
  {
    "id": "tether",
    "name": "USDT",
    "description": "Tether",
    "enabled": true,
    "contract_address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    "backend_id": "ARBITRUM-USDT"
  },
  {
    "id": "dai",
    "name": "DAI",
    "description": "Dai",
    "enabled": true,
    "contract_address": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/9956/large/Badge_Dai.png?1696509996",
    "backend_id": "ARBITRUM-DAI"
  },
  {
    "id": "arbitrum-bridged-wsteth-arbitrum",
    "name": "WSTETH",
    "description": "Arbitrum Bridged wstETH (Arbitrum)",
    "enabled": true,
    "contract_address": "0x5979D7b546E38E414F7E9822514be443A4800529",
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/53102/large/arbitrum-bridged-wsteth-arbitrum.webp?1735227527",
    "backend_id": "ARBITRUM-WSTETH"
  },
  {
    "id": "rocket-pool-eth",
    "name": "RETH",
    "description": "Rocket Pool ETH",
    "enabled": true,
    "contract_address": "0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8",
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/20764/large/reth.png?1696520159",
    "backend_id": "ARBITRUM-RETH"
  },
  {
    "id": "arbitrum-bridged-wbtc-arbitrum-one",
    "name": "WBTC",
    "description": "Arbitrum Bridged WBTC (Arbitrum One)",
    "enabled": true,
    "contract_address": "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/39532/large/wbtc.png?1722810336",
    "backend_id": "ARBITRUM-WBTC"
  },
  {
    "id": "arbitrum",
    "name": "ARB",
    "description": "Arbitrum",
    "enabled": true,
    "contract_address": "0x912CE59144191C1204E64559FE8253a0e49E6548",
    "chain_id": "42161",
    "icon": "https://coin-images.coingecko.com/coins/images/16547/large/arb.jpg?1721358242",
    "backend_id": "ARBITRUM-ARB",
    is_native: true
  },
  {
    "id": "ethereum",
    "name": "ETH",
    "description": "Ethereum",
    "enabled": true,
    "contract_address": null,
    "chain_id": "10",
    "icon": "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
    "backend_id": "OPTIMISM-ETH"
  },
  {
    "id": "weth",
    "name": "WETH",
    "description": "WETH",
    "enabled": true,
    "contract_address": "0x4200000000000000000000000000000000000006",
    "chain_id": "10",
    "icon": "https://coin-images.coingecko.com/coins/images/2518/large/weth.png?1696503332",
    "backend_id": "OPTIMISM-WETH"
  },
  {
    "id": "usd-coin",
    "name": "USDC",
    "description": "USDC",
    "enabled": true,
    "contract_address": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "chain_id": "10",
    "icon": "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    "backend_id": "OPTIMISM-USDC"
  },
  {
    "id": "tether",
    "name": "USDT",
    "description": "Tether",
    "enabled": true,
    "contract_address": "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    "chain_id": "10",
    "icon": "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    "backend_id": "OPTIMISM-USDT"
  },
  {
    "id": "dai",
    "name": "DAI",
    "description": "Dai",
    "enabled": true,
    "contract_address": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    "chain_id": "10",
    "icon": "https://coin-images.coingecko.com/coins/images/9956/large/Badge_Dai.png?1696509996",
    "backend_id": "OPTIMISM-DAI"
  },
  {
    "id": "arbitrum-bridged-wsteth-arbitrum",
    "name": "WSTETH",
    "description": "Arbitrum Bridged wstETH (Arbitrum)",
    "enabled": true,
    "contract_address": "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb",
    "chain_id": "10",
    "icon": "https://coin-images.coingecko.com/coins/images/53102/large/arbitrum-bridged-wsteth-arbitrum.webp?1735227527",
    "backend_id": "OPTIMISM-WSTETH"
  },
  {
    "id": "arbitrum-bridged-wbtc-arbitrum-one",
    "name": "WBTC",
    "description": "Arbitrum Bridged WBTC (Arbitrum One)",
    "enabled": true,
    "contract_address": "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    "chain_id": "10",
    "icon": "https://coin-images.coingecko.com/coins/images/39532/large/wbtc.png?1722810336",
    "backend_id": "OPTIMISM-WBTC"
  },
  {
    "id": "optimism",
    "name": "OP",
    "description": "Optimism",
    "enabled": true,
    "contract_address": "0x4200000000000000000000000000000000000042",
    "chain_id": "10",
    "icon": "https://coin-images.coingecko.com/coins/images/25244/large/Optimism.png?1696524385",
    "backend_id": "OPTIMISM-OP",
    is_native: true
  }
]

interface Args {
  name?: string,
  id?: string
  filter?: boolean
  list?: Array<string>,
  base?: boolean,
  chain?: string,
  description?: string,
  swappable?: boolean,
  backend_id?: string
}
export async function getTokens(args?: Args) {
  if (!args) return tokens;

  let filteredTokens = tokens;

  if (args.swappable) {
    filteredTokens = filteredTokens?.filter(t => SWAPPABLE.includes(t.chain_id))
  }

  // Apply chain filter first if specified
  if (args.chain) {
    filteredTokens = filteredTokens.filter(t => t.chain_id === args.chain);
  }

  // Apply base filter
  if (args.base && !args.list) {
    return filteredTokens.filter(t => t.is_base);
  }

  // Apply list filter
  if (args.list) {
    return filteredTokens.filter(t => (t.backend_id && args.list?.includes(t.backend_id)) || (args.base && t.is_base));
  }

  // Apply id/name filters
  if (args.id || args.name) {
    return filteredTokens.filter(t => {
      if (args.id) return t.id == args.id;
      if (args.backend_id) return t.backend_id == args.backend_id;
      if (args.name) return t.name.toLowerCase().trim().includes(args.name.toLowerCase().trim());
      if (args.description) return t.description.toLowerCase().trim().includes(args.description.toLowerCase().trim());
      return false;
    });
  }

  return filteredTokens;
}