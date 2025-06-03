import USDCLogo from "../assets/images/logos/usdc.png"
import { WalletChain, WalletToken } from "./entities"

export const WALLET_CHAINS: Array<WalletChain> = [
    {
        id: '8453',
        description: '',
        name: 'Base Network',
        enabled: true,
        icon: 'https://github.com/base/brand-kit/blob/main/logo/in-product/Base_Network_Logo.png?raw=true'
    }
]


export const WALLET_TOKENS: Array<WalletToken> = [
    {
        id: 'usdc',
        name: "USDC",
        description: "USDC description",
        enabled: true,
        contract_address: "0x543322",
        // TODO: switch to using svgs
        icon: 'https://res.cloudinary.com/db7gfp5kb/image/upload/f_auto,q_auto/v1/dev-stuff/iyht8pqacfhu3emntlkr',
        chain_id: '8453'
    }
]