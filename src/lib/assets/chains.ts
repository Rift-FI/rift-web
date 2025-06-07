import { WalletChain } from "../entities";


const chains: Array<WalletChain> = [
    {
        id: "base",
        name: "BASE",
        description: "Base Network",
        enabled: true,
        icon: "https://github.com/trustwallet/assets/blob/master/blockchains/base/info/logo.png?raw=true",
        backend_id: "BASE",
        chain_id: "8453"
    },
    {
        id: "lisk",
        name: "LISK",
        icon: "https://coin-images.coingecko.com/coins/images/385/large/Lisk_logo.png?1722338450",
        description: "LISK",
        enabled: true,
        backend_id: "LISK",
        chain_id: "1135"
    },
    {
        id: "bnb",
        name: "BNB",
        icon: "https://github.com/trustwallet/assets/blob/master/blockchains/binance/info/logo.png?raw=true",
        description: "BNB Beacon Chain",
        enabled: true,
        backend_id: "BNB",
        chain_id: "56"
    },
    {
        id: "berachain-bera",
        name: "BERACHAIN",
        icon: "https://coin-images.coingecko.com/coins/images/25235/large/BERA.png?1738822008",
        description: "Berachain",
        enabled: true,
        backend_id: "BERACHAIN",
        chain_id: "80085"
    },
    {
        id: "matic-network",
        description: "Polygon",
        name: "Matic",
        enabled: true,
        icon: "https://github.com/trustwallet/assets/blob/master/blockchains/polygon/info/logo.png?raw=true",
        backend_id: "POLYGON",
        chain_id: "137"
    },
    {
        id: "ethereum",
        description: "Ethereum",
        enabled: true,
        icon: "https://github.com/trustwallet/assets/blob/master/blockchains/ethereum/info/logo.png?raw=true",
        name: "ETH",
        backend_id: "ETHEREUM",
        chain_id: "1"
    },
    {
        id: "arbitrum",
        description: "Arbitrum",
        enabled: true,
        icon: "https://github.com/trustwallet/assets/blob/master/blockchains/arbitrum/info/logo.png?raw=true",
        name: "ARB",
        backend_id: "ARBITRUM",
        chain_id: "42161"
    },
    {
        id: "optimism",
        description: "OPTIMISM",
        enabled: true,
        icon: "https://github.com/trustwallet/assets/blob/master/blockchains/optimism/info/logo.png?raw=true",
        name: "OP",
        backend_id: "OPTIMISM",
        chain_id: "10"
    }
]

export async function getChains(id?: string){
    if(!id) return chains;
    return chains?.find(c => c.chain_id == id) ?? null
}