# 🌟 Sphere Wallet Frontend - WalletConnect Implementation Guide

## 🎯 Overview

This guide provides complete implementation details for building a MetaMask-like WalletConnect experience in **both versions** of the Sphere Wallet frontend:

- **📱 Telegram Mini App** - Native Telegram Bot experience
- **🌐 Progressive Web App (PWA)** - Standalone web application

Users should be able to scan QR codes or paste URIs from dApps like Uniswap and seamlessly connect their wallet across both platforms.

## 🚀 Core User Experience Flow

### 1. **Connection Flow (Like MetaMask)**
```
User goes to Uniswap → Clicks "Connect Wallet" → Selects "WalletConnect" 
→ Gets QR Code/URI → Opens Sphere Wallet → Scans/Pastes URI 
→ Reviews connection request → Approves → Connected!
```

### 2. **Transaction Flow**
```
User connected to dApp → Triggers transaction (swap, send, etc.) 
→ Sphere Wallet shows popup → User reviews transaction details 
→ Approves/Rejects → Transaction executed/cancelled
```

## 🔧 Required Frontend Components

### 1. **WalletConnect Scanner/Input Component**
```typescript
interface WalletConnectScannerProps {
  onURIDetected: (uri: string) => void;
  onError: (error: string) => void;
}

// Features needed:
// - QR Code scanner using camera
// - Manual URI input field
// - URI validation
// - Real-time scanning feedback
```

### 2. **Connection Request Modal**
```typescript
interface ConnectionRequestProps {
  dAppMetadata: {
    name: string;
    url: string;
    description: string;
    icons: string[];
  };
  requestedChains: string[];
  requestedMethods: string[];
  onApprove: () => void;
  onReject: () => void;
}
```

### 3. **Transaction Request Modal**
```typescript
interface TransactionRequestProps {
  request: {
    id: string;
    method: string;
    params: any[];
    chainId: string;
    dAppName: string;
    estimatedGas?: string;
    estimatedFee?: string;
  };
  onApprove: () => void;
  onReject: (reason?: string) => void;
}
```

### 4. **Active Sessions Manager**
```typescript
interface ActiveSession {
  topic: string;
  dAppName: string;
  dAppUrl: string;
  dAppIcon: string;
  connectedAt: number;
  chains: string[];
}
```

## 📡 API Integration

### Base Configuration
```typescript
const API_BASE = 'http://localhost:8000';
const WC_BASE = `${API_BASE}/walletconnect`;

// Headers for all requests
const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'x-api-key': 'your_project_api_key'
});
```

### 1. **Service Management**

#### Check WalletConnect Status
```typescript
async function checkWCStatus(): Promise<{running: boolean, sessions: number}> {
  const response = await fetch(`${WC_BASE}/status`);
  const data = await response.json();
  
  return {
    running: data.data.running,
    sessions: data.data.client.activeSessions
  };
}
```

