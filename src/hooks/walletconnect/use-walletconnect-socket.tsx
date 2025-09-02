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

    // Connect to Socket.IO server - production environment
    const socketInstance = io('https://stratosphere-network-tendermint-production.up.railway.app', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    // Connection handlers
    socketInstance.on('connect', () => {
      setIsConnected(true);
      toast.success('WalletConnect service connected');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      toast.error('WalletConnect service disconnected');
    });

    // Debug: Listen to all events for development
    socketInstance.onAny((eventName, ...args) => {
      // Only log WalletConnect-related events in development
      if (import.meta.env.DEV && (eventName.toLowerCase().includes('request') || 
          eventName.toLowerCase().includes('connection') ||
          eventName.toLowerCase().includes('wallet'))) {
        console.log('📡 WalletConnect Event:', eventName, args[0]);
      }
    });

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
