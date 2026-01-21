# Pretium Fee Integration Guide

## Overview

A **1% fee** (100 basis points) is charged on all onramp and offramp transactions.

### Configuration (`src/constants.ts`)

```typescript
export const PRETIUM_FEE_BPS = 100;  // 1% fee (100 basis points)
```

---

## How Fees Work

### Offramp (USDC → Fiat) - Fee is ADDED to deduction

**User wants to RECEIVE 1000 KES, we deduct MORE to cover fee:**

```
User wants to receive:  1,000 KES
Fee (1%):               +10 KES
────────────────────────────────
Total to deduct:        1,010 KES worth of USDC
USDC deducted:          1,010 ÷ 130 = 7.77 USDC
────────────────────────────────
User receives:          1,000 KES ✓
Rift collects:          10 KES
```

**To Pretium API:**
```json
{
  "amount": 1010,   // Total fiat (user gets + fee)
  "fee": 10         // Fee for Rift
}
```
Pretium pays user: `1010 - 10 = 1000 KES` ✓

---

### Onramp (Fiat → USDC) - Fee is ADDED to payment

**User wants 10 USDC, pays extra to cover fee:**

```
User wants:             10 USDC
Fiat value:             10 × 132 = 1,320 KES
Fee (1%):               +13 KES
────────────────────────────────
User pays:              1,333 KES
────────────────────────────────
User receives:          10 USDC ✓
Rift collects:          13 KES
```

**To Pretium API:**
```json
{
  "amount": 1333,   // Total to collect (fiat + fee)
  "fee": 13         // Fee for Rift
}
```

---

## Frontend Integration

---

## 🔄 OFFRAMP FLOW (Complete Guide)

### Step 1: User Opens Withdraw Screen

User sees a form with:
- USDC amount input
- Phone number input
- Network selector (Safaricom, etc.)

### Step 2: User Enters USDC Amount

```
User types: 10 USDC
```

### Step 3: Frontend Calls Preview API

```typescript
const response = await fetch('/api/offramp/preview-exchange-rate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currency: 'KES',
    amount: 10,        // USDC amount user entered
    type: 'offramp'
  })
});

const data = await response.json();
// data.feeBreakdown contains everything you need
```

### Step 4: Frontend Shows Fee Breakdown

From the API response, display:

```typescript
const { feeBreakdown } = data;

// feeBreakdown = {
//   usdcAmount: 10,              // What user entered
//   userReceivesFiat: 1300,      // KES user will receive
//   fee: 13,                     // Fee in KES
//   totalFiatDeducted: 1313,     // Total KES value deducted
//   totalUsdcNeeded: 10.1,       // USDC needed (CHECK THIS!)
//   feePercentage: 1,            // 1%
//   exchangeRate: 130
// }
```

**Display to user:**
```
┌─────────────────────────────────────┐
│  You receive:    1,300 KES          │
│  Fee (1%):       13 KES             │
│  ─────────────────────────────────  │
│  USDC to deduct: 10.1 USDC          │
└─────────────────────────────────────┘
```

### Step 5: Frontend Checks User Balance

**⚠️ CRITICAL: User needs MORE USDC than they entered!**

```typescript
const userBalance = getUserUsdcBalance(); // e.g., 50 USDC
const usdcNeeded = feeBreakdown.totalUsdcNeeded; // e.g., 10.1 USDC

if (userBalance < usdcNeeded) {
  // Show error - not enough balance
  showError(`Insufficient balance. You need ${usdcNeeded.toFixed(4)} USDC but only have ${userBalance} USDC`);
  disableSubmitButton();
  return;
}

// ✅ User has enough, enable submit button
enableSubmitButton();
```

### Step 6: User Confirms & Frontend Calls Offramp API

```typescript
const offrampResponse = await fetch('/api/offramp/offramp', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    token: 'USDC',
    amount: 10,                    // USDC amount (same as preview)
    currency: 'KES',
    chain: 'BASE',
    recipient: JSON.stringify({
      type: 'MOBILE',
      accountIdentifier: '0712345678',
      institution: 'Safaricom'
    })
  })
});

const result = await offrampResponse.json();
```