#### Start WalletConnect Service (Auto-start on app load)
```typescript
async function startWCService(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/start`, {
      method: 'POST',
      headers: getHeaders(token)
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to start WC service:', error);
    return false;
  }
}
```

### 2. **Connection Management**

#### Connect to dApp (Main Function)
```typescript
async function connectToDApp(uri: string, token: string): Promise<{success: boolean, userAddress?: string, error?: string}> {
  try {
    const response = await fetch(`${WC_BASE}/connect-to-dapp`, {
      method: 'POST',
      headers: getHeaders(token),
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
  } catch (error) {
    return {
      success: false,
      error: 'Network error'
    };
  }
}
```

#### Get Active Sessions
```typescript
async function getActiveSessions(token: string): Promise<ActiveSession[]> {
  const response = await fetch(`${WC_BASE}/sessions`, {
    headers: getHeaders(token)
  });
  
  const data = await response.json();
  
  return data.data.map((session: any) => ({
    topic: session.topic,
    dAppName: session.peer.metadata.name,
    dAppUrl: session.peer.metadata.url,
    dAppIcon: session.peer.metadata.icons[0],
    connectedAt: Date.now(), // You might want to store this separately
    chains: session.namespaces.eip155.accounts.map((acc: string) => acc.split(':')[1])
  }));
}
```

#### Disconnect Session
```typescript
async function disconnectSession(topic: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/sessions/${topic}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to disconnect session:', error);
    return false;
  }
}
```

### 3. **Request Management**

#### Poll for Pending Requests (Real-time)
```typescript
async function getPendingRequests(token: string): Promise<any[]> {
  const response = await fetch(`${WC_BASE}/requests/pending`, {
    headers: getHeaders(token)
  });
  
  const data = await response.json();
  return data.requests || [];
}

// Poll every 2 seconds when wallet is active
function startRequestPolling(token: string, onNewRequest: (request: any) => void) {
  const interval = setInterval(async () => {
    const requests = await getPendingRequests(token);
    
    requests.forEach(request => {
      onNewRequest(request);
    });
  }, 2000);
  
  return interval; // Return to clear later
}
```

#### Approve Transaction Request
```typescript
async function approveRequest(requestId: string, token: string): Promise<{success: boolean, txHash?: string, error?: string}> {
  try {
    const response = await fetch(`${WC_BASE}/requests/${requestId}/approve`, {
      method: 'POST',
      headers: getHeaders(token)
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
  } catch (error) {
    return {
      success: false,
      error: 'Network error'
    };
  }
}
```

#### Reject Transaction Request
```typescript
async function rejectRequest(requestId: string, reason: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/requests/${requestId}/reject`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ reason })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to reject request:', error);
    return false;
  }
}
```

## 🎨 UX Implementation Details

### 1. **WalletConnect Scanner Page**

```typescript
// Main scanner interface
const WalletConnectScanner: React.FC = () => {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [uri, setUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleURISubmit = async (detectedUri: string) => {
    setIsConnecting(true);
    
    // Validate URI format
    if (!detectedUri.startsWith('wc:')) {
      showError('Invalid WalletConnect URI');
      return;
    }
    
    // Show connection preview modal first
    const dAppInfo = parseWCURI(detectedUri);
    showConnectionModal(dAppInfo, detectedUri);
  };
  
  return (
    <div className="scanner-container">
      <div className="mode-toggle">
        <button onClick={() => setScanMode('camera')}>Scan QR</button>
        <button onClick={() => setScanMode('manual')}>Enter URI</button>
      </div>
      
      {scanMode === 'camera' ? (
        <QRScanner onScan={handleURISubmit} />
      ) : (
        <URIInput onSubmit={handleURISubmit} />
      )}
    </div>
  );
};
```

### 2. **Connection Request Modal**

```typescript
const ConnectionRequestModal: React.FC<ConnectionRequestProps> = ({
  dAppMetadata,
  requestedChains,
  uri,
  onApprove,
  onReject
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleApprove = async () => {
    setIsConnecting(true);
    
    const result = await connectToDApp(uri, userToken);
    
    if (result.success) {
      showSuccess(`Connected to ${dAppMetadata.name}!`);
      onApprove();
    } else {
      showError(result.error || 'Connection failed');
    }
    
    setIsConnecting(false);
  };
  
  return (
    <Modal>
      <div className="connection-request">
        <img src={dAppMetadata.icons[0]} alt={dAppMetadata.name} />
        <h2>{dAppMetadata.name}</h2>
        <p>{dAppMetadata.url}</p>
        
        <div className="permissions">
          <h3>This app wants to:</h3>
          <ul>
            <li>✓ View your wallet address</li>
            <li>✓ Request transaction approvals</li>
            <li>✓ Access these networks: {requestedChains.join(', ')}</li>
          </ul>
        </div>
        
        <div className="actions">
          <button onClick={onReject} disabled={isConnecting}>
            Reject
          </button>
          <button onClick={handleApprove} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

### 3. **Transaction Request Modal**

```typescript
const TransactionRequestModal: React.FC<TransactionRequestProps> = ({
  request,
  onApprove,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const handleApprove = async () => {
    setIsProcessing(true);
    
    const result = await approveRequest(request.id, userToken);
    
    if (result.success) {
      showSuccess('Transaction approved!');
      if (result.txHash) {
        showTransactionLink(result.txHash);
      }
      onApprove();
    } else {
      showError(result.error || 'Transaction failed');
    }
    
    setIsProcessing(false);
  };
  
  const handleReject = async () => {
    await rejectRequest(request.id, 'User rejected', userToken);
    onReject();
  };
  
  return (
    <Modal>
      <div className="transaction-request">
        <div className="header">
          <h2>Transaction Request</h2>
          <span className="dapp-name">{request.dAppName}</span>
        </div>
        
        <div className="transaction-summary">
          <div className="method">{formatMethod(request.method)}</div>
          {request.estimatedFee && (
            <div className="fee">Est. Fee: {request.estimatedFee}</div>
          )}
        </div>
        
        <button onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
        
        {showDetails && (
          <div className="details">
            <pre>{JSON.stringify(request.params, null, 2)}</pre>
          </div>
        )}
        
        <div className="actions">
          <button onClick={handleReject} disabled={isProcessing}>
            Reject
          </button>
          <button onClick={handleApprove} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

### 4. **Connected dApps Management**

```typescript
const ConnectedDApps: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  
  useEffect(() => {
    loadSessions();
  }, []);
  
  const loadSessions = async () => {
    const activeSessions = await getActiveSessions(userToken);
    setSessions(activeSessions);
  };
  
  const handleDisconnect = async (topic: string, dAppName: string) => {
    const confirmed = confirm(`Disconnect from ${dAppName}?`);
    if (!confirmed) return;
    
    const success = await disconnectSession(topic, userToken);
    if (success) {
      setSessions(sessions.filter(s => s.topic !== topic));
      showSuccess(`Disconnected from ${dAppName}`);
    }
  };
  
  return (
    <div className="connected-dapps">
      <h2>Connected Apps</h2>
      
      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No connected apps</p>
          <button onClick={() => navigateToScanner()}>
            Connect to dApp
          </button>
        </div>
      ) : (
        sessions.map(session => (
          <div key={session.topic} className="dapp-item">
            <img src={session.dAppIcon} alt={session.dAppName} />
            <div className="info">
              <h3>{session.dAppName}</h3>
              <p>{session.dAppUrl}</p>
              <small>Chains: {session.chains.join(', ')}</small>
            </div>
            <button onClick={() => handleDisconnect(session.topic, session.dAppName)}>
              Disconnect
            </button>
          </div>
        ))
      )}
    </div>
  );
};
```

## 🔄 Real-time Updates

### WebSocket Integration (Optional but Recommended)
```typescript
import io from 'socket.io-client';

class WalletConnectNotifications {
  private socket: any;
  
  connect(userId: string) {
    this.socket = io('https://stratosphere-network-tendermint-production.up.railway.app');
    
    // Listen for new requests
    this.socket.on(`user:${userId}:WALLETCONNECT_REQUEST_RECEIVED`, (data) => {
      showTransactionModal(data.request);
    });
    
    // Listen for session connections
    this.socket.on(`user:${userId}:WALLETCONNECT_SESSION_CONNECTED`, (data) => {
      showSuccess(`Connected to ${data.session.peer.metadata.name}`);
      refreshSessions();
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
```

## 📱 Platform-Specific Implementation

### 🤖 Telegram Mini App Specific Features

#### 1. **Telegram WebApp Integration**
```typescript
// Initialize Telegram WebApp
import { WebApp } from '@twa-dev/sdk';

const initTelegramFeatures = () => {
  // Enable haptic feedback
  WebApp.HapticFeedback.impactOccurred('medium');
  
  // Set main button for quick actions
  WebApp.MainButton.setText('Scan QR Code');
  WebApp.MainButton.onClick(openQRScanner);
  WebApp.MainButton.show();
  
  // Handle back button
  WebApp.BackButton.onClick(() => {
    if (isModalOpen) {
      closeModal();
    } else {
      WebApp.close();
    }
  });
};
```

#### 2. **Telegram-Native Sharing**
```typescript
const shareWCURI = (uri: string) => {
  // Use Telegram's native sharing
  WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(uri)}`);
};

const copyToClipboard = (text: string) => {
  // Telegram's clipboard API
  WebApp.copyToClipboard(text);
  WebApp.showAlert('URI copied to clipboard!');
};
```

#### 3. **Telegram Theme Integration**
```typescript
const applyTelegramTheme = () => {
  const theme = WebApp.colorScheme; // 'light' or 'dark'
  const themeParams = WebApp.themeParams;
  
  document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color);
  document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color);
  document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color);
};
```

### 🌐 PWA Specific Features

#### 1. **PWA Installation & Updates**
```typescript
// Service Worker for offline support
const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // Handle updates
    registration.addEventListener('updatefound', () => {
      showUpdateNotification();
    });
  }
};

