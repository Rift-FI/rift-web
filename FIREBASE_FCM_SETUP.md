# Firebase Cloud Messaging Setup for PWA

## ✅ Good News!
Your backend already has Firebase configured and working! We just need to configure the PWA frontend.

## What You Need From Firebase Console

Go to [Firebase Console](https://console.firebase.google.com/) → Your Project

### 1. Get Web App Config
**Project Settings → General → Your apps → Web app**

You'll need these values:
```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

### 2. Get VAPID Key (Very Important!)
**Project Settings → Cloud Messaging → Web Push certificates**

- If you don't have a Web Push certificate, click "Generate key pair"
- Copy the "Key pair" value (starts with `B...`)

## Environment Variables Setup

Create/update your `.env` file with:

```bash
# Existing
VITE_SDK_API_KEY=your_existing_sdk_key

# Firebase Config (from step 1 above)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# VAPID Key (from step 2 above)
VITE_FIREBASE_VAPID_KEY=BNFg7xK...your_vapid_key_here
```

## Update Firebase Service Worker Config

Edit `/public/firebase-messaging-sw.js` and replace the placeholder config:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
});
```

## Backend Compatibility Check

Your backend should already handle this, but verify it accepts:

### Token Registration
```javascript
POST /api/notifications/register
{
  "subscriberId": "fcm_token_here...", // FCM token (different from Android)
  "platform": "web",  // Make sure backend recognizes "web"
  "deviceInfo": "Chrome on macOS"
}
```

### Sending Notifications
Your backend likely already does this:
```javascript
// Works for BOTH Android and Web tokens!
await admin.messaging().sendMulticast({
  tokens: [user.fcmToken], // Can be Android OR Web token
  notification: {
    title: "Payment Received",
    body: "You got $100"
  },
  webpush: { // Optional: Web-specific config
    fcm_options: {
      link: "https://wallet.riftfi.xyz/app/payments"
    }
  }
});
```

## Testing

### 1. Enable Notifications in PWA
```javascript
const { enableNotifications } = useNotifications();
await enableNotifications();
// Should get FCM token and register with backend
```

### 2. Send Test from Backend
Your existing backend test should work! Just send to the web FCM token.

### 3. Send Test from Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Add your FCM token
4. Send!

## What Changed vs Android?

| Aspect | Android (React Native) | Web (PWA) |
|--------|----------------------|-----------|
| **Token Format** | Different format | Different format |
| **Backend Code** | Same! | Same! |
| **Firebase Project** | Same | Same |
| **Sending Logic** | Same `admin.messaging().send()` | Same `admin.messaging().send()` |

## Troubleshooting

### "Messaging not supported"
- Check HTTPS (required in production)
- Check browser compatibility (Chrome, Firefox, Edge work)

### "Permission denied"
- User blocked notifications
- Guide them to browser settings

### "No VAPID key"
- Make sure you generated Web Push certificate in Firebase Console
- Check `.env` file has `VITE_FIREBASE_VAPID_KEY`

### "Token not receiving notifications"
- Verify token is registered in backend database
- Check Firebase Console → Cloud Messaging for send status
- Look at service worker console logs

## Key Differences from Webpushr/Pusher

1. **✅ Free** - Unlimited notifications
2. **✅ Your backend already supports it** - No backend changes needed
3. **✅ Same system** as your Android app - Unified notification system
4. **✅ Reliable** - Used by millions of apps

## Next Steps

1. ✅ Get Firebase config from console
2. ✅ Update `.env` file
3. ✅ Update `firebase-messaging-sw.js` config
4. ✅ Test enabling notifications in PWA
5. ✅ Send test notification from backend
6. ✅ Verify notification received!

## Important Notes

- **Service Worker**: Must be at root (`/firebase-messaging-sw.js`)
- **HTTPS Required**: PWAs need HTTPS for push notifications
- **iOS Safari**: Still doesn't support Web Push (Apple limitation)
- **Token Refresh**: FCM tokens can expire, handle refresh in your backend
