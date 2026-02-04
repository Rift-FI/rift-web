# Country & Currency Detection System

## How It Works

### 1. **IP-Based Country Detection** (`use-country-detection.tsx`)

The app uses **ipapi.co** (free tier: 1000 requests/day) to detect the user's country based on their IP address.

**Flow:**
1. **Check Cache First**: Looks in `localStorage` for cached country detection (cached for 24 hours)
2. **API Call**: If no cache or cache expired, calls `https://ipapi.co/json/`
3. **Map to Currency**: Maps country code (KE, NG, ET, UG, GH) to currency (KES, NGN, ETB, UGX, GHS)
4. **Fallback**: If country not supported or API fails → defaults to USD

**Supported Countries:**
- 🇰🇪 **Kenya (KE)** → KES
- 🇳🇬 **Nigeria (NG)** → NGN (detected but not fully active)
- 🇪🇹 **Ethiopia (ET)** → ETB
- 🇺🇬 **Uganda (UG)** → UGX
- 🇬🇭 **Ghana (GH)** → GHS
- 🌍 **Other/Unknown** → USD (default)

### 2. **Currency Selection Priority**

When determining which currency to show, the system uses this priority:

1. **User's Manual Selection** (from homepage currency selector) - stored in `localStorage.selected_currency`
2. **Cached Currency** (from previous session)
3. **IP-Detected Country** (from `useCountryDetection()`)
4. **Default**: USD

### 3. **Feature Availability by Country**

## 🇰🇪 Kenya (KES) - **FULLY FEATURED**

**Mobile Money Providers:**
- Safaricom (M-Pesa)

**Withdrawal Account Types:**
- ✅ **Mobile Number** - Send to mobile number (e.g., 0712 345 678)
- ✅ **Paybill** - Pay to business number (requires Paybill Number + Account Number)
- ✅ **Buy Goods** - Pay to till number

**Payment Features:**
- ✅ Send money (with payment type selection: Mobile/Paybill/Buy Goods)
- ✅ Request money
- ✅ Withdraw funds
- ✅ Top up (onramp)

**Special Features:**
- Most advanced payment flow with 3 account types
- Phone number formatting (handles +254, 254, 07 formats)

---

## 🇪🇹 Ethiopia (ETB) - **ACTIVE**

**Mobile Money Providers:**
- Telebirr

**Withdrawal Account Types:**
- ✅ **Mobile Number Only** - Simple phone number input

**Payment Features:**
- ✅ Send money (direct to phone number)
- ✅ Request money
- ✅ Withdraw funds
- ✅ Top up (onramp)

**Special Notes:**
- Simpler flow than Kenya (no Paybill/Buy Goods options)
- Phone placeholder: "0911 234 567"

---

## 🇺🇬 Uganda (UGX) - **ACTIVE**

**Mobile Money Providers:**
- MTN Mobile Money
- Airtel Money

**Withdrawal Account Types:**
- ✅ **Mobile Number Only** - User selects provider (MTN or Airtel), then enters phone number

**Payment Features:**
- ✅ Send money (direct to phone number)
- ✅ Request money
- ✅ Withdraw funds
- ✅ Top up (onramp)

**Special Notes:**
- Provider selection step before phone number input
- Phone placeholder: "0700 123 456"

---

## 🇬🇭 Ghana (GHS) - **ACTIVE**

**Mobile Money Providers:**
- MTN Mobile Money
- AirtelTigo
- Airtel Money

**Withdrawal Account Types:**
- ✅ **Mobile Number Only** - User selects provider, then enters phone number

**Payment Features:**
- ✅ Send money (direct to phone number)
- ✅ Request money
- ✅ Withdraw funds
- ✅ Top up (onramp)

**Special Notes:**
- Provider selection step before phone number input
- Phone placeholder: "0240 123 456"

---

## 🇳🇬 Nigeria (NGN) - **DETECTED BUT NOT ACTIVE**

**Status:** Country is detected, but withdrawals are **NOT available yet**

**What Happens:**
- Country detection works (shows Nigeria)
- Currency selector shows NGN but marked as `available: false`
- Withdrawal setup shows: "🇳🇬 Withdrawals for Nigeria are coming soon!"
- Payment features may be limited

**Mobile Money Providers:**
- None configured yet (empty array in `MOBILE_MONEY_PROVIDERS`)

---

## 🌍 Other Countries / USD - **BASIC FEATURES**

**Status:** Default fallback for unsupported countries

**Features:**
- ✅ Basic wallet functionality
- ✅ USD balance display
- ✅ Blockchain transactions (send/receive crypto)
- ❌ No mobile money withdrawals
- ❌ No local currency payments

---

## Key Code Locations

### Country Detection
- **Hook**: `src/hooks/data/use-country-detection.tsx`
- **API**: `https://ipapi.co/json/`
- **Cache**: `localStorage.detected_country` (24 hours)

### Currency Selection
- **Component**: `src/components/ui/currency-selector.tsx`
- **Storage**: `localStorage.selected_currency`
- **Available Currencies**: KES, ETB, UGX, GHS, USD (NGN detected but not active)

### Payment Account Setup
- **Component**: `src/components/ui/payment-account-setup.tsx`
- **Mobile Money Providers**: Defined in `MOBILE_MONEY_PROVIDERS` constant
- **Country Mismatch Detection**: Prompts user if detected country differs from current withdrawal account

### Payment Flow
- **Kenya (KES)**: Shows payment type selector (Mobile/Paybill/Buy Goods)
- **Other Countries**: Skips type selection, goes directly to amount/recipient

---

## Feature Matrix

| Feature | Kenya (KES) | Ethiopia (ETB) | Uganda (UGX) | Ghana (GHS) | Nigeria (NGN) | USD/Other |
|---------|------------|----------------|--------------|-------------|---------------|-----------|
| **Country Detection** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Currency Display** | ✅ | ✅ | ✅ | ✅ | ⚠️ (not active) | ✅ |
| **Mobile Money Withdrawals** | ✅ (3 types) | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Send Money (Mobile)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Request Money** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Top Up (Onramp)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Paybill Support** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Buy Goods Support** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Provider Selection** | ❌ (Safaricom only) | ❌ (Telebirr only) | ✅ (MTN/Airtel) | ✅ (MTN/AirtelTigo/Airtel) | ❌ | ❌ |

---

## Smart Features

### 1. **Country Mismatch Detection**
If user's detected country differs from their current withdrawal account currency, the app shows a prompt:
- "We detected you are in [Country]"
- "Your current withdrawal account is set up for [Other Country]"
- Option to switch or keep current account

### 2. **Auto-Currency Selection**
On first load, if no manual selection exists:
- Auto-selects currency based on IP-detected country
- Saves to localStorage for future sessions

### 3. **Currency Persistence**
- User's manual currency selection is saved in `localStorage.selected_currency`
- Persists across sessions
- Can override IP detection

---

## Adding New Countries

To add a new country:

1. **Update `use-country-detection.tsx`:**
   - Add country code to `SupportedCountry` type
   - Add to `COUNTRY_TO_CURRENCY` mapping
   - Add to `COUNTRY_NAMES` mapping

2. **Update `currency-selector.tsx`:**
   - Add currency to `SUPPORTED_CURRENCIES` array
   - Set `available: true/false`

3. **Update `payment-account-setup.tsx`:**
   - Add mobile money providers to `MOBILE_MONEY_PROVIDERS`
   - Add country name to `getCountryName()` function

4. **Update payment flows:**
   - Add country to `CountrySelector.tsx` in pay feature
   - Configure payment type flow (if different from others)
