# Rift SDK - Sending Money to Different Countries

This guide explains how to use the Rift SDK to send money to different countries.

## Overview

The Rift SDK provides two main methods for sending money:
1. **`rift.offramp.pay()`** - For direct payments (Send Money feature)
2. **`rift.offramp.createOrder()`** - For withdrawals to user's own account

Both methods work similarly but serve different purposes.

---

## 1. Getting Exchange Rates

Before sending money, you need to get the exchange rate for the target currency.

### Method: `rift.offramp.previewExchangeRate()`

```typescript
import rift from "@/lib/rift";

// Set authentication token first
const authToken = localStorage.getItem("token");
rift.setBearerToken(authToken);

// Get exchange rate for a currency
const exchangeResponse = await rift.offramp.previewExchangeRate({
  currency: "KES" | "ETB" | "UGX" | "GHS" | "NGN" | "USD"
});

// Response contains:
// - rate: Exchange rate (for withdrawals/balance display)
// - selling_rate: Exchange rate (for onramps/invoices)
// - buying_rate: Exchange rate (for offramps/payments)
```

**Example:**
```typescript
const response = await rift.offramp.previewExchangeRate({
  currency: "KES"
});

console.log(response.rate);        // e.g., 130.5 (1 USDC = 130.5 KES)
console.log(response.buying_rate); // e.g., 129.5 (for offramp)
console.log(response.selling_rate); // e.g., 131.5 (for onramp)
```

---

## 2. Supported Countries & Currencies

Currently supported currencies:
- **KES** - Kenya (Safaricom M-Pesa)
- **ETB** - Ethiopia (Telebirr)
- **UGX** - Uganda (MTN, Airtel Money)
- **GHS** - Ghana (MTN, AirtelTigo, Airtel Money)
- **NGN** - Nigeria (Coming soon)
- **USD** - International

---

## 3. Sending Money (Direct Payment)

### Method: `rift.offramp.pay()`

Use this for sending money to someone else (not your own account).

#### Request Parameters:

```typescript
interface PayRequest {
  token: "USDC";                    // Always "USDC"
  amount: number;                   // USD amount (local amount ÷ exchange rate)
  currency: "KES" | "ETB" | "UGX" | "GHS" | "NGN";  // Target currency
  chain: "base";                    // Always "base"
  recipient: string;                // JSON stringified Recipient object
}
```

#### Recipient Object Structure:

**For Kenya (KES):**
```typescript
// Mobile Money (MOBILE)
{
  accountIdentifier: "0712345678",  // Phone number (07... format)
  currency: "KES",
  type: "MOBILE",                   // "MOBILE" | "PAYBILL" | "BUY_GOODS"
  institution: "Safaricom"
}

// Paybill (PAYBILL)
{
  accountIdentifier: "400200",       // Paybill number
  accountNumber: "123456",          // Account number
  currency: "KES",
  type: "PAYBILL",
  institution: "Safaricom",
  accountName: "John Doe"          // Optional
}

// Buy Goods (BUY_GOODS)
{
  accountIdentifier: "123456",       // Till number
  currency: "KES",
  type: "BUY_GOODS",
  institution: "Safaricom"
}
```

**For Other Countries (ETB, UGX, GHS):**
```typescript
{
  accountIdentifier: "0912345678",  // Phone number (local format, no country code)
  currency: "ETB" | "UGX" | "GHS",
  institution: "Telebirr" | "MTN" | "Airtel Money" | "AirtelTigo",
  accountName: "John Doe"           // Optional
}
```

#### Complete Example:

