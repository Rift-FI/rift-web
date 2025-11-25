# How to Prompt Users for Notifications

## Current Implementation:
Users can enable notifications manually from their Profile/Settings page using the `NotificationSettings` component.

## Better UX - Prompt After Login/Signup:

### Option 1: Automatic Prompt (Recommended)

Add `NotificationPrompt` to your main app layout after successful login:

```tsx
// In your main app component or layout
import { NotificationPrompt } from "@/components/notifications";

export const App = () => {
  const isAuthenticated = /* your auth check */;
  
  return (
    <>
      {/* Your app content */}
      <YourRoutes />
      
      {/* Show notification prompt for logged-in users */}
      {isAuthenticated && <NotificationPrompt />}
    </>
  );
};
```

### Option 2: Show After Successful Login

```tsx
// In your login success handler
import { NotificationPrompt } from "@/components/notifications";

const LoginPage = () => {
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const handleLoginSuccess = async () => {
    // After successful login
    await login(credentials);
    
    // Show notification prompt
    setShowNotificationPrompt(true);
    
    // Or redirect and show on next page
    navigate("/dashboard");
  };

  return (
    <>
      {/* Login form */}
      
      {showNotificationPrompt && (
        <NotificationPrompt onClose={() => setShowNotificationPrompt(false)} />
      )}
    </>
  );
};
```

### Option 3: Show After First Transaction

```tsx
// Show prompt after user's first payment/transaction
import { NotificationPrompt } from "@/components/notifications";

const TransactionSuccessPage = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if this is user's first transaction
    const isFirstTransaction = /* your logic */;
    
    if (isFirstTransaction) {
      setShowPrompt(true);
    }
  }, []);

  return (
    <>
      <SuccessMessage />
      {showPrompt && <NotificationPrompt />}
    </>
  );
};
```

## The Full Flow (What Happens):

### 1. User Signs Up/Logs In
```
User creates account
       ↓
Redirect to dashboard
       ↓
NotificationPrompt appears (bottom-right corner)
```

### 2. User Clicks "Enable Notifications"
```
Click "Enable Notifications"
       ↓
Browser shows permission dialog
       ↓
User clicks "Allow"
       ↓
FCM token is obtained
       ↓
Token sent to backend
       ↓
Saved in NotificationSubscription table
       ↓
Prompt disappears
       ↓
User can now receive notifications!
```

### 3. Backend Flow (Automatic)
```tsx
// Frontend (already implemented in FCMNotificationService)
await enableNotifications();
  ↓
1. Request browser permission
2. Get FCM token from Firebase
3. Call: rift.notifications.registerSubscription({
     subscriberId: fcmToken,
     platform: "web",
     deviceInfo: "Chrome on macOS"
   })
  ↓
// Backend (already working)
Save to database:
{
  userId: "user123",
  subscriberId: "fcm_token_here...",
  platform: "web",
  isActive: true
}
```

### 4. Sending Notifications (Backend - Already Works!)
```javascript
// Your backend already does this
await sendFirebaseNotification({
  subscriberId: user.fcmToken, // From database
  title: "Payment Received",
  message: "You got $100!",
  targetUrl: "https://wallet.riftfi.xyz/app/payments"
}, firebaseCredentials);
```

## Smart Prompting Strategy:

### Don't Spam Users!
The `NotificationPrompt` component already:
- ✅ Only shows once (remembers if dismissed)
- ✅ Doesn't show if already enabled
- ✅ Stores dismissal in localStorage
- ✅ Can be closed with X button
- ✅ Has "Maybe Later" option

### Best Times to Show:
1. **After signup** - User is engaged and setting up
2. **After first transaction** - They see the value
3. **When viewing transactions** - Relevant context
4. **NOT on every page load** - That's annoying!

### Re-prompt Strategy:
```tsx
// Re-show after 7 days if dismissed
const shouldShowPrompt = () => {
  const dismissed = localStorage.getItem("notificationPromptDismissed");
  const dismissedDate = localStorage.getItem("notificationPromptDismissedDate");
  
  if (!dismissed) return true;
  
  if (dismissedDate) {
    const daysSinceDismissed = 
      (Date.now() - new Date(dismissedDate).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDismissed > 7) {
      // Clear dismissal after 7 days
      localStorage.removeItem("notificationPromptDismissed");
      return true;
    }
  }
  
  return false;
};
```

## Testing:

### Clear Dismissal (for testing):
```javascript
// In browser console
localStorage.removeItem("notificationPromptDismissed");
// Reload page to see prompt again
```

### Check if Token is Saved:
```javascript
// In browser console
const { notificationService } = useNotifications();
console.log(notificationService.getCurrentToken());
```

## Summary:

✅ **Manual option** - Settings page (already there)  
✅ **Automatic prompt** - After login (use `NotificationPrompt`)  
✅ **Backend** - Already handles tokens and sending  
✅ **Smart prompting** - Doesn't spam users  

Choose where to add `<NotificationPrompt />` based on your UX preference!

