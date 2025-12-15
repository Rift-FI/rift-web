# KYC Implementation Guide - Frontend

## Overview

This document explains how the KYC (Know Your Customer) feature has been integrated into your Rift app using Smile ID.

## What Was Implemented

### 1. Frontend Components

#### Files Created:

```
src/
├── features/
│   └── kyc/
│       ├── index.tsx                          # Main KYC flow component
│       ├── context.tsx                        # KYC context provider
│       ├── types.ts                           # TypeScript types
│       ├── constants.ts                       # Country list & ID types
│       └── components/
│           ├── NationalitySelector.tsx        # Country selection step
│           ├── MobileOnlyPrompt.tsx          # Desktop users prompt
│           └── SmileIDVerification.tsx       # Smile ID integration
├── utils/
│   └── device-detector.ts                    # Device detection utilities
└── features/
    └── onboarding/
        └── steps/
            └── kyc.tsx                       # KYC step in onboarding
```

### 2. Onboarding Flow Integration

The KYC step has been added to the signup flow:

```
Start → Phone/Email/Username → OTP → KYC → Created ✅
```

Users can skip KYC during signup (optional), but you can make it mandatory by removing the "Skip for now" button.

## User Flow

### For Mobile Users:

1. **Select Nationality**: User chooses their country from a searchable list
2. **Verification**: User is directed to Smile ID component to:
   - Take a selfie
   - Capture their ID document (front and back)
   - Review and submit
3. **Complete**: After successful verification, user proceeds to wallet

### For Desktop Users:

1. **Select Nationality**: User chooses their country
2. **Mobile Prompt**: User sees a QR code and instructions to continue on mobile
3. User can:
   - Scan QR code with phone
   - Copy link to mobile device
   - Skip and complete KYC later

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Backend API
VITE_API_URL=http://localhost:3000

# Smile ID Configuration
VITE_SMILE_ID_ENV=sandbox
VITE_SMILE_ID_PARTNER_ID=your_partner_id_here

# App Information
VITE_APP_NAME=Rift
VITE_APP_LOGO_URL=https://yourapp.com/logo.png
VITE_PRIVACY_POLICY_URL=https://yourapp.com/privacy
```

### Customization Options

#### 1. Make KYC Mandatory

Remove the skip button in `src/features/onboarding/steps/kyc.tsx`:

```typescript
// Remove or comment out these lines:
<button
  onClick={handleSkipKYC}
  className="w-full text-center text-sm text-muted-foreground hover:text-text-default transition-colors py-2"
>
  Skip for now
</button>
```

#### 2. Add/Remove Countries

Edit `src/features/kyc/constants.ts`:

```typescript
export const COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  // Add more countries here
];
```

#### 3. Change Verification Type

In `src/features/kyc/components/SmileIDVerification.tsx`, you can change the product type:

```typescript
const config = {
  product: "biometric_kyc", // Options: 'biometric_kyc', 'doc_verification', 'smartselfie'
  // ...
};
```

#### 4. Customize Theme

Change the theme color:

```typescript
partner_details: {
  theme_color: '#000', // Your brand color
}
```

## Features

### ✅ Device Detection

- Automatically detects if user is on mobile or desktop
- Shows appropriate UI based on device type
- Provides QR code for desktop users to continue on mobile

### ✅ Country Selection

- Searchable list of supported countries
- Visual country flags for easy identification
- Mobile-optimized interface

### ✅ Smile ID Integration

- Selfie capture with liveness detection
- ID document capture (front and back)
- Real-time verification
- Secure token-based authentication

### ✅ Error Handling

- Graceful error messages
- Retry functionality
- Back navigation support

### ✅ Analytics

- Tracks KYC flow events:
  - KYC started
  - Country selected
  - Verification success/failure
  - KYC skipped

## Testing

### 1. Test on Mobile Device

```bash
# Start dev server
pnpm dev

