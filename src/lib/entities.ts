import { ReactNode } from "react"

export interface WalletIconProps {
    className: string
}

export interface WalletChain {
    id: string,
    name: string, 
    description: string,
    icon: string,
    enabled: boolean,
    backend_id?: string
    chain_id?: string
}

export interface WalletToken {
    id: string,
    name: string,
    description: string,
    enabled: boolean,
    contract_address: string | null,
    chain_id: string,
    icon: string,
    backend_id?: string,
    is_base?: boolean
}

export interface Balance {
    amount: number,
    usd?: number,
    /**chain_id can optionally be set to all, this will indicate there's no need to show chain in the balance component */
    chain: string | "all",
    token: string
    balances?: Array<Balance>
}

export interface WalletSocialProfile {
    username?: string
}

export interface WalletAddress {
    address: string
    chain?: string
    type: 'address' | 'telegram-username' | 'name-service'
    social_profile?: WalletSocialProfile
}