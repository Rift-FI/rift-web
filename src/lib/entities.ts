import { ReactNode } from "react";

export interface WalletIconProps {
  className: string;
}

export interface WalletChain {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  backend_id?: string;
  chain_id?: string;
}

export interface WalletToken {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  contract_address: string | null;
  chain_id: string;
  icon: string;
  backend_id?: string;
  is_base?: boolean;
  is_native?: boolean;
  onramp_id?: string;
}

export interface Balance {
  amount: number;
  usd?: number;
  chain: string | "all";
  token: string;
  balances?: Array<Balance>;
}

export interface WalletSocialProfile {
  username?: string;
}

export interface WalletAddress {
  address: string;
  type: "telegram-username" | "email" | "externalId";
  social_profile?: WalletSocialProfile;
  displayName?: string;
}

export interface Transaction {
  amount: number;
  chain: string;
  createdAt: string;
  currency: null | string;
  token: string;
  id: string;
  recipientAddress: string;
  transactionHash: string;
  userId: string;
}
