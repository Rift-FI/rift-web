import { useMemo } from 'react';
import useWalletAuth from '../wallet/use-wallet-auth';
import { usePlatformDetection } from '../../utils/platform';

export function useWalletConnectUserId() {
  const { userQuery } = useWalletAuth();
  const { isTelegram, telegramUser } = usePlatformDetection();

  const userId = useMemo(() => {
    // Don't log when still loading to reduce noise
    if (!userQuery.isLoading) {
      console.log('🔍 User ID Detection:', {
        isTelegram,
        telegramUser,
        userQueryData: userQuery.data,
        userQueryLoading: userQuery.isLoading,
        userQueryError: userQuery.error
      });
    }

    // Skip detection while loading
    if (userQuery.isLoading) {
      return null;
    }

    if (isTelegram && telegramUser?.id) {
      const id = telegramUser.id.toString();
      console.log('✅ Using Telegram ID:', id);
      return id;
    }
    
    // Try user.id first (most unique)
    if (userQuery.data?.id) {
      const id = userQuery.data.id;
      console.log('✅ Using user ID:', id);
      return id;
    }
    
    if (userQuery.data?.externalId) {
      const id = userQuery.data.externalId;
      console.log('✅ Using externalId:', id);
      return id;
    }
    
    if (userQuery.data?.email) {
      const id = userQuery.data.email;
      console.log('✅ Using email:', id);
      return id;
    }
    
    // Fallback to phone number (like analytics does)
    if (userQuery.data?.phoneNumber) {
      const id = userQuery.data.phoneNumber;
      console.log('✅ Using phoneNumber:', id);
      return id;
    }
    
    console.log('❌ No user ID found');
    return null;
  }, [isTelegram, telegramUser?.id, userQuery.data?.externalId, userQuery.data?.email, userQuery.data, userQuery.isLoading, userQuery.error]);

  return {
    userId,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userId,
  };
}
