# Pusher Beams Configuration

## Current Instance

**Instance ID:** `a99bec59-b4a1-4182-bac9-c44b18e91162`

**Primary Key (Backend Only):** `09D06C51222B176EBA5A4E8C949B1E10AAEE5CD59C11ED2E5B401B97F84E76E8`

⚠️ **NEVER expose the primary key in frontend code!**

## Environment Variables

### Frontend (.env)
```bash
VITE_PUSHER_BEAMS_INSTANCE_ID=a99bec59-b4a1-4182-bac9-c44b18e91162
```

### Backend (.env)
```bash
PUSHER_BEAMS_INSTANCE_ID=a99bec59-b4a1-4182-bac9-c44b18e91162
PUSHER_BEAMS_SECRET_KEY=09D06C51222B176EBA5A4E8C949B1E10AAEE5CD59C11ED2E5B401B97F84E76E8
```

## Backend Implementation

```typescript
import PushNotifications from '@pusher/push-notifications-server';

const beamsClient = new PushNotifications({
  instanceId: 'a99bec59-b4a1-4182-bac9-c44b18e91162',
  secretKey: '09D06C51222B176EBA5A4E8C949B1E10AAEE5CD59C11ED2E5B401B97F84E76E8',
});

// Auth endpoint
app.post('/notifications/pusher-beams-auth', async (req, res) => {
  const userId = req.user.id;
  const beamsToken = beamsClient.generateToken(userId);
  res.json(beamsToken);
});

// Send notification
await beamsClient.publishToUsers([userId], {
  web: {
    notification: {
      title: 'Test',
      body: 'Hello!',
      icon: 'https://wallet.riftfi.xyz/rift.png',
    },
  },
});
```

## Pusher Dashboard

**URL:** https://dashboard.pusher.com/beams

**Instance:** `a99bec59-b4a1-4182-bac9-c44b18e91162`

### Required Settings:

**Allowed Origins:**
- `http://localhost:5173`
- `https://wallet.riftfi.xyz`

Add any other domains your app runs on.

---

Updated! ✅