```typescript
import rift from "@/lib/rift";

// 1. Set auth token
const authToken = localStorage.getItem("token");
rift.setBearerToken(authToken);

// 2. Get exchange rate
const exchangeResponse = await rift.offramp.previewExchangeRate({
  currency: "KES"
});

// 3. Calculate USD amount from local amount
const localAmount = 1000; // KES 1000
const usdAmount = Math.round((localAmount / exchangeResponse.buying_rate) * 1e6) / 1e6;

// 4. Create recipient object
const recipient = {
  accountIdentifier: "0712345678",
  currency: "KES",
  type: "MOBILE",
  institution: "Safaricom"
};

// 5. Make payment
const paymentRequest = {
  token: "USDC",
  amount: usdAmount,                // USD amount (NOT local amount)
  currency: "KES",
  chain: "base",
  recipient: JSON.stringify(recipient)  // Must be JSON stringified
};

const response = await rift.offramp.pay(paymentRequest);

// Response:
// {
//   order: {
//     id: "order_123",
//     status: "pending" | "processing" | "completed" | "failed",
//     transactionCode: "ABC123",
//     amount: 7.65,
//     createdAt: "2024-01-28T10:00:00Z"
//   }
// }
```

---

## 4. Withdrawing Money (To Your Own Account)

### Method: `rift.offramp.createOrder()`

Use this for withdrawing money to your own configured payment account.

#### Request Parameters:

```typescript
interface CreateOfframpOrderRequest {
  token: "USDC";                    // Always "USDC"
  amount: number;                   // USD amount (local amount ÷ exchange rate)
  currency: "KES" | "ETB" | "UGX" | "GHS" | "NGN";  // Target currency
  chain: "base";                    // Always "base"
  recipient: string;                // JSON stringified Recipient object (user's payment account)
}
```

#### Complete Example:

```typescript
import rift from "@/lib/rift";

// 1. Set auth token
const authToken = localStorage.getItem("token");
rift.setBearerToken(authToken);

// 2. Get exchange rate
const exchangeResponse = await rift.offramp.previewExchangeRate({
  currency: "KES"
});

// 3. Calculate USD amount from local amount
const localAmount = 1000; // KES 1000
const usdAmount = Math.round((localAmount / exchangeResponse.buying_rate) * 1e6) / 1e6;

// 4. Get user's payment account (from user profile)
const user = await getUser(); // Your user fetch function
const paymentAccount = user.paymentAccount || user.payment_account;
// paymentAccount is already a JSON string from the backend

// 5. Create withdrawal order
const withdrawalRequest = {
  token: "USDC",
  amount: usdAmount,                // USD amount (NOT local amount)
  currency: "KES",
  chain: "base",
  recipient: paymentAccount         // Already JSON stringified from backend
};

const response = await rift.offramp.createOrder(withdrawalRequest);

// Response:
// {
//   order: {
//     id: "order_123",
//     status: "pending" | "processing" | "completed" | "failed",
//     transactionCode: "ABC123",
//     amount: 7.65,
//     createdAt: "2024-01-28T10:00:00Z"
//   }
// }
```

---

## 5. Important Notes

### Amount Calculation

**Always convert local currency to USD before sending:**
```typescript
// ✅ CORRECT
const localAmount = 1000; // KES 1000
const usdAmount = Math.round((localAmount / exchangeResponse.buying_rate) * 1e6) / 1e6;
// Send usdAmount to API

// ❌ WRONG
// Don't send localAmount directly
```

### Fee Handling

- The backend automatically deducts fees from your USDC balance
- Send the **net amount** (amount user receives) as USD
- The backend calculates and deducts the fee separately
- Use `buying_rate` for offramp (payments/withdrawals)
- Use `selling_rate` for onramp (deposits/invoices)

### Phone Number Formatting

**Kenya (KES):**
- Format: `07XXXXXXXX` (10 digits)
- Accepts: `2547XXXXXXXX`, `+2547XXXXXXXX`, `7XXXXXXXX`
- Auto-converts to `07XXXXXXXX` format

**Other Countries:**
- Enter phone number in local format (no country code)
- Examples:
  - Ethiopia: `0912345678`
  - Uganda: `0772345678`
  - Ghana: `0241234567`

### Authentication

**Always set the bearer token before making API calls:**
```typescript
const authToken = localStorage.getItem("token");
if (!authToken) {
  throw new Error("No authentication token found");
}
rift.setBearerToken(authToken);
```

### Recipient Stringification

**The recipient must be JSON stringified:**
```typescript
// ✅ CORRECT
recipient: JSON.stringify(recipientObject)

// ❌ WRONG
recipient: recipientObject  // Will fail
```

---

## 6. Getting Fee Information