// Install prompt
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  deferredPrompt = e;
  showInstallButton();
});
```

#### 2. **Native Device Features**
```typescript
// Camera access for QR scanning
const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    return true;
  } catch (error) {
    showError('Camera access required for QR scanning');
    return false;
  }
};

// Push notifications
const enableNotifications = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Register for push notifications
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'your-vapid-key'
    });
  }
};
```

#### 3. **Desktop/Mobile Adaptive UI**
```typescript
const useResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};
```

### 🔗 Platform-Specific Deep Linking

#### Telegram Mini App Deep Links
```typescript
// Handle Telegram deep links
const handleTelegramDeepLink = (url: string) => {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const wcUri = urlParams.get('uri');
  
  if (wcUri) {
    // Auto-open connection modal
    showConnectionModal(wcUri);
  }
};

// Generate Telegram share link
const generateTelegramShareLink = (uri: string) => {
  const botUsername = 'YourSphereWalletBot';
  return `https://t.me/${botUsername}?start=wc_${btoa(uri)}`;
};
```

#### PWA Deep Links
```typescript
// Register URL scheme handler
if ('navigator' in window && 'registerProtocolHandler' in navigator) {
  navigator.registerProtocolHandler(
    'web+sphere',
    `${window.location.origin}/wc?uri=%s`,
    'Sphere Wallet'
  );
}

