# CapRover Environment Variables Setup

## ⚠️ IMPORTANT: Don't Store Secrets in captain-definition!

The `captain-definition` file is committed to Git, so **never** put sensitive credentials there.

## ✅ Correct Way: Use CapRover Dashboard

### Step 1: Access Your App in CapRover

1. Go to your CapRover dashboard (e.g., `https://captain.yourdomain.com`)
2. Login
3. Click on **Apps**
4. Select your app (e.g., `rift-app`)

### Step 2: Add Environment Variables

1. Click on **"App Configs"** tab
2. Scroll down to **"Environmental Variables"** section
3. Click **"Bulk Edit"** button
4. Add the following variables (one per line):

```bash
# Existing variables (keep these)
VITE_API_URL=https://your-api.com
VITE_APP_NAME=Rift Payment App
NODE_ENV=production
VITE_AGENT_URL=your_value_here
VITE_APP_BURNER_PRIVATE_KEY=your_value_here
VITE_APP_ENV=production
VITE_PROD_BROWSER_MODE=your_value_here
VITE_SDK_API_KEY=your_value_here

# Firebase Configuration (ADD THESE)
VITE_FIREBASE_API_KEY=AIzaSyCBnpA7hXS816DrK-151ISOsg77T8RiOXM
VITE_FIREBASE_AUTH_DOMAIN=rift-c881c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rift-c881c
VITE_FIREBASE_STORAGE_BUCKET=rift-c881c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=156214387744
VITE_FIREBASE_APP_ID=1:156214387444:web:60cc293c34ff99463cc845
VITE_FIREBASE_VAPID_KEY=BMpHlczwdfRH80wvyCFc8xn8YN0TQfnSQYUDBAz_i3yW4pJmfyT6l9ztrBBg9Y9M0qzHlPAXz2BvJfrvZY94dQ57k
```

### Step 3: Save and Rebuild

1. Click **"Save & Update"**
2. Click **"Force Rebuild"** button
3. Wait for deployment to complete

## How It Works

```
CapRover Dashboard Env Vars
         ↓
Passed to Docker build as ARG
         ↓
Dockerfile converts to ENV
         ↓
Available during Vite build
         ↓
Embedded in production bundle
         ↓
App works! ✅
```

## Benefits of This Approach

✅ **Secure** - Not in Git repository  
✅ **Easy to update** - Change in dashboard, rebuild  
✅ **Per-environment** - Different values for staging/production  
✅ **Team-friendly** - Other devs don't see prod secrets  

## Troubleshooting

### Error: "Missing App configuration value"
→ Variable not set in CapRover dashboard. Add it and rebuild.

### Error: "atob" or encoding issues
→ VAPID key has special characters. Make sure it's set in dashboard, not in `captain-definition`.

### Changes not taking effect
→ Click "Force Rebuild" after changing env vars.

## Security Best Practices

❌ **Never do this:**
```json
// captain-definition (WRONG - gets committed to Git!)
{
  "envVars": {
    "VITE_FIREBASE_API_KEY": "AIzaSy..." // ❌ DON'T!
  }
}
```

✅ **Do this instead:**
```
CapRover Dashboard → App Configs → Environmental Variables
Add: VITE_FIREBASE_API_KEY=AIzaSy... ✅
```

## Notes

- Environment variables starting with `VITE_` are embedded in the frontend bundle
- They are **not secret** after build (visible in browser)
- For truly sensitive keys, use backend-only environment variables
- Firebase web keys are meant to be public (protected by Firebase rules)
- The VAPID key is safe to expose in frontend code