### Method: `rift.offramp.getWithdrawalFee()`

```typescript
const feeResponse = await rift.offramp.getWithdrawalFee(usdAmount);
// Returns fee information for the withdrawal amount
```

### Using Fee Preview Hook

```typescript
import { useOfframpFeePreview } from "@/hooks/data/use-offramp-fee";

const { data: feePreview } = useOfframpFeePreview("KES");

// feePreview contains:
// - buying_rate: Rate for converting USDC to local currency
// - selling_rate: Rate for converting local currency to USDC
// - fee_bps: Fee in basis points (e.g., 100 = 1%)
// - min_amount: Minimum withdrawal amount in USD
// - max_amount: Maximum withdrawal amount in USD
```

---

## 7. Complete Flow Example

Here's a complete example of sending money to Kenya:

```typescript
import rift from "@/lib/rift";

async function sendMoneyToKenya(
  phoneNumber: string,
  amountKES: number
) {
  try {
    // 1. Authenticate
    const authToken = localStorage.getItem("token");
    if (!authToken) throw new Error("Not authenticated");
    rift.setBearerToken(authToken);

    // 2. Get exchange rate
    const exchangeResponse = await rift.offramp.previewExchangeRate({
      currency: "KES"
    });

    // 3. Calculate USD amount
    const usdAmount = Math.round(
      (amountKES / exchangeResponse.buying_rate) * 1e6
    ) / 1e6;

    // 4. Format phone number (Kenya-specific)
    const formattedPhone = formatKenyaPhone(phoneNumber); // 07XXXXXXXX

    // 5. Create recipient
    const recipient = {
      accountIdentifier: formattedPhone,
      currency: "KES",
      type: "MOBILE",
      institution: "Safaricom"
    };

    // 6. Make payment
    const response = await rift.offramp.pay({
      token: "USDC",
      amount: usdAmount,
      currency: "KES",
      chain: "base",
      recipient: JSON.stringify(recipient)
    });

    console.log("Payment successful:", response.order);
    return response.order;
  } catch (error) {
    console.error("Payment failed:", error);
    throw error;
  }
}

function formatKenyaPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) {
    return "0" + cleaned.substring(3);
  }
  if (cleaned.startsWith("7") && cleaned.length === 9) {
    return "07" + cleaned.substring(1);
  }
  return cleaned;
}
```

---

## 8. Error Handling

Common errors and solutions:

1. **"No authentication token found"**
   - Ensure user is logged in
   - Check `localStorage.getItem("token")`

2. **"Insufficient balance"**
   - Check USDC balance before sending
   - Remember fees are deducted automatically

3. **"Invalid recipient"**
   - Verify recipient object structure
   - Ensure recipient is JSON stringified
   - Check phone number format

4. **"Invalid currency"**
   - Use supported currency codes: KES, ETB, UGX, GHS, NGN, USD

---

## 9. Related Hooks

The codebase provides React hooks for easier integration:

- `usePayment()` - Hook for `rift.offramp.pay()`
- `useCreateWithdrawalOrder()` - Hook for `rift.offramp.createOrder()`
- `useBaseUSDCBalance()` - Get balance with exchange rate
- `useOfframpFeePreview()` - Get fee information

Example:
```typescript
import usePayment from "@/hooks/data/use-payment";

const paymentMutation = usePayment();

await paymentMutation.mutateAsync({
  token: "USDC",
  amount: usdAmount,
  currency: "KES",
  chain: "base",
  recipient: JSON.stringify(recipient)
});
```

---

## Summary

1. **Set auth token**: `rift.setBearerToken(token)`
2. **Get exchange rate**: `rift.offramp.previewExchangeRate({ currency })`
3. **Calculate USD amount**: `localAmount / buying_rate`
4. **Create recipient object**: Format based on country/currency
5. **Make payment**: `rift.offramp.pay()` or `rift.offramp.createOrder()`
6. **Handle response**: Check `order.status` for completion

**Key Points:**
- Always send USD amount, not local currency amount
- Recipient must be JSON stringified
- Use `buying_rate` for offramp (payments/withdrawals)
- Fees are automatically deducted by backend
- Phone numbers must be in correct format per country
