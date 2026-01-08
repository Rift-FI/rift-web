# KYC Quick Start Guide

## 🚀 What's Been Implemented

A complete KYC (Know Your Customer) flow has been added to your Rift app using **Smile ID** for identity verification.

### ✨ Features

- 🌍 Country/nationality selection
- 📱 Automatic mobile/desktop detection
- 🖼️ QR code for desktop users to continue on mobile
- 📸 Selfie + ID document capture
- ✅ Real-time verification with Smile ID
- 📊 Analytics tracking
- 🔄 Skip option (can be made mandatory)

---

## 📋 Implementation Checklist

### ✅ Frontend (DONE)

- [x] Installed `@smileid/web-components` package
- [x] Created KYC components and flow
- [x] Integrated into onboarding flow
- [x] Added device detection
- [x] Added analytics tracking
- [x] Created documentation

### ⚠️ Backend (TODO - Required for KYC to work)

- [ ] Implement `/api/kyc/token` endpoint
- [ ] Implement `/api/kyc/callback` endpoint
- [ ] Get Smile ID credentials
- [ ] Set up database schema
- [ ] Configure environment variables

### 🔧 Configuration (TODO)

- [ ] Add environment variables to `.env`
- [ ] Update API URL
- [ ] Add Smile ID Partner ID

---

## 🛠️ Setup Instructions

### Step 1: Configure Environment Variables

Create a `.env` file (or update existing) with:

```env
# Backend API
VITE_API_URL=https://70f763cc5e5e.ngrok-free.app

# Smile ID Configuration
VITE_SMILE_ID_ENV=sandbox
VITE_SMILE_ID_PARTNER_ID=your_partner_id_here

# App Information
VITE_APP_NAME=Rift
VITE_APP_LOGO_URL=https://yourapp.com/logo.png
VITE_PRIVACY_POLICY_URL=https://yourapp.com/privacy
```

### Step 2: Set Up Smile ID Account

1. Go to https://usesmileid.com
2. Sign up for an account
3. Get your credentials:
   - Partner ID
   - API Key
   - Sandbox credentials

### Step 3: Implement Backend Endpoints

**Full guide:** `KYC_BACKEND_IMPLEMENTATION.md`

**Quick summary:**

```typescript
// 1. Generate web token
POST /api/kyc/token
Body: { "country_code": "NG" }
Response: { "token": "...", "expires_at": "..." }

// 2. Receive verification results
POST /api/kyc/callback
Body: { /* Smile ID result payload */ }
Response: { "success": true }
```

### Step 4: Test the Flow

```bash
# Start dev server
pnpm dev

# Access on mobile (required for camera)
http://your-local-ip:5173

# Or scan QR code if on desktop
```

---

## 📱 User Flow

### New User Signup:

```
1. Start → Choose auth method (phone/email/username)
2. Verify with OTP/password
3. 🆕 KYC Step:
   a. Select nationality
   b. [If desktop] → Show QR code to continue on mobile
   c. [If mobile] → Capture selfie & ID
   d. Submit for verification
4. Wallet Created ✅
```

### Desktop Users:

- See QR code to continue on mobile
- Can copy link to phone
- Can skip (if enabled)

### Mobile Users:

- Direct camera access
- Guided selfie capture
- ID document capture
- Instant submission

---

## 🎨 Customization Options

### 1. Make KYC Mandatory

In `src/features/onboarding/steps/kyc.tsx`:

```typescript
// Remove or comment out:
<button onClick={handleSkipKYC}>Skip for now</button>
```

### 2. Add More Countries

In `src/features/kyc/constants.ts`:

```typescript
export const COUNTRIES: Country[] = [
  { code: "XX", name: "Your Country", flag: "🏴" },
  // ...
];
```

### 3. Change Theme Color

In `src/features/kyc/components/SmileIDVerification.tsx`:

```typescript
partner_details: {
  theme_color: "#your-brand-color";
}
```

### 4. Change Verification Type

```typescript
product: "biometric_kyc"; // or 'doc_verification', 'smartselfie'
```

---

## 🧪 Testing

### Sandbox Mode

1. Set `VITE_SMILE_ID_ENV=sandbox` in `.env`
2. Backend controls results with `sandbox_result` parameter:
   - `"0"` = Success ✅
   - `"1"` = Failure ❌
   - `"2"` = Manual review required 👀

### Test Checklist

