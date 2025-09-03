import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router';

// Types based on backend documentation
interface WCRequest {
  id: string;
  method: string;
  params: unknown;
  chainId: string;
  dappName: string;
  dappUrl: string;
  dappIcon?: string;
  createdAt: number;
  expiresAt: number;
}

interface WCConnectionData {
  topic?: string;
  dappName?: string;
  dappUrl?: string;
  dappIcon?: string;
  chainId?: string;
  connectedAt?: number;
}

// New event payload types
interface NewRequestEvent {
  message: string;
  userId: string;
  data: WCRequest;
}

interface NewConnectionEvent {
  message: string;
  userId: string;
  data: WCConnectionData;
}

interface WalletConnectSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  pendingRequest: WCRequest | null;
  setPendingRequest: (request: WCRequest | null) => void;
}

const WalletConnectSocketContext = createContext<WalletConnectSocketContextType | null>(null);

export function useWalletConnectSocket() {
  const context = useContext(WalletConnectSocketContext);
  if (!context) {
    throw new Error('useWalletConnectSocket must be used within WalletConnectSocketProvider');
  }
  return context;
}

interface WalletConnectSocketProviderProps {
  children: ReactNode;
  userId?: string;
}

export function WalletConnectSocketProvider({ children, userId }: WalletConnectSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<WCRequest | null>(null);
  const queryClient = useQueryClient();
  const expirationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const location = useLocation();
  
  // Only show toasts when on WalletConnect page
  const showToasts = location.pathname.includes('/walletconnect');

  const handleNewRequest = useCallback((request: WCRequest) => {
    // Show the request modal immediately
    setPendingRequest(request);
    
    // Show toast notification only if on WalletConnect page
    if (showToasts) {
      toast.info(`New request from ${request.dappName}`, {
        description: `${request.method} - Tap to approve or reject`,
        duration: 5000,
      });
    }
    
    // Start expiration timer
    const timeLeft = request.expiresAt - Date.now();
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => {        
        // Close modal if this is the current request
        if (pendingRequest?.id === request.id) {
          setPendingRequest(null);
          if (showToasts) {
            toast.warning('Request expired');
          }
        }
        
        // Remove from timers map
        expirationTimers.current.delete(request.id);
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['walletconnect', 'requests'] });
      }, timeLeft);
      
      expirationTimers.current.set(request.id, timer);
    }
    
    // Refresh pending requests list
    queryClient.invalidateQueries({ queryKey: ['walletconnect', 'requests'] });
  }, [queryClient, pendingRequest, showToasts]);

  const handleNewConnection = useCallback((connectionData: WCConnectionData) => {
    // Show success notification only if on WalletConnect page
    if (showToasts) {
      toast.success('Successfully connected to dApp!', {
        description: connectionData.dappName ? `Connected to ${connectionData.dappName}` : 'Connection established',
        duration: 3000,
      });
    }
    
    // Refresh sessions list
    queryClient.invalidateQueries({ queryKey: ['walletconnect', 'sessions'] });
  }, [queryClient, showToasts]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    



    // Connect to Socket.IO server - production environment
    // For Telegram, we'll prioritize polling over websocket as Telegram may block WebSocket connections
    const socketInstance = io('https://stratosphere-network-tendermint-production.up.railway.app', {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // Prioritize polling for Telegram
      forceNew: true,
      timeout: 20000,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: false
    });

    // Connection handlers
    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (showToasts) {
        toast.success('WalletConnect service connected');
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      if (showToasts) {
        toast.error('WalletConnect service disconnected');
      }
    });

    socketInstance.on('connect_error', () => {
      if (showToasts) {
        toast.error('Failed to connect to WalletConnect service');
      }
    });

    socketInstance.on('reconnect', () => {
      if (showToasts) {
        toast.success('WalletConnect service reconnected');
      }
    });











    
    // Listen for both expected event formats (backend might use different naming)
    
    // NEW_REQUEST event - when dApp sends transaction/signing request
    socketInstance.on('NEW_REQUEST', (event: NewRequestEvent) => {
      // Filter by user ID
      if (event.userId === userId) {
        handleNewRequest(event.data);
      }
    });

    // Also listen for camelCase version
    socketInstance.on('NewRequest', (event: NewRequestEvent) => {
      // Filter by user ID
      if (event.userId === userId) {
        handleNewRequest(event.data);
      }
    });

    // NEW_CONNECTION event - when user successfully connects to dApp
    socketInstance.on('NEW_CONNECTION', (event: NewConnectionEvent) => {
      // Filter by user ID
      if (event.userId === userId) {
        handleNewConnection(event.data);
      }
    });

    // Also listen for camelCase version (which we can see is working)
    socketInstance.on('NewConnection', (event: NewConnectionEvent | WCConnectionData) => {
      // Try to handle even if structure is different
      if ((event as NewConnectionEvent).userId === userId || !(event as NewConnectionEvent).userId) {
        handleNewConnection(event as WCConnectionData);
      }
    });

    // Test connection and show debug info after 3 seconds
    setTimeout(() => {
      if (socketInstance.connected) {
        console.log('🧪 Testing Socket.IO connection...');
        console.log('🔌 Connected:', socketInstance.connected);
        console.log('📊 Socket ID:', socketInstance.id);
        console.log('🔧 Transport:', socketInstance.io.engine.transport.name);
        console.log('👤 User ID for filtering:', userId);
        
        // Test if we can emit events (optional - for debugging)
        socketInstance.emit('test-connection', { userId, timestamp: Date.now() });
        console.log('📤 Test event emitted');
      } else {
        console.error('❌ Socket.IO not connected after 3 seconds');
      }
    }, 3000);

    setSocket(socketInstance);

    return () => {
      // Clear all timers
      const timers = expirationTimers.current;
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
      
      socketInstance.disconnect();
    };
  }, [userId, handleNewRequest, handleNewConnection, showToasts]);



  const value: WalletConnectSocketContextType = {
    socket,
    isConnected,
    pendingRequest,
    setPendingRequest,
  };

  return (
    <WalletConnectSocketContext.Provider value={value}>
      {children}
    </WalletConnectSocketContext.Provider>
  );
}
