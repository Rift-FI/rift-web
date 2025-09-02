/**
 * WalletConnect Core API Integration
 * Handles all WalletConnect backend communication
 */

export interface ActiveSession {
  topic: string;
  dAppName: string;
  dAppUrl: string;
  dAppIcon: string;
  connectedAt: number;
  chains: string[];
}

export interface TransactionRequest {
  id: string;
  method: string;
  params: unknown;
  chainId: string;
  dappName: string;
  dappUrl: string;
  dappIcon?: string;
  createdAt: number;
  expiresAt: number;
  // Legacy fields for backwards compatibility
  dAppName?: string;
  estimatedGas?: string;
  estimatedFee?: string;
}

export interface WCConnectionResult {
  success: boolean;
  userAddress?: string;
  error?: string;
}

export interface WCApprovalResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface WCStatus {
  running: boolean;
  sessions: number;
}

// API Configuration - Always use production for WalletConnect
const API_BASE = 'https://stratosphere-network-tendermint-production.up.railway.app';
const WC_BASE = `${API_BASE}/walletconnect`;



// Get API key from environment
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_SDK_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_SDK_API_KEY is required for WalletConnect operations');
  }
  return apiKey;
};

// Get headers with auth token only (for status, start, stop endpoints)
const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// Get headers with both auth token and API key (for most WalletConnect endpoints)
const getHeadersWithApiKey = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'x-api-key': getApiKey(),
});



/**
 * Service Management
 */

export async function checkWCStatus(): Promise<WCStatus> {
  try {
    const response = await fetch(`${WC_BASE}/status`);
    const data = await response.json();
    
    return {
      running: data.data.running,
      sessions: data.data.client.activeSessions
    };
  } catch (error) {
    console.error('Failed to check WC status:', error);
    return { running: false, sessions: 0 };
  }
}

export async function startWCService(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/start`, {
      method: 'POST',
      headers: getAuthHeaders(token) // No API key needed for start
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to start WC service:', error);
    return false;
  }
}

export async function stopWCService(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/stop`, {
      method: 'POST',
      headers: getAuthHeaders(token) // No API key needed for stop
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to stop WC service:', error);
    return false;
  }
}

/**
 * Pairing Management  
 */

export async function createWCPairing(token: string): Promise<string> {
  try {
    const response = await fetch(`${WC_BASE}/create-pairing`, {
      method: 'POST',
      headers: getHeadersWithApiKey(token) // API key required
    });
    
    const data = await response.json();
    return data.data?.uri || '';
  } catch (error) {
    console.error('Failed to create WC pairing:', error);
    return '';
  }
}

/**
 * Connection Management
 */

export async function connectToDApp(uri: string, token: string): Promise<WCConnectionResult> {
  try {
    const response = await fetch(`${WC_BASE}/connect-to-dapp`, {
      method: 'POST',
      headers: getHeadersWithApiKey(token), // API key required
      body: JSON.stringify({ uri })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        userAddress: data.userAddress
      };
    } else {
      return {
        success: false,
        error: data.error
      };
    }
  } catch {
    return {
      success: false,
      error: 'Network error'
    };
  }
}

export async function getActiveSessions(token: string): Promise<ActiveSession[]> {
  try {
    const response = await fetch(`${WC_BASE}/persistent-sessions`, {
      headers: getHeadersWithApiKey(token) // API key required
    });
    if (!response.ok) {
      return [];
    }
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return [];
    }
    
    // Backend returns sessions directly in the sessions array, not in data.data
    const sessionsArray = data.sessions || data.data || [];
    
    if (!Array.isArray(sessionsArray)) {
      return [];
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedSessions = sessionsArray.map((session: any) => {
      return {
        topic: session.topic,
        dAppName: session.dappName || session.peer?.metadata?.name || 'Unknown dApp',
        dAppUrl: session.dappUrl || session.peer?.metadata?.url || '',
        dAppIcon: session.dappIcon || session.peer?.metadata?.icons?.[0] || '',
        connectedAt: session.connectedAt || Date.now(),
        chains: session.chains || session.namespaces?.eip155?.accounts?.map((acc: string) => acc.split(':')[1]) || []
      };
    });
    
    return transformedSessions;
  } catch {
    return [];
  }
}

