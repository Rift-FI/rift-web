# KYC Feature

## Overview

This directory contains the KYC (Know Your Customer) implementation using Smile ID for identity verification.

## Components

### `index.tsx`

Main KYC flow component that orchestrates the entire verification process.

### `context.tsx`

React context for managing KYC state across components.

### `types.ts`

TypeScript type definitions for KYC data structures.

### `constants.ts`

Country lists and ID type configurations.

### Components Directory

#### `NationalitySelector.tsx`

Allows users to select their country from a searchable list of supported countries.

**Features:**

- Search functionality
- Country flags for visual identification
- Mobile-optimized UI
- Selection validation

#### `MobileOnlyPrompt.tsx`

Displays when desktop users try to access KYC. Shows QR code and link to continue on mobile device.

**Features:**

- QR code generation
- Copy link functionality
- User-friendly instructions
- Responsive design

#### `SmileIDVerification.tsx`

Main integration component for Smile ID web component.

**Features:**

- Token generation
- Selfie capture
- ID document capture
- Error handling
- Success/failure callbacks

## Usage

### Basic Usage

```tsx
import KYCFlow from "@/features/kyc";

function App() {
  return <KYCFlow />;
}
```

### With Context

```tsx
import { KYCProvider, useKYC } from "@/features/kyc/context";

function MyComponent() {
  const { kycData, isKycComplete } = useKYC();

  return <div>{isKycComplete ? "Verified ✅" : "Not verified"}</div>;
}

function App() {
  return (
    <KYCProvider>
      <MyComponent />
    </KYCProvider>
  );
}
```

### In Onboarding Flow

The KYC step is already integrated into the onboarding flow at `src/features/onboarding/steps/kyc.tsx`.

## Configuration

### Required Environment Variables

```env
VITE_API_URL=https://70f763cc5e5e.ngrok-free.app
VITE_SMILE_ID_ENV=sandbox
VITE_SMILE_ID_PARTNER_ID=your_partner_id
VITE_APP_NAME=Rift
VITE_APP_LOGO_URL=https://yourapp.com/logo.png
VITE_PRIVACY_POLICY_URL=https://yourapp.com/privacy
```

### Backend Requirements

Your backend must implement:

1. `POST /api/kyc/token` - Generate web token
2. `POST /api/kyc/callback` - Receive verification results

See `KYC_BACKEND_IMPLEMENTATION.md` in the root directory for details.

## Device Detection

The KYC flow automatically detects the user's device type:

- **Mobile**: Direct to verification
- **Desktop**: Show QR code prompt

This is handled by the `device-detector.ts` utility.

## Supported Countries

Current list includes major African countries and select international markets. To add more countries, edit `constants.ts`:

```typescript
export const COUNTRIES: Country[] = [
  { code: "XX", name: "New Country", flag: "🏴" },
  // ...
];
```

## Analytics

The following events are tracked:

- `KYC_STEP_STARTED`
- `KYC_COUNTRY_SELECTED`
- `KYC_VERIFICATION_SUCCESS`
- `KYC_VERIFICATION_ERROR`
- `KYC_SKIPPED`

## Customization

### Theme Color

Change in `SmileIDVerification.tsx`:

```typescript
partner_details: {
  theme_color: "#your-color-here";
}
```

### Product Type

Options: `biometric_kyc`, `doc_verification`, `smartselfie`

### Skip Option

To make KYC mandatory, remove the skip button in `onboarding/steps/kyc.tsx`.

## Testing

### Test with Sandbox

1. Set `VITE_SMILE_ID_ENV=sandbox`
2. Backend can control results with `sandbox_result` parameter
3. No real ID verification is performed

### Test on Mobile

```bash
pnpm dev
# Access via http://your-local-ip:5173 on mobile
```

## Troubleshooting

### Camera Not Working

- Ensure HTTPS is enabled
- Check browser permissions
- Verify MediaDevices API support

### Token Generation Fails

- Check API URL
- Verify backend is running
- Check authentication token

### Callback Not Received

- Ensure callback URL is accessible
- Check backend logs
- Verify endpoint returns 200

## Security Notes

- Web tokens expire after 1 hour
- No sensitive KYC data stored in frontend
- HTTPS required for camera access
- User consent obtained before verification

## Dependencies

- `@smileid/web-components` - Smile ID web components
- `qrcode.react` - QR code generation
- `motion/react` - Animations
- `sonner` - Toast notifications

## Further Reading

- [Smile ID Documentation](https://docs.usesmileid.com/)
- [KYC Backend Implementation Guide](../../../KYC_BACKEND_IMPLEMENTATION.md)
- [KYC Implementation Guide](../../../KYC_IMPLEMENTATION_GUIDE.md)
