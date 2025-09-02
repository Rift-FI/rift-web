import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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

  useEffect(() => {
    if (!userId) {
      return;
    }

    console.log('🔌 Socket.IO: Connecting for user:', userId);
    console.log('🌍 Environment: Telegram Mini App');
    console.log('🔗 User Agent:', navigator.userAgent);

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

    // Connection handlers with detailed Telegram debugging
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Socket.IO: Connected successfully');
      console.log('🔧 Transport:', socketInstance.io.engine.transport.name);
      console.log('📊 Socket ID:', socketInstance.id);
      toast.success('WalletConnect service connected');
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('❌ Socket.IO: Disconnected -', reason);
      toast.error('WalletConnect service disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🚨 Socket.IO: Connection error -', error);
      console.log('🔍 Error details:', error.message, (error as any).type);
      toast.error('Failed to connect to WalletConnect service');
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO: Reconnected after', attemptNumber, 'attempts');
      toast.success('WalletConnect service reconnected');
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('🔄❌ Socket.IO: Reconnection failed -', error);
    });

    // Debug: Listen to all events for development
    socketInstance.onAny((eventName, ...args) => {
      console.log('📡 ALL Events (Telegram Debug):', eventName, args);
      
      // Only log WalletConnect-related events in development
      if (import.meta.env.DEV && (eventName.toLowerCase().includes('request') || 
          eventName.toLowerCase().includes('connection') ||
          eventName.toLowerCase().includes('wallet'))) {
        console.log('📡 WalletConnect Event:', eventName, args[0]);
      }
    });

    // Test connection after 3 seconds
    setTimeout(() => {
      if (socketInstance.connected) {
        console.log('🧪 Testing Socket.IO connection...');
        console.log('🔌 Connected:', socketInstance.connected);
        console.log('📊 Socket ID:', socketInstance.id);
        console.log('🔧 Transport:', socketInstance.io.engine.transport.name);
        console.log('👤 User ID for filtering:', userId);
        
        // Test if we can emit events (optional - for debugging)
        socketInstance.emit('test-connection', { userId, timestamp: Date.now() });
      } else {
        console.error('❌ Socket.IO not connected after 3 seconds');
      }
    }, 3000);

               // Catch-all listener for debugging in development
    if (import.meta.env.DEV) {
      socketInstance.on('*', (...args) => {
        console.log('🔍 Unknown Event:', args);
      });
    }
    
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

    setSocket(socketInstance);

    return () => {
      // Clear all timers
      expirationTimers.current.forEach(timer => clearTimeout(timer));
      expirationTimers.current.clear();
      
      socketInstance.disconnect();
    };
  }, [userId]);

  const handleNewRequest = (request: WCRequest) => {

    // Show the request modal immediately
    setPendingRequest(request);
    
    // Show toast notification
    toast.info(`New request from ${request.dappName}`, {
      description: `${request.method} - Tap to approve or reject`,
      duration: 5000,
    });
    
    // Start expiration timer
    startExpirationTimer(request.id, request.expiresAt);
    
    // Refresh pending requests list
    queryClient.invalidateQueries({ queryKey: ['walletconnect', 'requests'] });
  };

  const handleNewConnection = (connectionData: WCConnectionData) => {
    console.log('🔗 Processing new WalletConnect connection:', connectionData);
    
    // Show success notification
    toast.success('Successfully connected to dApp!', {
      description: connectionData.dappName ? `Connected to ${connectionData.dappName}` : 'Connection established',
      duration: 3000,
    });
    
    // Refresh sessions list
    queryClient.invalidateQueries({ queryKey: ['walletconnect', 'sessions'] });
  };

  // Legacy event handlers removed - new system only uses NEW_REQUEST and NEW_CONNECTION events
  // Request approval/rejection feedback is now handled through API responses, not socket events

  const startExpirationTimer = (requestId: string, expiresAt: number) => {
    const timeLeft = expiresAt - Date.now();
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => {        
        // Close modal if this is the current request
        if (pendingRequest?.id === requestId) {
          setPendingRequest(null);
          toast.warning('Request expired');
        }
        
        // Remove from timers map
        expirationTimers.current.delete(requestId);
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['walletconnect', 'requests'] });
      }, timeLeft);
      
      expirationTimers.current.set(requestId, timer);
    }
  };

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