// Handle sphere:// links
const handleSphereProtocol = (url: string) => {
  if (url.startsWith('sphere://wc')) {
    const uri = url.split('uri=')[1];
    if (uri) {
      connectToDApp(decodeURIComponent(uri), userToken);
    }
  }
};
```

### 📱 Cross-Platform UX Considerations

#### 1. **Unified Interface Components**
```typescript
// Platform-aware button component
const PlatformButton: React.FC<{children: React.ReactNode, onClick: () => void}> = ({children, onClick}) => {
  const isTelegram = window.Telegram?.WebApp;
  
  return (
    <button 
      className={`platform-button ${isTelegram ? 'telegram-style' : 'pwa-style'}`}
      onClick={() => {
        if (isTelegram) {
          WebApp.HapticFeedback.impactOccurred('light');
        }
        onClick();
      }}
    >
      {children}
    </button>
  );
};
```

#### 2. **Platform Detection & Routing**
```typescript
const usePlatformDetection = () => {
  const isTelegram = Boolean(window.Telegram?.WebApp);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return { isTelegram, isPWA, isMobile };
};

// Platform-specific navigation
const PlatformRouter: React.FC = () => {
  const { isTelegram, isPWA } = usePlatformDetection();
  
  if (isTelegram) {
    return <TelegramWalletApp />;
  } else if (isPWA) {
    return <PWAWalletApp />;
  } else {
    return <WebWalletApp />;
  }
};
```

#### 3. **Shared State Management**
```typescript
// Platform-agnostic storage
const createPlatformStorage = () => {
  const isTelegram = Boolean(window.Telegram?.WebApp);
  
  return {
    setItem: (key: string, value: string) => {
      if (isTelegram) {
        // Use Telegram's cloud storage
        WebApp.CloudStorage.setItem(key, value);
      } else {
        // Use localStorage for PWA
        localStorage.setItem(key, value);
      }
    },
    
    getItem: async (key: string): Promise<string | null> => {
      if (isTelegram) {
        return new Promise((resolve) => {
          WebApp.CloudStorage.getItem(key, (error, value) => {
            resolve(error ? null : value);
          });
        });
      } else {
        return localStorage.getItem(key);
      }
    }
  };
};
```

### 🔄 Platform-Specific User Flows

#### Telegram Mini App Flow
```
User in Telegram → Opens @SphereWalletBot → /start command 
→ Mini App launches → Scan QR or paste URI → Connect to dApp 
→ Haptic feedback → Telegram notification → Approve/Reject
```

#### PWA Flow  
```
User visits app.sphere.com → Install PWA prompt → Open PWA 
→ Camera permission → Scan QR → Connect to dApp 
→ Push notification → Approve/Reject → Desktop integration
```

### 🛠️ Development Setup for Both Platforms

#### Telegram Mini App Setup
```json
// package.json additions for Telegram
{
  "dependencies": {
    "@twa-dev/sdk": "^7.0.0",
    "@twa-dev/types": "^7.0.0"
  }
}
```

#### PWA Setup
```json
// package.json additions for PWA
{
  "dependencies": {
    "workbox-webpack-plugin": "^7.0.0",
    "web-push": "^3.6.6"
  }
}
```

#### Shared Core Logic
```typescript
// walletConnect.core.ts - Platform agnostic
export class WalletConnectCore {
  private platform: 'telegram' | 'pwa' | 'web';
  
