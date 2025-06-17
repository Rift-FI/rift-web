import React, { createContext, useContext, ReactNode } from "react";

interface TokenContextState {
  tokenName: string;
  tokenId: string;
  chain: string,
  closeAndReset: () => void;
}

interface TokenContextProviderProps {
  children: ReactNode;
  tokenName: string;
  tokenId: string;
  chain: string;
  onClose: () => void;
}

const TokenContext = createContext<TokenContextState | null>(null);

export function useToken() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used within a TokenContextProvider");
  }
  return context;
}

export default function TokenContextProvider({
  children,
  tokenName,
  tokenId,
  chain,
  onClose,
}: TokenContextProviderProps) {
  const closeAndReset = () => {
    onClose();
  };

  const value: TokenContextState = {
    tokenName,
    tokenId,
    chain,
    closeAndReset,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}
