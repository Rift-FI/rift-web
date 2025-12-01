# Clear Pusher Beams Cache - Switch to New Instance

## Problem

The browser has cached the old instance ID (`fd7e39bb-...`) in IndexedDB.
You updated to new instance ID (`a99bec59-...`) but the old one is still being used.

## Solution: Clear Browser Data

### Option 1: Browser DevTools (Quick)

1. Open DevTools (F12)
2. Go to **Application** tab
3. **Clear storage:**
   - Storage → Clear site data
   - Or just IndexedDB → Delete `pusher` database

### Option 2: Browser Console

Run this code in the browser console:

```javascript
// 1. Clear Pusher Beams state
import { pusherBeamsNotificationService } from "./src/services/pusher-beams-notifications";

await pusherBeamsNotificationService.clearAllInterests();

// 2. Clear IndexedDB
indexedDB.deleteDatabase("pusher-beams");

// 3. Unregister service workers
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((reg) => reg.unregister());
});

// 4. Reload
location.reload();
```

### Option 3: Manual Steps

**Chrome/Edge:**

1. F12 → Application tab
2. Storage → Clear site data
3. Refresh page

**Firefox:**

1. F12 → Storage tab
2. IndexedDB → Delete all
3. Refresh page

**Safari:**

1. Develop → Empty Caches
2. Refresh page

### Option 4: Incognito/Private Mode (Quick Test)

1. Open incognito/private window
2. Navigate to your app
3. Enable notifications (will use new instance ID)
4. Test!

## After Clearing

1. **Refresh the page**
2. **Log in again**
3. **Enable notifications**
4. **Check console** - should show new instance ID:
   ```
   📝 [Pusher Beams] Instance ID: a99bec59-b4a1-4182-bac9-c44b18e91162
   ```

## Verify New Instance

Open browser console after enabling notifications:

```javascript
// Should show new instance ID
import { pusherBeamsConfig } from "./src/config/pusher-beams";
console.log("Instance ID:", pusherBeamsConfig.instanceId);
// Expected: a99bec59-b4a1-4182-bac9-c44b18e91162
```

## Don't Forget!

Add your domains to the **NEW** Pusher instance allowed origins:

https://dashboard.pusher.com/beams → Select instance `a99bec59-b4a1-4182-bac9-c44b18e91162` → Settings → Allowed Origins

Add:

- `http://localhost:5173`
- `https://wallet.riftfi.xyz`

---

After clearing cache, it will use the new instance! 🚀
