/**
 * New WalletConnect Event Handler
 * Implementation based on backend's simplified event system
 */

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface WCRequestData {
  id: string;
  requestId: string;
  sessionId: string;
  userId: string;
  userAddress: string;
  method: string;
  params: unknown[];
  chainId: string;
  dappName: string;
  dappUrl: string;
  dappIcon?: string;
  createdAt: number;
  expiresAt: number;
}

interface NewRequestEvent {
  message: string;
  userId: string;
  data: WCRequestData;
}

interface WCConnectionData {
  topic: string;
  dappName: string;
  dappUrl: string;
  dappIcon?: string;
  chainId: string;
  connectedAt: number;
}

interface NewConnectionEvent {
  message: string;
  userId: string;
  data: WCConnectionData;
}

interface WalletConnectEventHandlerProps {
  currentUserId: string | null;
  onNewRequest?: (request: WCRequestData) => void;
  onNewConnection?: (connectionData: WCConnectionData) => void;
}

export function WalletConnectEventHandler({ 
  currentUserId, 
  onNewRequest, 
  onNewConnection 
}: WalletConnectEventHandlerProps) {
  const [socket, setSocket] = useState<Socket | null>(null);

  const showApprovalPopup = useCallback((requestData: WCRequestData) => {
    // Call the parent handler
    if (onNewRequest) {
      onNewRequest(requestData);
    }
    
    // You can implement your approval popup UI here
    // For now, we'll use a simple toast with action buttons
    toast.info(`New ${requestData.method} request from ${requestData.dappName}`, {
      description: `${requestData.dappUrl} wants to perform a transaction`,
      duration: 10000,
      action: {
        label: 'View',
        onClick: () => {
          // Navigate to approval modal or show details
        },
      },
    });
  }, [onNewRequest]);

  const updateConnectionStatus = useCallback((connectionData: WCConnectionData) => {
    // Call the parent handler
    if (onNewConnection) {
      onNewConnection(connectionData);
    }
    
    toast.success('New dApp connection established!', {
      description: `Connected to ${connectionData.dappName || 'dApp'}`,
      duration: 5000,
    });
  }, [onNewConnection]);

  const handleNewRequest = useCallback((event: NewRequestEvent) => {
    if (event.userId === currentUserId) {
      showApprovalPopup(event.data);
    }
  }, [currentUserId, showApprovalPopup]);

  const handleNewConnection = useCallback((event: NewConnectionEvent) => {
    if (event.userId === currentUserId) {
      updateConnectionStatus(event.data);
    }
  }, [currentUserId, updateConnectionStatus]);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    // Connect to backend - production environment
    const socketInstance = io('https://stratosphere-network-tendermint-production.up.railway.app', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    // Basic connection handling
    socketInstance.on('connect', () => {
      // Connection established
    });

    socketInstance.on('disconnect', () => {
      // Connection lost
    });

    // WalletConnect events
    socketInstance.on('NEW_REQUEST', handleNewRequest);
    socketInstance.on('NEW_CONNECTION', handleNewConnection);



    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [currentUserId, handleNewRequest, handleNewConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [socket]);

  // Return the connection status to be used by parent component
  // The visual component is now integrated into the page header
  return null;
}

export default WalletConnectEventHandler;