### Step 7: Show Success with Details

```typescript
// result.order = {
//   id: "pretium_123_abc",
//   status: "processing",
//   amount: 1300,              // KES user receives
//   totalDeducted: 1313,       // Total KES value
//   usdcDeducted: 10.1,        // USDC taken from wallet
//   fee: 13,                   // Fee charged
//   feePercentage: 1,
//   transactionCode: "uuid-from-pretium"
// }
```

**Display success:**
```
┌─────────────────────────────────────┐
│  ✅ Withdrawal Processing!          │
│                                     │
│  You will receive: 1,300 KES        │
│  Fee charged:      13 KES           │
│  USDC deducted:    10.1 USDC        │
│                                     │
│  Transaction: pretium_123_abc       │
└─────────────────────────────────────┘
```

---

## 📝 Complete Frontend Code Example

```typescript
// offramp.ts

interface FeeBreakdown {
  usdcAmount: number;
  userReceivesFiat: number;
  fee: number;
  totalFiatDeducted: number;
  totalUsdcNeeded: number;
  feePercentage: number;
  exchangeRate: number;
}

// Step 1: Get fee preview when user enters amount
async function getOfframpPreview(usdcAmount: number, currency: string): Promise<FeeBreakdown> {
  const response = await fetch('/api/offramp/preview-exchange-rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency, amount: usdcAmount, type: 'offramp' })
  });
  const data = await response.json();
  return data.feeBreakdown;
}

// Step 2: Check if user can proceed
function canUserOfframp(feeBreakdown: FeeBreakdown, userBalance: number): { 
  canProceed: boolean; 
  error?: string 
} {
  if (userBalance < feeBreakdown.totalUsdcNeeded) {
    return {
      canProceed: false,
      error: `Need ${feeBreakdown.totalUsdcNeeded.toFixed(4)} USDC (includes ${feeBreakdown.fee} ${currency} fee). You have ${userBalance} USDC.`
    };
  }
  return { canProceed: true };
}

// Step 3: Execute offramp
async function executeOfframp(
  usdcAmount: number,
  currency: string,
  phoneNumber: string,
  network: string
) {
  const response = await fetch('/api/offramp/offramp', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      token: 'USDC',
      amount: usdcAmount,
      currency: currency,
      chain: 'BASE',
      recipient: JSON.stringify({
        type: 'MOBILE',
        accountIdentifier: phoneNumber,
        institution: network
      })
    })
  });
  return response.json();
}

// Usage in React component
function OfframpForm() {
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<FeeBreakdown | null>(null);
  const [error, setError] = useState('');
  const userBalance = useUserBalance(); // Your hook to get balance

  // When amount changes, fetch preview
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      getOfframpPreview(parseFloat(amount), 'KES')
        .then(setPreview)
        .catch(console.error);
    }
  }, [amount]);

  // Check balance when preview updates
  useEffect(() => {
    if (preview) {
      const check = canUserOfframp(preview, userBalance);
      if (!check.canProceed) {
        setError(check.error!);
      } else {
        setError('');
      }
    }
  }, [preview, userBalance]);

  return (
    <div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="USDC Amount"
      />
      
      {preview && (
        <div className="fee-breakdown">
          <p>You receive: {preview.userReceivesFiat} KES</p>
          <p>Fee ({preview.feePercentage}%): {preview.fee} KES</p>
          <p>USDC needed: {preview.totalUsdcNeeded.toFixed(4)} USDC</p>
          <p>Your balance: {userBalance} USDC</p>
        </div>
      )}
      
      {error && <p className="error">{error}</p>}
      
      <button disabled={!!error || !preview}>
        Withdraw {preview?.userReceivesFiat || 0} KES
      </button>
    </div>
  );
}
```

---

## ⚡ Quick Reference