# Access on mobile via network
# http://your-local-ip:5173
```

### 2. Test Sandbox Results

The backend can control sandbox results:

- `sandbox_result: "0"` → Success
- `sandbox_result: "1"` → Failure
- `sandbox_result: "2"` → Manual review required

### 3. Test Desktop Flow

Open the app on desktop browser and verify:

- QR code displays correctly
- Link copy functionality works
- Skip button works (if enabled)

## Backend Requirements

Your backend needs to implement two endpoints:

### 1. `POST /api/kyc/token`

Generates a web token for Smile ID initialization.

**Request:**

```json
{
  "country_code": "NG"
}
```

**Response:**

```json
{
  "token": "generated_web_token",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### 2. `POST /api/kyc/callback`

Receives verification results from Smile ID.

**Full implementation details in:** `KYC_BACKEND_IMPLEMENTATION.md`

## Integration Checklist

- [x] Install `@smileid/web-components` package
- [x] Create KYC components
- [x] Add KYC step to onboarding flow
- [x] Implement device detection
- [x] Add analytics tracking
- [ ] Set up backend endpoints (see KYC_BACKEND_IMPLEMENTATION.md)
- [ ] Configure environment variables
- [ ] Get Smile ID credentials
- [ ] Test with sandbox
- [ ] Deploy to production

## Common Issues & Solutions

### Issue: Camera not loading

**Solution:** Ensure:

- HTTPS is enabled (required for camera access)
- User granted camera permissions
- Browser supports MediaDevices API

### Issue: Token generation fails

**Solution:** Check:

- Backend endpoint is correct
- API URL in env variables is correct
- User authentication token is valid

### Issue: Callback not received

**Solution:** Verify:

- Callback URL is publicly accessible
- Backend endpoint returns 200 status
- Firewall allows incoming requests

## Security Considerations

### Frontend:

1. **Token Security**: Web tokens expire after 1 hour
2. **No Sensitive Data**: No KYC data stored in localStorage except verification status
3. **HTTPS Required**: Camera access requires secure context
4. **User Consent**: Users are informed about data collection

### Backend:

See `KYC_BACKEND_IMPLEMENTATION.md` for detailed security guidelines.

## Analytics Events

The following events are tracked:

```typescript
// KYC flow started
logEvent("KYC_STEP_STARTED");

// Country selected
logEvent("KYC_COUNTRY_SELECTED", { country: "NG" });

// Verification successful
logEvent("KYC_VERIFICATION_SUCCESS", {
  country: "NG",
  smileJobId: "0000056574",
});

// Verification failed
logEvent("KYC_VERIFICATION_ERROR", {
  country: "NG",
  error: "error_message",
});

// User skipped KYC
logEvent("KYC_SKIPPED");
```

## Progressive Enhancement

### Current Implementation:

- ✅ KYC available during signup
- ✅ Can be skipped (optional)
- ✅ Status stored in localStorage

### Future Enhancements:

1. **Post-signup KYC**: Allow users to complete KYC from settings
2. **KYC Levels**: Implement tier-based verification
3. **Document Types**: Support multiple ID types per country
4. **Re-verification**: Allow users to update KYC info
5. **Partial KYC**: Save progress if user exits mid-flow

## Support

For issues or questions:

- **Smile ID Docs**: https://docs.usesmileid.com/
- **Smile ID Support**: https://usesmileid.com/contact
- **Backend Guide**: See `KYC_BACKEND_IMPLEMENTATION.md`

## Next Steps

1. **Review Implementation**: Check all components work as expected
2. **Set Up Backend**: Follow `KYC_BACKEND_IMPLEMENTATION.md`
3. **Configure Smile ID**: Get production credentials
4. **Test Thoroughly**: Try different devices and scenarios
5. **Deploy**: Push to production when ready

## Quick Start

1. Install dependencies (already done):

   ```bash
   pnpm install
   ```

2. Add environment variables to `.env`:

   ```env
   VITE_API_URL=http://localhost:3000
   VITE_SMILE_ID_ENV=sandbox
   VITE_SMILE_ID_PARTNER_ID=your_partner_id
   ```

3. Start dev server:

   ```bash
   pnpm dev
   ```

4. Sign up as a new user to test the flow

5. Implement backend endpoints (see other guide)

6. Test end-to-end flow

7. Deploy! 🚀
