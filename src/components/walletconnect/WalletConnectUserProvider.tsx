import { ReactNode } from "react";

interface WalletConnectUserProviderProps {
  children: ReactNode;
}

// Simplified — no more WebSocket connection needed.
// Backend auto-signs all transactions from connected DApps.
export function WalletConnectUserProvider({
  children,
}: WalletConnectUserProviderProps) {
  return <>{children}</>;
}
