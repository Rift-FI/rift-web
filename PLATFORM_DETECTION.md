# Platform Detection - Telegram vs Browser Support

This application now supports running both in Telegram and in regular browsers. The platform detection system automatically determines the environment and adjusts authentication accordingly.

## How it Works

### Platform Detection

- **Telegram Mode**: Detected when `window.Telegram.WebApp` is available
- **Browser Mode**: Detected when running in a regular browser without Telegram WebApp

### Authentication

- **Telegram**: Uses Telegram User ID as `externalId`
- **Browser**: Uses phone number as `externalId`

## Environment Variables

To test browser mode in development, set:

```
VITE_TEST_BROWSER_MODE=true
```

This will:

- Disable Telegram mocking
- Force the app to run in browser mode
- Use phone number authentication instead of Telegram ID

## Development Testing

### Testing Telegram Mode (Default)

```bash
npm run dev
```

- Uses mocked Telegram environment
- Telegram ID authentication
- Shows "Running in Telegram - using Telegram ID as identifier"

### Testing Browser Mode

```bash
npm run dev:browser
```

or

```bash
VITE_TEST_BROWSER_MODE=true npm run dev
```

- Runs in browser mode
- Phone number authentication
- No Telegram SDK initialization
- Shows "Running in browser mode - using phone number as identifier"

## Production Deployment

### Telegram Web App

Deploy normally - the app will automatically detect Telegram environment and use Telegram ID authentication.

### Browser Version

For a browser-only version, you can:

1. Set `VITE_TEST_BROWSER_MODE=true` in production environment
2. Or modify the platform detection logic to always return 'browser'

## Implementation Details

### Key Files Modified

1. **`src/utils/platform.ts`** - Platform detection utilities
2. **`src/hooks/wallet/use-wallet-auth.tsx`** - Updated authentication logic
3. **`src/features/onboarding/steps/code.tsx`** - Platform-aware OTP verification
4. **`src/features/onboarding/steps/identifier.tsx`** - Platform-aware phone input
5. **`src/main.tsx`** - Conditional Telegram SDK initialization

### Platform Detection Functions

```typescript
// Sync version (no hooks)
detectPlatformSync(): 'telegram' | 'browser'

// Hook version with Telegram data
usePlatformDetection(): {
  platform: 'telegram' | 'browser',
  isTelegram: boolean,
  isBrowser: boolean,
  telegramUser: TelegramUser | null,
  initData: InitData | null
}
```

### Authentication Helper

```typescript
// Get appropriate external ID based on platform
getAuthExternalId(phoneNumber?: string): string
```

## User Flow Differences

### Telegram Flow

1. User opens app in Telegram
2. Platform detected as 'telegram'
3. Phone number input for verification
4. OTP verification
5. Account created with Telegram ID as externalId
6. User sees "Running in Telegram" messages

### Browser Flow

1. User opens app in browser
2. Platform detected as 'browser'
3. Phone number input for authentication
4. OTP verification
5. Account created with phone number as externalId
6. User sees "Running in browser mode" messages

## API Changes

The authentication APIs now handle both types of externalId:

- Telegram: `externalId` = Telegram User ID (string)
- Browser: `externalId` = Phone number (string)

## Testing Scenarios

### Manual Testing

1. **Test Telegram mode**: Run `npm run dev` and verify Telegram ID is used
2. **Test Browser mode**: Run `npm run dev:browser` and verify phone number is used
3. **Test Production**: Deploy and test in actual Telegram vs browser

### Key Test Cases

- [ ] Telegram authentication with Telegram ID
- [ ] Browser authentication with phone number
- [ ] OTP flow works in both modes
- [ ] Platform detection is accurate
- [ ] UI shows appropriate messages for each platform
- [ ] Account creation works with correct externalId type

## Usage in Components

```typescript
import { usePlatformDetection } from "@/utils/platform";

function MyComponent() {
  const { isTelegram, isBrowser, telegramUser } = usePlatformDetection();

  if (isTelegram) {
    // Show Telegram-specific UI
    return <TelegramUI user={telegramUser} />;
  }

  if (isBrowser) {
    // Show browser-specific UI
    return <BrowserUI />;
  }
}
```

## Troubleshooting

### Common Issues

1. **Platform detection not working**: Check if `window.Telegram.WebApp` is properly available
2. **Browser mode not activating**: Ensure `VITE_TEST_BROWSER_MODE=true` is set
3. **Authentication failing**: Verify correct externalId is being used for platform

### Debug Information

The app shows platform information in the UI during onboarding:

- "Running in browser mode - using phone number as identifier"
- "Running in Telegram - using Telegram ID as identifier"