| What | Value |
|------|-------|
| User inputs | USDC amount |
| User receives | Full KES value of USDC |
| We deduct | USDC + fee worth of USDC |
| Fee comes from | Extra USDC deducted |
| Balance check | `userBalance >= totalUsdcNeeded` |

---

## 🔄 ONRAMP FLOW (Complete Guide)

### How Onramp Works

**User wants to BUY USDC with M-Pesa. They pay EXTRA fiat to cover the fee.**

```
User wants:        10 USDC
USDC value:        10 × 132 = 1,320 KES
Fee (1%):          +13 KES
────────────────────────────────────
User pays:         1,333 KES (via M-Pesa STK push)
User receives:     10 USDC ✓
Rift collects:     13 KES
```

### Step 1: User Opens Buy USDC Screen

User sees a form with:
- USDC amount input (how much they want to buy)
- Phone number input (M-Pesa number)
- Network selector (Safaricom, Airtel)

### Step 2: User Enters USDC Amount

```
User types: 10 USDC
```

### Step 3: Frontend Calls Preview API

```typescript
const response = await fetch('/api/offramp/preview-exchange-rate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currency: 'KES',
    amount: 10,        // USDC amount user wants to buy
    type: 'onramp'     // <-- Important: "onramp" not "offramp"
  })
});

const data = await response.json();
```

### Step 4: Frontend Shows Fee Breakdown

From the API response:

```typescript
const { feeBreakdown } = data;

// feeBreakdown = {
//   type: "onramp",
//   usdcAmount: 10,              // USDC user will receive
//   fiatValue: 1320,             // KES value of USDC
//   fee: 13,                     // Fee in KES
//   userPays: 1333,              // Total KES user pays
//   feePercentage: 1,            // 1%
//   exchangeRate: 132            // Selling rate
// }
```

**Display to user:**
```
┌─────────────────────────────────────┐
│  You receive:    10 USDC            │
│  USDC value:     1,320 KES          │
│  Fee (1%):       +13 KES            │
│  ─────────────────────────────────  │
│  You pay:        1,333 KES          │
└─────────────────────────────────────┘
```

### Step 5: No Balance Check Needed! 

**Unlike offramp, no crypto balance check is needed.**

The user pays from M-Pesa. If they don't have enough M-Pesa balance, the STK push will fail on their phone.

```typescript
// Just make sure amount is valid
if (usdcAmount <= 0) {
  showError('Enter a valid amount');
  return;
}

// Optionally check minimum amount
const MIN_KES = 100;
if (feeBreakdown.userPays < MIN_KES) {
  showError(`Minimum amount is ${MIN_KES} KES`);
  return;
}
```

### Step 6: User Confirms & Frontend Calls Onramp API

```typescript
const onrampResponse = await fetch('/api/offramp/onramp', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    shortcode: '0712345678',       // M-Pesa phone number
    amount: 10,                     // USDC amount to buy
    chain: 'BASE',
    asset: 'USDC',
    mobile_network: 'SAFARICOM',
    country_code: 'KES'
  })
});

const result = await onrampResponse.json();
```

### Step 7: User Gets STK Push

After calling the API:
1. User's phone receives M-Pesa STK push prompt
2. Prompt shows: "Pay 1,333 KES to..."
3. User enters M-Pesa PIN
4. Payment is processed
5. User receives USDC to their wallet

### Step 8: Show Pending/Success

```typescript
// result = {
//   data: { ... },
//   feeBreakdown: {
//     fiatValue: 1320,        // USDC value in KES
//     userPays: 1333,         // Total collected
//     fee: 13,                // Fee charged
//     feePercentage: 1,
//     currency: "KES"
//   }
// }
```

**Display:**
```
┌─────────────────────────────────────┐
│  📱 Check your phone!               │
│                                     │
│  M-Pesa prompt sent to 0712345678   │
│  Amount: 1,333 KES                  │
│                                     │
│  After payment, you'll receive:     │
│  10 USDC                            │
└─────────────────────────────────────┘
```

---

## 📝 Complete Frontend Code Example (Onramp)