  constructor() {
    this.platform = this.detectPlatform();
  }
  
  private detectPlatform(): 'telegram' | 'pwa' | 'web' {
    if (window.Telegram?.WebApp) return 'telegram';
    if (window.matchMedia('(display-mode: standalone)').matches) return 'pwa';
    return 'web';
  }
  
  // Platform-specific notification
  showNotification(message: string) {
    switch (this.platform) {
      case 'telegram':
        WebApp.showAlert(message);
        break;
      case 'pwa':
        new Notification(message);
        break;
      default:
        alert(message);
    }
  }
  
  // Platform-specific vibration
  vibrate() {
    switch (this.platform) {
      case 'telegram':
        WebApp.HapticFeedback.impactOccurred('medium');
        break;
      case 'pwa':
        navigator.vibrate?.(200);
        break;
    }
  }
}

## 🚨 Error Handling & Edge Cases

### Common Error Scenarios
```typescript
const handleWCError = (error: string) => {
  switch (error) {
    case 'URI is required':
      showError('Please provide a valid WalletConnect URI');
      break;
    case 'User private key not found':
      showError('Please ensure you are logged in');
      break;
    case 'Request expired':
      showError('This request has expired. Please try again.');
      break;
    case 'Session not found':
      showError('Connection lost. Please reconnect to the dApp.');
      break;
    default:
      showError('Something went wrong. Please try again.');
  }
};
```

### URI Validation
```typescript
const validateWCURI = (uri: string): boolean => {
  const wcPattern = /^wc:[a-f0-9]{64}@2\?relay-protocol=irn&symKey=[a-f0-9]{64}(&expiryTimestamp=\d+)?$/;
  return wcPattern.test(uri);
};
```

## 🔧 Utility Functions

