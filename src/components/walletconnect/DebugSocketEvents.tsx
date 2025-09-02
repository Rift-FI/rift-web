import { useEffect } from 'react';
import { useWalletConnectSocket } from '@/hooks/walletconnect/use-walletconnect-socket';
import { useWalletConnectUserId } from '@/hooks/walletconnect/use-walletconnect-user';

export function DebugSocketEvents() {
  const { socket, isConnected } = useWalletConnectSocket();
  const { userId } = useWalletConnectUserId();

  useEffect(() => {
    if (!socket || !userId) return;

    console.log('🔌 Debug: Setting up Socket.IO event listeners for user:', userId);

    // Listen to all events for debugging
    socket.onAny((eventName, ...args) => {
      console.log('📡 Socket.IO Event:', eventName, args);
    });

    // Test connection
    socket.on('connect', () => {
      console.log('✅ Socket.IO Connected!');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO Disconnected!');
    });

    return () => {
      socket.offAny();
    };
  }, [socket, userId]);

  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
      <div>Socket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      <div>User: {userId || 'No user ID'}</div>
    </div>
  );
}