```typescript
// onramp.ts

interface OnrampFeeBreakdown {
  usdcAmount: number;
  fiatValue: number;
  fee: number;
  userPays: number;
  feePercentage: number;
  exchangeRate: number;
}

// Step 1: Get fee preview when user enters amount
async function getOnrampPreview(usdcAmount: number, currency: string): Promise<OnrampFeeBreakdown> {
  const response = await fetch('/api/offramp/preview-exchange-rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency, amount: usdcAmount, type: 'onramp' })
  });
  const data = await response.json();
  return data.feeBreakdown;
}

// Step 2: Execute onramp
async function executeOnramp(
  usdcAmount: number,
  phoneNumber: string,
  network: string,
  currency: string
) {
  const response = await fetch('/api/offramp/onramp', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      shortcode: phoneNumber,
      amount: usdcAmount,
      chain: 'BASE',
      asset: 'USDC',
      mobile_network: network.toUpperCase(),
      country_code: currency
    })
  });
  return response.json();
}

// React Component
function OnrampForm() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [preview, setPreview] = useState<OnrampFeeBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // When amount changes, fetch preview
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      getOnrampPreview(parseFloat(amount), 'KES')
        .then(setPreview)
        .catch(console.error);
    }
  }, [amount]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await executeOnramp(
        parseFloat(amount),
        phone,
        'SAFARICOM',
        'KES'
      );
      setSuccess(true);
      // Show STK push sent message
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="success">
        <h3>📱 Check your phone!</h3>
        <p>M-Pesa prompt sent to {phone}</p>
        <p>Amount: {preview?.userPays} KES</p>
        <p>You'll receive: {amount} USDC</p>
      </div>
    );
  }

  return (
    <div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="USDC to buy"
      />
      
      <input 
        type="tel" 
        value={phone} 
        onChange={(e) => setPhone(e.target.value)}
        placeholder="M-Pesa number (07...)"
      />
      
      {preview && (
        <div className="fee-breakdown">
          <p>You receive: {preview.usdcAmount} USDC</p>
          <p>USDC value: {preview.fiatValue} KES</p>
          <p>Fee ({preview.feePercentage}%): +{preview.fee} KES</p>
          <hr />
          <p><strong>You pay: {preview.userPays} KES</strong></p>
        </div>
      )}
      
      <button 
        onClick={handleSubmit} 
        disabled={loading || !preview || !phone}
      >
        {loading ? 'Sending...' : `Pay ${preview?.userPays || 0} KES`}
      </button>
    </div>
  );
}
```

---

## ⚡ Onramp Quick Reference

| What | Value |
|------|-------|
| User inputs | USDC amount they want |
| User pays | Fiat + fee (via M-Pesa) |
| User receives | Exact USDC they requested |
| Fee comes from | Extra fiat collected |
| Balance check | ❌ Not needed (M-Pesa handles it) |

---

## 🔄 Offramp vs Onramp Comparison

| | Offramp | Onramp |
|--|---------|--------|
| **Direction** | USDC → Fiat | Fiat → USDC |
| **User inputs** | USDC to sell | USDC to buy |
| **Fee applied** | Extra USDC deducted | Extra fiat charged |
| **User gets** | Full fiat value | Exact USDC requested |
| **Balance check** | ✅ Check USDC balance | ❌ M-Pesa handles it |
| **Payment method** | From crypto wallet | M-Pesa STK push |

---

### 1. Get Fee Info (Don't Hardcode!)

```typescript
const response = await fetch('/api/offramp/preview-exchange-rate', {
  method: 'POST',
  body: JSON.stringify({ currency: 'KES' })
});
const { feePercentage, feeBps, rate } = await response.json();
// feePercentage = 1 (meaning 1%)
```

### 2. Preview with Fee Calculation

**Request:**
```json
{
  "currency": "KES",
  "amount": 10,       // USDC amount
  "type": "offramp"   // or "onramp"
}
```

