import { useMemo } from 'react';
import useWalletAuth from '../wallet/use-wallet-auth';
import { usePlatformDetection } from '../../utils/platform';

export function useWalletConnectUserId() {
  const { userQuery } = useWalletAuth();
  const { isTelegram, telegramUser } = usePlatformDetection();

  const userId = useMemo(() => {


    // Skip detection while loading
    if (userQuery.isLoading) {
      return null;
    }

    // Use database user ID (consistent across platforms and matches backend)
    if (userQuery.data?.id) {
      const id = userQuery.data.id;

      return id;
    }
    
    // Fallback to Telegram ID only if no database ID
    if (isTelegram && telegramUser?.id) {
      const id = telegramUser.id.toString();

      return id;
    }
    
    if (userQuery.data?.externalId) {
      const id = userQuery.data.externalId;

      return id;
    }
    
    if (userQuery.data?.email) {
      const id = userQuery.data.email;

      return id;
    }
    
    // Fallback to phone number (like analytics does)
    if (userQuery.data?.phoneNumber) {
      const id = userQuery.data.phoneNumber;

      return id;
    }
    

    return null;
  }, [isTelegram, telegramUser?.id, userQuery.data, userQuery.isLoading]);

  return {
    userId,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userId,
  };
}