export async function disconnectSession(topic: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/sessions/${topic}`, {
      method: 'DELETE',
      headers: getHeadersWithApiKey(token) // API key required
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to disconnect session:', error);
    return false;
  }
}

/**
 * Request Management
 */

export async function getPendingRequests(token: string): Promise<TransactionRequest[]> {
  try {
    const response = await fetch(`${WC_BASE}/requests/pending`, {
      headers: getHeadersWithApiKey(token) // API key required
    });
    
    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error('Failed to get pending requests:', error);
    return [];
  }
}

export async function approveRequest(requestId: string, token: string): Promise<WCApprovalResult> {
  try {
    const response = await fetch(`${WC_BASE}/requests/${requestId}/approve`, {
      method: 'POST',
      headers: getHeadersWithApiKey(token) // API key required
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        txHash: data.result?.hash
      };
    } else {
      return {
        success: false,
        error: data.error
      };
    }
  } catch  {
    return {
      success: false,
      error: 'Network error'
    };
  }
}

export async function rejectRequest(requestId: string, reason: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/requests/${requestId}/reject`, {
      method: 'POST',
      headers: getHeadersWithApiKey(token), // API key required
      body: JSON.stringify({ reason })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to reject request:', error);
    return false;
  }
}

export async function getAllRequests(
  token: string, 
  limit: number = 10, 
  offset: number = 0, 
  status?: string
): Promise<{ requests: TransactionRequest[]; total: number; hasMore: boolean }> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }
    
    const response = await fetch(`${WC_BASE}/requests?${params}`, {
      headers: getHeadersWithApiKey(token) // API key required
    });
    
    const data = await response.json();
    
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requests: (data.requests || []).map((req: any) => ({
        id: req.id,
        method: req.method,
        params: req.params,
        chainId: req.chainId,
        dAppName: req.dAppName || 'Unknown dApp',
        estimatedGas: req.estimatedGas,
        estimatedFee: req.estimatedFee
      })),
      total: data.total || 0,
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error('Failed to get all requests:', error);
    return {
      requests: [],
      total: 0,
      hasMore: false
    };
  }
}

/**
 * Utility Functions
 */

export function validateWCURI(uri: string): boolean {
  const wcPattern = /^wc:[a-f0-9]{64}@2\?relay-protocol=irn&symKey=[a-f0-9]{64}(&expiryTimestamp=\d+)?$/;
  return wcPattern.test(uri);
}

export function parseWCURI(uri: string) {
  // Return null immediately if URI is empty, null, or invalid
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return null;
  }
  
  // Check if URI starts with 'wc:' protocol
  if (!uri.startsWith('wc:')) {
    console.error('Invalid WC URI: Must start with "wc:"');
    return null;
  }
  
  try {
    const url = new URL(uri);
    const topic = url.pathname.substring(3); // Remove 'wc:'
    const params = new URLSearchParams(url.search);
    
    return {
      topic,
      version: url.pathname.split('@')[1],
      relay: params.get('relay-protocol'),
      expiryTimestamp: params.get('expiryTimestamp')
    };
  } catch (error) {
    console.error('Failed to parse WC URI:', error);
    return null;
  }
}

export function formatMethod(method: string): string {
  const methodNames: { [key: string]: string } = {
    'eth_sendTransaction': 'Send Transaction',
    'personal_sign': 'Sign Message',
    'eth_signTypedData': 'Sign Typed Data',
    'eth_signTransaction': 'Sign Transaction'
  };
  
  return methodNames[method] || method;
}

/**
 * Real-time Request Polling
 * NOTE: This is currently disabled in favor of React Query polling to avoid duplicate requests
 */
export function startRequestPolling(token: string, onNewRequest: (request: TransactionRequest) => void): NodeJS.Timeout {
  const interval = setInterval(async () => {
    try {
      const requests = await getPendingRequests(token);
      
      requests.forEach(request => {
        onNewRequest(request);
      });
    } catch (error) {
      console.error('Error polling for requests:', error);
    }
  }, 10000); // Increased to 10 seconds to reduce load
  
  return interval;
}

/**
 * Error Handler
 */
export function handleWCError(error: string): string {
  switch (error) {
    case 'URI is required':
      return 'Please provide a valid WalletConnect URI';
    case 'User private key not found':
      return 'Please ensure you are logged in';
    case 'Request expired':
      return 'This request has expired. Please try again.';
    case 'Session not found':
      return 'Connection lost. Please reconnect to the dApp.';
    default:
      return 'Something went wrong. Please try again.';
  }
}