**Response (Offramp):**
```json
{
  "rate": 130,
  "feePercentage": 1,
  "feeBreakdown": {
    "type": "offramp",
    "usdcAmount": 10,
    "userReceivesFiat": 1300,      // What user gets
    "fee": 13,                      // Fee
    "totalFiatDeducted": 1313,     // Total fiat value deducted
    "totalUsdcNeeded": 10.1,       // USDC to deduct (user needs this balance!)
    "exchangeRate": 130
  }
}
```

**Response (Onramp):**
```json
{
  "feeBreakdown": {
    "type": "onramp",
    "usdcAmount": 10,
    "fiatValue": 1320,
    "fee": 13,
    "userPays": 1333,              // Total user pays
    "userReceivesUsdc": 10
  }
}
```

### 3. API Responses

**Offramp Response:**
```json
{
  "order": {
    "amount": 1300,              // What user receives (KES)
    "totalDeducted": 1313,       // Total fiat value deducted
    "usdcDeducted": 10.1,        // USDC deducted from wallet
    "fee": 13,
    "feePercentage": 1
  }
}
```

**Onramp Response:**
```json
{
  "feeBreakdown": {
    "fiatValue": 1320,           // Fiat value of USDC
    "userPays": 1333,            // Total collected from user
    "fee": 13
  }
}
```

---

## Frontend Balance Check (Offramp)

**IMPORTANT:** Check if user has enough USDC for amount + fee!

```typescript
async function canOfframp(usdcAmount: number, userBalance: number, currency: string) {
  // Get fee info from API
  const response = await fetch('/api/offramp/preview-exchange-rate', {
    method: 'POST',
    body: JSON.stringify({ currency, amount: usdcAmount, type: 'offramp' })
  });
  const { feeBreakdown } = await response.json();
  
  // Check if user has enough USDC (including fee worth)
  const totalUsdcNeeded = feeBreakdown.totalUsdcNeeded;
  
  if (userBalance < totalUsdcNeeded) {
    return {
      canProceed: false,
      error: `Insufficient balance. Need ${totalUsdcNeeded.toFixed(4)} USDC (includes ${feeBreakdown.fee} ${currency} fee)`
    };
  }
  
  return { canProceed: true, feeBreakdown };
}
```

---

## Frontend UI Example

### Offramp Screen
```
┌─────────────────────────────────────┐
│  💸 Withdraw to M-Pesa              │
├─────────────────────────────────────┤
│  Amount (USDC):  [  10  ]           │ ← USER INPUTS
│  Phone Number:   [ 0712345678 ]     │
├─────────────────────────────────────┤
│  You receive:    1,300 KES          │
│  Fee (1%):       13 KES             │
│  Total deducted: 1,313 KES          │
│  USDC needed:    10.1 USDC          │ ← CHECK BALANCE!
│  Your balance:   50 USDC ✅          │
├─────────────────────────────────────┤
│        [ Confirm Withdrawal ]       │
└─────────────────────────────────────┘
```

### Onramp Screen
```
┌─────────────────────────────────────┐
│  💰 Buy USDC                        │
├─────────────────────────────────────┤
│  Amount (USDC):  [  10  ]           │ ← USER INPUTS
│  Phone Number:   [ 0712345678 ]     │
├─────────────────────────────────────┤
│  USDC value:     1,320 KES          │
│  Fee (1%):       +13 KES            │
│  ─────────────────────────────────  │
│  You pay:        1,333 KES          │ ← HIGHLIGHT
│  You receive:    10 USDC            │
├─────────────────────────────────────┤
│           [ Pay 1,333 KES ]         │
└─────────────────────────────────────┘
```

---

## Summary

| | Offramp | Onramp |
|--|---------|--------|
| **User inputs** | USDC to convert | USDC to buy |
| **Fee applied** | Added to USDC deducted | Added to fiat paid |
| **Balance check** | Need USDC + fee worth | M-Pesa handles it |
| **Pretium `amount`** | fiat_received + fee | fiat_value + fee |
| **User gets** | Exactly what they want | USDC they requested |

**Key:** User always gets what they expect. Fee is extra we deduct/collect.
