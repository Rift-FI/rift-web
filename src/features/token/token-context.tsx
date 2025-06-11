import React, { createContext, useContext, ReactNode } from "react";

interface TokenContextState {
  tokenId: string;
  closeAndReset: () => void;
}

interface TokenContextProviderProps {
  children: ReactNode;
  tokenId: string;
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
  tokenId,
  onClose,
}: TokenContextProviderProps) {
  const closeAndReset = () => {
    onClose();
  };

  const value: TokenContextState = {
    tokenId,
    closeAndReset,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}
