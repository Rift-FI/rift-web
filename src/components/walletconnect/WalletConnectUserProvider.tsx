import { ReactNode } from 'react';
import { WalletConnectSocketProvider } from '../../hooks/walletconnect/use-walletconnect-socket';
import { useWalletConnectUserId } from '../../hooks/walletconnect/use-walletconnect-user';

interface WalletConnectUserProviderProps {
  children: ReactNode;
}

function WalletConnectProviderInner({ children }: WalletConnectUserProviderProps) {
  const { userId } = useWalletConnectUserId();

  return (
    <WalletConnectSocketProvider userId={userId || undefined}>
      {children}
    </WalletConnectSocketProvider>
  );
}

export function WalletConnectUserProvider({ children }: WalletConnectUserProviderProps) {
  return (
    <WalletConnectProviderInner>
      {children}
    </WalletConnectProviderInner>
  );
}
