# 🚀 Farcaster MiniApp Deployment Guide

## Overview
Rift Wallet is now configured to run as a Farcaster MiniApp. This is a **minimal, zero-dependency integration** - your existing app will render inside Farcaster/Warpcast with no code changes required.

---

## ✅ What Was Done

### 1. **Farcaster Manifest Created**
- **Location:** `/public/.well-known/farcaster.json`
- **Purpose:** Tells Farcaster how our app should appear in the app store
- **Content:** App name, description, icons, and metadata

### 2. **Platform Detection Updated**
- **Location:** `/src/utils/platform.ts`
- **Changes:** 
  - Added `"farcaster"` to `PlatformType`
  - Detection logic checks for Farcaster/Warpcast URLs
  - Added `isFarcaster` and `farcasterUser` to hook return

### 3. **Frame Meta Tags Added**
- **Location:** `/index.html`
- **Purpose:** Makes the app shareable as a Farcaster Frame
- **Benefit:** Users can share the MiniApp in Farcaster posts

### 4. **Type Fixes**
- **Location:** `/src/lib/walletconnect-platform.ts`
- **Changes:** Updated to support Farcaster platform type

---

## 📦 Dependencies

**Zero new dependencies!** 

The app works in Farcaster using only the manifest file approach.

---

## 🚀 Deployment Steps

### Step 1: Build The App

```bash
pnpm build
```

This creates an optimized production build in `/dist`.

### Step 2: Deploy to Production

Deploy to your hosting provider (Vercel, Railway, etc.) as usual. Ensure your app is live at:

```
https://wallet.riftfi.xyz
```

**Critical:** Your deployment MUST serve the `.well-known` directory. Verify your build includes:
```
dist/
  .well-known/
    farcaster.json
```

### Step 3: Verify Manifest Accessibility

After deployment, visit this URL in your browser:

```
https://wallet.riftfi.xyz/.well-known/farcaster.json
```

**Expected Response:**
```json
{
  "miniapp": {
    "version": "1",
    "name": "Rift Wallet",
    "homeUrl": "https://wallet.riftfi.xyz",
    "iconUrl": "https://wallet.riftfi.xyz/rift.png",
    "splashImageUrl": "https://wallet.riftfi.xyz/rift.png",
    "splashBackgroundColor": "#2E8C96",
    "description": "Accept USDC and M-Pesa payments...",
    ...
  }
}
```

If you get a 404, check your hosting provider's static file serving configuration.

### Step 4: Register on Base App Directory

1. **Visit:** https://base.dev or https://www.base.org/ecosystem
2. **Find:** "Submit Your App" or "Register MiniApp" button
3. **Fill in:**
   - **App Name:** Rift Wallet
   - **App URL:** `https://wallet.riftfi.xyz`
   - **Manifest URL:** `https://wallet.riftfi.xyz/.well-known/farcaster.json`
   - **Category:** Finance / Payments
   - **Description:** "Instant USDC ↔ M-Pesa conversions. Accept crypto payments and convert to KES on Base."
   - **Tags:** `usdc`, `mpesa`, `payments`, `wallet`, `base`, `kenya`

4. **Verify Ownership:**
   - They may require DNS verification
   - Or verification via the manifest file (already done)

5. **Submit & Wait:**
   - Approval typically takes 1-3 business days
   - You'll receive a notification email

### Step 5: Test in Warpcast (Before Approval)

You can test your MiniApp before approval:

#### **On Mobile (Warpcast App):**
1. Open Warpcast app
2. Go to Settings → Developer Tools (if available)
3. Paste your URL: `https://wallet.riftfi.xyz`
4. Tap "Launch as MiniApp"

#### **On Desktop:**
1. Visit: https://warpcast.com/~/developers
2. Use "Preview Mini App" tool
3. Enter your URL
4. Click "Launch"

### Step 6: Share Your MiniApp

Once approved, you'll get a MiniApp link like:
```
https://minikit.xyz/rift-wallet
```

Or you can share directly in Farcaster posts - the Frame meta tags will make it render beautifully.

---

## 🧪 Testing Platform Detection

Your app now automatically detects when running in Farcaster:

```typescript
import { usePlatformDetection } from "@/utils/platform";

function MyComponent() {
  const { platform, isFarcaster, farcasterUser } = usePlatformDetection();

  if (isFarcaster) {
    console.log("Running inside Farcaster/Warpcast!");
    // Optional: Show Farcaster-specific UI
  }

  return <div>Platform: {platform}</div>;
}
```

**Detection Logic:**
- Checks if URL contains `farcaster.xyz` or `warpcast.com`
- Checks if running in iframe (common for miniapps)
- Checks `window.farcaster.isConnected`

---

## 📁 Files Modified Summary

```
✅ /public/.well-known/farcaster.json      # NEW - Manifest file
✅ /src/utils/platform.ts                   # Added Farcaster detection
✅ /index.html                              # Added Frame meta tags
✅ /src/lib/walletconnect-platform.ts      # Type fixes
✅ /FARCASTER_DEPLOYMENT.md                 # This guide
```

**No other files were changed.** Your existing app logic remains untouched.

---

## 🐛 Troubleshooting

### Problem: Manifest returns 404

**Symptoms:**
- `https://wallet.riftfi.xyz/.well-known/farcaster.json` → 404 Not Found

**Solutions:**
1. Check if `/public/.well-known/farcaster.json` exists in your repo
2. Verify Vite copies `/public` to `/dist` during build:
   ```bash
   ls dist/.well-known/farcaster.json
   ```
