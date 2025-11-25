# Firebase Push Notification Terminology Guide

## What Are We Actually Storing?

### The Correct Term: **FCM Token** (Firebase Cloud Messaging Token)

```javascript
// Web (PWA)
const fcmToken = await getToken(messaging, { vapidKey });
// Example: "eJ7Tx5XK...very_long_string...mQ8zK"
// Length: ~150-180 characters
```

## Terminology Across Platforms

| Platform | Platform-Specific Name | What Firebase Uses | What Gets Sent |
|----------|----------------------|-------------------|----------------|
| **iOS** | Device Token (APNs) | APNs token → FCM token | FCM token |
| **Android** | Registration Token | FCM token | FCM token |
| **Web/PWA** | Push Subscription | FCM token | FCM token |

## Important: They're All FCM Tokens in the End!

Even though iOS calls it a "device token," Firebase converts it to an FCM token. **All platforms end up with an FCM token** that your backend uses to send notifications.

## What Your Backend Should Call It

### ❌ Common Misnomers:
- `subscriberId` - Sounds like a user ID, not a device token
- `deviceId` - Could be confused with actual device identifiers (UDID, etc.)
- `pushToken` - Too generic
- `registrationId` - Old GCM terminology

### ✅ Better Names:
- `fcmToken` - Clear and accurate
- `token` - Simple, if context is clear
- `deviceToken` - OK, but less specific

## Your Current Code vs Better Practice

### Current (Works but confusing naming):
```javascript
// Frontend
await rift.notifications.registerSubscription({
  subscriberId: fcmToken, // ❌ Confusing name
  platform: "web"
});

// Backend Database
{
  userId: "user123",
  subscriberId: "eJ7Tx5...", // ❌ Sounds like user ID
  platform: "web"
}
```

### Better (Clear naming):
```javascript
// Frontend
await rift.notifications.registerDevice({
  fcmToken: fcmToken, // ✅ Clear what this is
  platform: "web"
});

// Backend Database
{
  userId: "user123",
  fcmToken: "eJ7Tx5...", // ✅ Clear this is FCM token
  platform: "web"
}
```

## Backend: Sending Notifications

Regardless of what you call it in your database, Firebase Admin SDK always calls it `token`:

```javascript
// Firebase Admin SDK
await admin.messaging().send({
  token: fcmToken, // ✅ Firebase calls it "token"
  notification: {
    title: "Payment Received",
    body: "You got $100"
  }
});

// Or for multiple devices
await admin.messaging().sendMulticast({
  tokens: [fcmToken1, fcmToken2], // ✅ Array of FCM tokens
  notification: { /* ... */ }
});
```

## Frontend: Getting the Token

```javascript
import { getToken } from 'firebase/messaging';

// This is what we're getting:
const fcmToken = await getToken(messaging, {
  vapidKey: 'BNFg7xK...' // Your VAPID key
});

console.log('FCM Token:', fcmToken);
// Output: "eJ7Tx5XK2rP...very_long_string...8zKmQ"
```

## Comparison: FCM Token vs Other IDs

| Type | Purpose | Example | Length |
|------|---------|---------|--------|
| **FCM Token** | Push notifications | `eJ7Tx5XK2rP...` | 150-180 chars |
| User ID | Identify user | `user123` or `abc-def-123` | Variable |
| Device ID (iOS) | Identify device | `00008020-000...` | 36 chars |
| Session ID | Identify session | `sess_abc123...` | Variable |

## Key Takeaways

1. ✅ **It's an FCM token** - not subscriber ID, not device ID
2. ✅ **All platforms use FCM tokens** - iOS, Android, Web all end up with FCM tokens
3. ✅ **One token per device/browser** - User can have multiple FCM tokens
4. ✅ **Tokens can expire** - Handle token refresh in your backend
5. ✅ **Backend doesn't care about platform** - Same `admin.messaging().send()` for all

## Your Backend Schema Recommendation

```javascript
// Database table: notification_tokens or device_tokens
{
  id: "token_abc123", // Your internal ID
  userId: "user123", // Link to user
  fcmToken: "eJ7Tx5...", // ✅ The actual FCM token
  platform: "web", // or "android", "ios"
  deviceInfo: "Chrome on macOS",
  isActive: true,
  createdAt: "2025-11-25T10:00:00Z",
  lastUsed: "2025-11-25T12:00:00Z"
}
```

## Do You Need to Change Your Backend?

**No!** Your current naming (`subscriberId`) works fine. Firebase doesn't care what you call it in your database - it just needs the actual token string when sending.

```javascript
// Your backend probably does this:
const subscriberId = getUserToken(userId); // Gets the FCM token
await admin.messaging().send({
  token: subscriberId, // Firebase just needs the string
  notification: { /* ... */ }
});
```

The naming is just for clarity in your codebase. The actual functionality works regardless! 🚀
