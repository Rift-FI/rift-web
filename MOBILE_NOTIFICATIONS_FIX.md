# Mobile Push Notifications Fix

## Issue

Notifications work on desktop but not showing properly on mobile Android.

## Common Mobile Issues

### 1. **Multiple Service Workers Conflict**

The VitePWA plugin creates its own service worker which conflicts with Pusher Beams.

**Fix Applied:**
- Disabled VitePWA auto service worker registration
- Pusher Beams now manages the service worker exclusively

### 2. **HTTPS Required on Mobile**

Mobile browsers (especially Android) require HTTPS for push notifications to work properly.

**For Testing:**
- Desktop: Works on `http://localhost` ✅
- Mobile: Needs HTTPS ❌

**Solutions:**

#### Option A: Use ngrok (Quick Testing)
```bash
# Install ngrok
npm install -g ngrok

# Create HTTPS tunnel
ngrok http 5173

# You'll get: https://abc123.ngrok.io
```

Then:
1. Add the ngrok URL to Pusher allowed origins
2. Open the ngrok URL on mobile
3. Enable notifications
4. Test!

#### Option B: Deploy to Production
- Deploy to your production domain (already HTTPS)
- Add domain to Pusher allowed origins
- Test on mobile

### 3. **Service Worker Scope Issue**

Mobile browsers are stricter about service worker scope.

**Check in Browser Console:**
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered service workers:', registrations);
  registrations.forEach(reg => {
    console.log('- Scope:', reg.scope);
    console.log('- Active:', reg.active?.scriptURL);
  });
});
```

**Expected:**
```
- Scope: http://localhost:5173/
- Active: http://localhost:5173/service-worker.js
```

**If multiple workers:**
```javascript
// Unregister all
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
// Refresh page
```

### 4. **Android-Specific Requirements**

**Add to Home Screen:**
- Android Chrome requires the PWA to be "installed" (added to home screen)
- Open menu → "Install app" or "Add to Home screen"
- Then enable notifications

**Check Permission:**
- Android may show notifications in a different format
- Check notification permission in Chrome settings

### 5. **Notification Icon Path**

Mobile needs absolute URLs for icons:

**Backend notification payload:**
```typescript
await beamsClient.publishToUsers([userId], {
  web: {
    notification: {
      title: 'Test',
      body: 'Hello mobile!',
      icon: 'https://wallet.riftfi.xyz/rift.png', // ✅ Full URL
      badge: 'https://wallet.riftfi.xyz/rift.png',
      image: 'https://wallet.riftfi.xyz/rift.png', // Optional large image
      deep_link: 'https://wallet.riftfi.xyz/app',
    },
  },
});
```

## Testing Checklist for Mobile

- [ ] Using HTTPS (ngrok or production)
- [ ] Only ONE service worker registered
- [ ] Added to home screen (Android)
- [ ] Notification permission granted
- [ ] Console shows successful authentication
- [ ] Pusher dashboard shows device registered
- [ ] Backend using `publishToUsers` not `publishToInterests`
- [ ] Icon URLs are absolute (https://)

## Debug on Mobile

### Chrome DevTools Remote Debugging:

1. **Connect phone to computer via USB**
2. **Enable USB debugging** on Android
3. **Open Chrome on desktop:** `chrome://inspect`
4. **Select your device**
5. **Inspect the page** to see console logs

### Safari iOS Debugging:

1. **Enable Web Inspector** on iPhone: Settings → Safari → Advanced
2. **Connect iPhone to Mac**
3. **Open Safari on Mac:** Develop → [Your iPhone] → [Your Page]

## Quick Mobile Test

### Using ngrok:

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start ngrok
ngrok http 5173

# You'll get: https://abc123.ngrok-free.app
```

Then:
1. Add `https://abc123.ngrok-free.app` to Pusher allowed origins
2. Open the ngrok URL on your phone
3. Log in
4. Enable notifications
5. Send test notification
6. Should work! ✅

## Expected vs Actual

### Desktop (Working) ✅:
```
- HTTP localhost works
- Service worker registers
- Notifications display
```

### Mobile (Needs HTTPS) ❌:
```
- HTTP doesn't work for push
- Needs HTTPS or localhost
- Stricter security requirements
```

### Mobile (With HTTPS) ✅:
```
- HTTPS works
- Service worker registers
- Notifications display properly
```

## Next Steps

1. **For quick testing:** Use ngrok
2. **For production:** Deploy with HTTPS
3. **Verify:** Check Pusher dashboard for mobile devices

The notification in your screenshot is the PWA update notification, not the actual push notification. Once you use HTTPS on mobile, you'll see the real Pusher Beams notifications! 🚀