### Parse WalletConnect URI for Preview
```typescript
const parseWCURI = (uri: string) => {
  const url = new URL(uri);
  const topic = url.pathname.substring(3); // Remove 'wc:'
  const params = new URLSearchParams(url.search);
  
  return {
    topic,
    version: url.pathname.split('@')[1],
    relay: params.get('relay-protocol'),
    expiryTimestamp: params.get('expiryTimestamp')
  };
};
```

### Format Transaction Methods
```typescript
const formatMethod = (method: string): string => {
  const methodNames = {
    'eth_sendTransaction': 'Send Transaction',
    'personal_sign': 'Sign Message',
    'eth_signTypedData': 'Sign Typed Data',
    'eth_signTransaction': 'Sign Transaction'
  };
  
  return methodNames[method] || method;
};
```

## 🎯 Key Implementation Priorities

### 🔄 Universal (Both Platforms)
1. **Auto-start WalletConnect service** on app launch
2. **QR scanner with manual fallback** for URI input
3. **Clear connection approval flow** with dApp metadata
4. **Real-time request polling** or WebSocket integration
5. **Transaction preview** with gas estimation
6. **Connected apps management** with easy disconnect
7. **Error handling** for network issues and expired requests

### 📱 Telegram Mini App Priorities
8. **Telegram WebApp SDK integration** for native features
9. **Haptic feedback** for user interactions
10. **Telegram theme matching** for consistent UI
11. **Cloud storage** for session persistence
12. **Main/Back button** handling

### 🌐 PWA Priorities
13. **Service Worker** for offline support
14. **Push notifications** for transaction alerts
15. **Install prompt** for app-like experience
16. **Camera permissions** for QR scanning
17. **Desktop/mobile responsive** design

## 🚀 Getting Started Checklist

### 📋 Core Implementation
- [ ] Set up platform detection and routing
- [ ] Implement shared WalletConnect core logic
- [ ] Create unified API integration layer
- [ ] Build platform-agnostic storage system

### 🤖 Telegram Mini App
- [ ] Install @twa-dev/sdk for Telegram features
- [ ] Implement Telegram WebApp initialization
- [ ] Add haptic feedback to interactions
- [ ] Create Telegram-native sharing functionality
- [ ] Set up cloud storage for sessions
- [ ] Handle Main/Back button navigation

### 🌐 PWA Implementation
- [ ] Set up service worker and offline support
- [ ] Implement push notification system
- [ ] Add camera permissions for QR scanning
- [ ] Create responsive design for desktop/mobile
- [ ] Set up install prompt and app updates
- [ ] Register protocol handlers for deep links

### 🔧 Shared Components
- [ ] Build QR scanner with camera/manual input
- [ ] Create connection request approval modal
- [ ] Implement transaction review interface
- [ ] Add connected apps management
- [ ] Set up real-time request polling
- [ ] Add comprehensive error handling

### 🧪 Testing & Optimization
- [ ] Test with Uniswap, PancakeSwap, and other dApps
- [ ] Verify cross-platform functionality
- [ ] Optimize performance for both platforms
- [ ] Test deep linking and sharing flows
- [ ] Validate offline functionality (PWA)
- [ ] Ensure Telegram Bot integration works

## 🌟 Platform Benefits

### 📱 Telegram Mini App Advantages
- **Native Telegram integration** - Users never leave their favorite app
- **Instant accessibility** - No download required, just open the bot
- **Built-in sharing** - Easy to share wallet connections with friends
- **Cloud sync** - Sessions persist across devices via Telegram
- **Zero friction** - Telegram users are already authenticated

### 🌐 PWA Advantages  
- **Desktop compatibility** - Full desktop experience for power users
- **Offline functionality** - Works without internet for basic features
- **App-like experience** - Installed on home screen like native app
- **Push notifications** - Real-time alerts even when app is closed
- **Cross-platform** - Works on any device with a modern browser

This dual-platform implementation will give your users the flexibility to use Sphere Wallet in their preferred environment while maintaining a consistent, MetaMask-like experience for connecting to any WalletConnect-compatible dApp! 🌟

