# How to Clear Pusher Beams and Start Fresh

## Quick Clear (Frontend - Browser)

### Option 1: Use the Auto-Clear Flag

Run this in browser console:

```javascript
localStorage.setItem('clear_pusher_cache', 'true');
location.reload();
```

The app will auto-clear Pusher Beams cache on next load (dev mode only).

### Option 2: Manual Clear

Run this in browser console:

```javascript
// Clear all Pusher data
indexedDB.databases().then(dbs => {
  dbs.forEach(db => {
    if (db.name?.includes('pusher') || db.name?.includes('beams')) {
      indexedDB.deleteDatabase(db.name);
      console.log('Deleted:', db.name);
    }
  });
});

// Unregister service workers
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});

// Reload
setTimeout(() => location.reload(), 500);
```

## Clear All Users (Backend - Pusher Beams)

### Step 1: Install Dependencies (if not already)

```bash
npm install @pusher/push-notifications-server
```

### Step 2: Run the Clear Script

```bash
node clear-all-pusher-users.js
```

This will delete all registered users from Pusher Beams.

### Step 3: Verify in Pusher Dashboard

1. Go to https://dashboard.pusher.com/beams
2. Select instance: `a99bec59-b4a1-4182-bac9-c44b18e91162`
3. Check **Devices** - should show 0 devices
4. Check **Debug Console** - should be empty

## Complete Reset (Start 100% Fresh)

### Do All of These:

```bash
# 1. Clear backend Pusher users
node clear-all-pusher-users.js

# 2. In browser console:
localStorage.setItem('clear_pusher_cache', 'true');
location.reload();

# 3. After reload, verify:
# - Open DevTools Console
# - Should see: "🧹 [Dev] Auto-clearing Pusher Beams cache..."
# - Refresh one more time

# 4. Enable notifications fresh
# - Log in
# - Enable notifications
# - Check console for new instance ID: a99bec59-b4a1-4182-bac9-c44b18e91162
```

## Verify New Instance is Working

After clearing everything:

1. **Enable notifications**
2. **Check console:**
   ```
   📝 [Pusher Beams] Instance ID: a99bec59-b4a1-4182-bac9-c44b18e91162 ✅
   ```

3. **Check Pusher dashboard:**
   - Should show 1 new device
   - Under instance `a99bec59-b4a1-4182-bac9-c44b18e91162`

4. **Send test notification**

## Disable Auto-Clear After Testing

Once the new instance is working, you can disable auto-clear by commenting it out in `src/main.tsx`:

```typescript
// Auto-clear disabled - instance is stable now
// const shouldClearPusherCache = localStorage.getItem('clear_pusher_cache');
```

---

Done! You can now completely reset and start fresh! 🚀

