# New WalletConnect Socket.IO Testing Guide

## 🎯 What Changed

We've implemented the new simplified WalletConnect Socket.IO event system as requested. Here's what's different:

### ❌ OLD SYSTEM (Removed)
- Complex user-specific event names: `user:${userId}:WALLETCONNECT_REQUEST_RECEIVED`
- Multiple different event types for approval/rejection feedback
- Complex authentication and room-based filtering

### ✅ NEW SYSTEM (Implemented)
- Simple event names: `NEW_REQUEST` and `NEW_CONNECTION`
- User ID filtering in frontend (not backend)
- No authentication required for Socket.IO connection
- Clean, straightforward approach

## 🔧 Implementation Details

### Socket.IO Connection
```javascript
// Backend URL changed to localhost as per instructions
const socket = io('http://localhost:8000', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
```

### Event Handlers
```javascript
// NEW_REQUEST - when dApp sends transaction/signing request
socket.on('NEW_REQUEST', (event) => {
  if (event.userId === currentUserId) {
    // Show approval popup for this user
    showApprovalPopup(event.data);
  }
});

// NEW_CONNECTION - when user successfully connects to dApp
socket.on('NEW_CONNECTION', (event) => {
  if (event.userId === currentUserId) {
    // Update UI to show successful connection
    showConnectionSuccess(event.data);
  }
});
```

## 🧪 Testing the New System

### Step 1: Backend Test Endpoint
Test the events using the provided endpoint:

```bash
curl -X POST http://localhost:8000/walletconnect/test-events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-API-Key: sk_0649f261327a11b68374d6d6b15bbfb0eb039e505d93b6db85f91678eaa374fd" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Step 2: Expected Event Payload (NEW_REQUEST)
The backend should emit this event:

```javascript
{
  message: "New REQUEST",
  userId: "23c04988-eb1b-40a3-9265-6c8a56335954",
  data: {
    id: "c7b78eb9-b4f5-42ed-bdf1-5559f04e5974",
    requestId: "1756546120072536",
    sessionId: "fa1c87187104dcc22c154f0f6e9a0e6ff22d4d166c121b31f961e72fd8a194d5",
    userId: "23c04988-eb1b-40a3-9265-6c8a56335954",
    userAddress: "0xAC7Ba2cadebaeBd29a93abB8EC95088e323e03b5",
    method: "eth_sendTransaction",
    params: [
      {
        to: "0x...",
        value: "0x...",
        gas: "0x...",
        // ... other transaction params
      }
    ],
    chainId: "eip155:1",
    dappName: "Uniswap",
    dappUrl: "https://uniswap.org",
    dappIcon: "https://...",
    createdAt: 1749721598000,
    expiresAt: 1749721898000
  }
}
```

### Step 3: Expected Frontend Behavior
When the event is received:

1. **Console Logs**:
   ```
   📡 Socket.IO Event received: NEW_REQUEST {...}
   🔔 NEW_REQUEST event received: {...}
   ✅ Request is for current user: [userId]
   🚀 Processing new WalletConnect request: {...}
   📱 New request received in WalletConnect page: {...}
   ```

2. **UI Changes**:
   - Approval modal should pop up
   - Toast notification should appear
   - Request details should be displayed

3. **Status Indicator**:
   - Green dot in bottom-left corner shows connection status
   - User ID truncated display for debugging

## 🐛 Debugging

### Check Connection Status
Look for these console messages:
- `✅ Connected to WalletConnect backend` - Socket.IO connected
- `🔌 New WalletConnect Socket.IO Effect Triggered` - Component mounted
- `🎯 === NEW SOCKET.IO SETUP COMPLETE ===` - Event listeners attached

### Verify User ID
The system gets user ID from:
1. Telegram ID (if in Telegram)
2. `user.id` from auth
3. `user.externalId` from auth
4. `user.email` from auth
5. `user.phoneNumber` from auth

### Event Filtering
Each event checks: `event.userId === currentUserId`
- ✅ Match: Process the event
- ⚠️ No match: Log warning and ignore

## 📁 Modified Files

1. **`/src/hooks/walletconnect/use-walletconnect-socket.tsx`**
   - ✅ Updated Socket.IO URL to `http://localhost:8000`
   - ✅ Replaced complex event handlers with `NEW_REQUEST` and `NEW_CONNECTION`
   - ✅ Added user ID filtering logic
   - ✅ Removed legacy event handlers

2. **`/src/v2/pages/walletconnect/index.tsx`**
   - ✅ Cleaned up old debug logging
   - ✅ Added new event handler component
   - ✅ Integrated user ID detection

3. **`/src/components/walletconnect/NewWalletConnectEventHandler.tsx`** (NEW)
   - ✅ Example implementation following backend guidelines
   - ✅ Clean Socket.IO setup
   - ✅ User ID filtering
   - ✅ Status indicator component

## 🎉 Success Criteria

The implementation is working correctly when:

1. **Connection**: Green status dot shows connected
2. **Events**: NEW_REQUEST events trigger approval popups
3. **Filtering**: Only events for current user are processed
4. **UI**: Transaction modal opens when request received
5. **Logging**: Clear console messages for debugging

## 🔄 What Happens in the Flow

1. **User connects dApp** → Backend emits `NEW_CONNECTION` event
2. **dApp sends request** → Backend emits `NEW_REQUEST` event with full request details
3. **Frontend shows popup** → User sees approval/rejection options
4. **User responds** → Frontend calls approval/rejection API endpoints
5. **Request processed** → Response sent back to dApp via WalletConnect

## 🆘 Troubleshooting

### No Events Received
- Check Socket.IO connection status
- Verify backend is running on `http://localhost:8000`
- Ensure user ID is properly detected
- Check browser console for connection errors

### Events for Wrong User
- Verify user ID detection logic
- Check that `event.userId` matches `currentUserId`
- Look for user ID mismatch warnings in console

### Modal Not Opening
- Check if `onNewRequest` handler is called
- Verify `setPendingRequest` is working
- Ensure `viewMode` changes to 'transaction'

This new implementation is much cleaner and follows the backend team's simplified approach! 🚀