3. Check hosting provider settings:
   - **Vercel:** Automatically serves `/public` - should work
   - **Netlify:** Add redirect rule if needed
   - **Railway:** Check static file serving

4. Verify no `.htaccess` or nginx rules blocking `.well-known`

### Problem: App doesn't render in Warpcast

**Symptoms:**
- Blank screen or loading forever in Warpcast

**Solutions:**
1. **Check HTTPS:** Farcaster requires valid SSL certificate
2. **Check CORS:** Ensure your API endpoints allow Farcaster origins
3. **Check CSP Headers:** Content-Security-Policy may block iframe embedding
   - Add to your hosting config:
     ```
     Content-Security-Policy: frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com;
     ```
4. **Check Console:** Open Warpcast dev tools and check for errors
5. **Test in browser first:** Verify `https://wallet.riftfi.xyz` loads normally

### Problem: Platform detection not working

**Symptoms:**
- `isFarcaster` is always `false` inside Warpcast

**Solutions:**
1. Check if URL contains expected patterns:
   ```javascript
   console.log(window.location.href);
   // Should contain 'farcaster.xyz' or 'warpcast.com'
   ```
2. Check iframe detection:
   ```javascript
   console.log(window.parent !== window); // Should be true
   ```
3. Try explicit detection:
   ```javascript
   console.log(window.farcaster?.isConnected);
   ```

### Problem: Registration rejected

**Symptoms:**
- Base rejects your MiniApp submission

**Common Reasons:**
1. **Manifest not accessible** - Fix Step 3 first
2. **Invalid manifest format** - Validate JSON syntax
3. **Missing required images** - Ensure icons are accessible
4. **Duplicate app** - Check if similar app exists
5. **Policy violation** - Review Base's MiniApp guidelines

---

## 📊 Analytics & Monitoring

After deployment, monitor:

1. **Platform Distribution:**
   ```typescript
   // In your analytics
   logEvent("APP_LAUNCH", { platform: isFarcaster ? "farcaster" : platform });
   ```

2. **Farcaster User Engagement:**
   - Track signup rate from Farcaster users
   - Monitor transaction success rates
   - Compare retention vs Telegram users

3. **Error Rates:**
   - Watch for Farcaster-specific errors
   - Monitor API failures from Farcaster origins

---

## 🔐 Security Considerations

1. **iframe Security:**
   - Your app runs in an iframe inside Farcaster
   - Implement clickjacking protection
   - Validate message origins if using `postMessage`

2. **CORS Configuration:**
   - Allow Farcaster origins for API calls
   - Don't use wildcard `*` in production

3. **Authentication:**
   - Current auth flow works as-is (phone OTP, email, username+password)
   - Consider adding Farcaster FID-based auth in future (requires more integration)

---

## 🎯 What's Next (Optional Enhancements)

These are **NOT required** but can enhance the experience:

### 1. Farcaster-Specific Auth
Instead of phone OTP, allow login with Farcaster ID:
- Requires: `@farcaster/auth-kit` (future enhancement)
- Benefit: Seamless login for Farcaster users

### 2. Frame Actions
Add interactive Frame buttons for common actions:
- Requires: Frame server endpoints
- Benefit: Users can send/receive USDC directly from posts

### 3. Farcaster-Optimized UI
Detect Farcaster and show simplified onboarding:
```typescript
if (isFarcaster) {
  // Skip Telegram-specific features
  // Emphasize Base/USDC features
}
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Build completes without errors: `pnpm build`
- [ ] Manifest file exists: `dist/.well-known/farcaster.json`
- [ ] App deployed to: `https://wallet.riftfi.xyz`
- [ ] Manifest accessible: `https://wallet.riftfi.xyz/.well-known/farcaster.json`
- [ ] Icons accessible: `https://wallet.riftfi.xyz/rift.png`
- [ ] HTTPS working (valid SSL)
- [ ] App loads normally in browser
- [ ] No CORS errors in console
- [ ] Platform detection tested locally

After deployment:

- [ ] Submitted to Base App Directory
- [ ] Tested in Warpcast (preview mode)
- [ ] Analytics tracking Farcaster users
- [ ] Error monitoring configured
- [ ] Team notified of new platform

---

## 📞 Support & Resources

- **Base Docs:** https://docs.base.org/mini-apps/
- **Farcaster Docs:** https://docs.farcaster.xyz/
- **Warpcast Dev Tools:** https://warpcast.com/~/developers
- **Base Discord:** https://base.org/discord

---

## 📝 Technical Notes

### How Farcaster MiniApps Work

1. **Manifest-Based Registration:**
   - Farcaster reads your `farcaster.json` manifest
   - Registers your app in their directory
   - No SDK required for basic integration

2. **iframe Rendering:**
   - Your app loads inside Farcaster's iframe
   - Full DOM access, normal React rendering
   - Standard browser APIs work

3. **No Special Authentication:**
   - Your existing Rift auth flow works as-is
   - Users authenticate with phone/email/username
   - (Optional: Add Farcaster auth later)

### Why This Works

Your app is a **standard web app**. Farcaster simply:
- Loads it in an iframe
- Displays it in their app
- Provides discovery through their directory

**No special integration needed!** That's the beauty of this approach.

---

**Last Updated:** October 16, 2025  
**Integration Type:** Manifest-Based (Zero Dependencies)  
**Status:** Ready for Deployment  
**Approval Time:** 1-3 business days