- [ ] Sign up as new user
- [ ] See KYC step after OTP
- [ ] Select a country
- [ ] On desktop: See QR code
- [ ] On mobile: See camera interface
- [ ] Complete verification
- [ ] See success message
- [ ] Redirected to wallet

---

## 📊 Analytics Events

The following events are automatically tracked:

```javascript
KYC_STEP_STARTED;
KYC_COUNTRY_SELECTED;
KYC_VERIFICATION_SUCCESS;
KYC_VERIFICATION_ERROR;
KYC_SKIPPED;
```

---

## 🔒 Security Features

- ✅ Token-based authentication
- ✅ 1-hour token expiry
- ✅ HTTPS required for camera
- ✅ No sensitive data in localStorage
- ✅ Secure callback verification
- ✅ User consent required

---

## 📚 Documentation Files

| File                            | Description                |
| ------------------------------- | -------------------------- |
| `KYC_QUICK_START.md`            | This file - quick overview |
| `KYC_IMPLEMENTATION_GUIDE.md`   | Detailed frontend guide    |
| `KYC_BACKEND_IMPLEMENTATION.md` | Complete backend guide     |
| `src/features/kyc/README.md`    | Component documentation    |
| `smileId-doc.md`                | Original Smile ID docs     |

---

## 🚨 Common Issues

### Camera not loading

- ✅ Must use HTTPS (or localhost)
- ✅ User must grant camera permission
- ✅ Browser must support MediaDevices API

### Token generation fails

- ⚠️ Backend not running
- ⚠️ Wrong API URL in `.env`
- ⚠️ Invalid auth token

### Callback not received

- ⚠️ Callback URL not publicly accessible
- ⚠️ Firewall blocking requests
- ⚠️ Backend not returning 200

---

## 🎯 Next Steps

### Immediate (Required):

1. ✅ Review frontend implementation
2. 📝 Read `KYC_BACKEND_IMPLEMENTATION.md`
3. 🔧 Implement backend endpoints
4. 🔑 Get Smile ID credentials
5. ⚙️ Configure environment variables

### Soon (Recommended):

6. 🧪 Test with sandbox
7. 📱 Test on mobile device
8. 🔍 Review security measures
9. 📊 Set up monitoring
10. 🚀 Deploy to production

### Later (Optional):

11. 🎨 Customize theme
12. 🌍 Add more countries
13. 📈 Analyze KYC completion rates
14. 🔄 Implement re-verification
15. ⚡ Add progressive KYC levels

---

## 💡 Pro Tips

1. **Start with sandbox**: Test thoroughly before going live
2. **Mobile first**: Most users will complete KYC on mobile
3. **Good lighting**: Advise users to find well-lit areas
4. **Clear instructions**: The UI provides guidance, but consider adding tooltips
5. **Monitoring**: Track completion rates and failure reasons
6. **Support**: Have a fallback for users who can't complete KYC

---

## 🆘 Need Help?

### Resources:

- 📖 [Smile ID Docs](https://docs.usesmileid.com/)
- 💬 [Smile ID Support](https://usesmileid.com/contact)
- 📄 Backend Guide: `KYC_BACKEND_IMPLEMENTATION.md`
- 📄 Frontend Guide: `KYC_IMPLEMENTATION_GUIDE.md`

### Support Channels:

- Check the documentation files
- Review Smile ID documentation
- Contact Smile ID support for API issues

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ New users see KYC step after signup
2. ✅ Country selection works smoothly
3. ✅ Desktop users see QR code
4. ✅ Mobile users can access camera
5. ✅ Selfie capture works
6. ✅ ID document capture works
7. ✅ Verification completes successfully
8. ✅ Callback received on backend
9. ✅ User verification status updated
10. ✅ User proceeds to wallet

---

## 🎉 Deployment Checklist

Before going to production:

- [ ] Backend endpoints implemented and tested
- [ ] Environment variables configured (production)
- [ ] Smile ID production credentials obtained
- [ ] HTTPS enabled on all endpoints
- [ ] Database schema created
- [ ] Callback URL publicly accessible
- [ ] Error handling tested
- [ ] Logging and monitoring set up
- [ ] Security review completed
- [ ] User testing completed
- [ ] Analytics validated
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Support documentation ready

---

**Ready to go? Start with the backend implementation!**

👉 See: `KYC_BACKEND_IMPLEMENTATION.md`
