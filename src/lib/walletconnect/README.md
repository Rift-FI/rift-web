# WalletConnect Implementation

This directory contains the complete WalletConnect implementation for the Sphere Wallet frontend, supporting both Telegram Mini App and PWA platforms.

## 🚀 Features

- **QR Code Scanner**: Camera-based scanning with manual URI input fallback
- **Connection Management**: Approve/reject dApp connection requests
- **Transaction Handling**: Review and approve/reject transaction requests
- **Session Management**: View and manage connected dApps
- **Platform Support**: Native Telegram and PWA integrations
- **Real-time Updates**: Live transaction request notifications

## 📁 File Structure

```
src/
├── lib/
│   ├── walletconnect.ts              # Core API integration
│   └── walletconnect-platform.ts     # Platform-specific features
├── hooks/
│   └── walletconnect/
│       ├── use-walletconnect.tsx     # Main React hook
│       └── index.ts                  # Hook exports
├── components/
│   └── walletconnect/
│       ├── WalletConnectScanner.tsx  # QR scanner component
│       ├── ConnectionRequestModal.tsx # Connection approval modal
│       ├── TransactionRequestModal.tsx # Transaction review modal
│       ├── ConnectedAppsManager.tsx  # Session management
│       └── index.ts                  # Component exports
└── v2/pages/walletconnect/
    └── index.tsx                     # Main WalletConnect page
```

## 🔧 API Integration

The implementation uses the backend WalletConnect service with the following endpoints:

- `GET /walletconnect/status` - Check service status
- `POST /walletconnect/start` - Start WalletConnect service
- `POST /walletconnect/connect-to-dapp` - Connect to dApp
- `GET /walletconnect/sessions` - Get active sessions
- `DELETE /walletconnect/sessions/{topic}` - Disconnect session
- `GET /walletconnect/requests/pending` - Get pending requests
- `POST /walletconnect/requests/{id}/approve` - Approve request
- `POST /walletconnect/requests/{id}/reject` - Reject request

## 🎯 Usage

### Basic Hook Usage

```typescript
import { useWalletConnect } from '@/hooks/walletconnect';

function MyComponent() {
  const {
    isServiceRunning,
    sessions,
    pendingRequests,
    connectToDApp,
    disconnectSession,
    approveRequest,
    rejectRequest
  } = useWalletConnect();

  // Use the hook values and functions
}
```

### Component Usage

```typescript
import {
  WalletConnectScanner,
  ConnectionRequestModal,
  TransactionRequestModal,
  ConnectedAppsManager
} from '@/components/walletconnect';

// Use components in your UI
```

## 📱 Platform Features

### Telegram Mini App
- Haptic feedback for interactions
- Native confirmation dialogs
- Cloud storage for sessions
- Telegram theme integration
- Share functionality

### PWA
- Push notifications for requests
- Camera permissions for QR scanning
- Offline functionality
- Install prompts
- Desktop compatibility

## 🔒 Security

- URI validation for WalletConnect connections
- Transaction details review before approval
- Session management with easy disconnect
- Risk level indicators for different operations
- Security warnings and tips

## 🧪 Testing

The implementation includes error handling for:
- Network failures
- Invalid URIs
- Camera permissions
- Service unavailability
- Request timeouts

## 🎨 UI/UX

- Modern, responsive design
- Smooth animations and transitions
- Platform-specific styling
- Loading states and feedback
- Intuitive navigation
- Accessibility support

## ⚡ Performance

- Efficient request polling
- Lazy-loaded QR scanning library
- Optimized re-renders with React Query
- Background service management
- Memory leak prevention

## 🔄 Integration

The WalletConnect functionality is integrated into:

1. **Bottom Navigation**: New "WalletConnect" tab with QR icon
2. **Home Page**: Quick "Connect" action button
3. **Routing**: `/app/walletconnect` route
4. **Shell Context**: Extended tab schema

## 🌟 Future Enhancements

- WebSocket real-time updates
- Multiple chain support indicators
- Advanced transaction simulation
- dApp reputation system
- Usage analytics
- Enhanced QR code detection


