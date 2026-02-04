# Rift SDK - Complete Integration Guide

This comprehensive guide covers all major Rift SDK features: Top-up/Onramp, On-chain Send, Login, and Signup.

---

## Table of Contents

1. [Top-up/Onramp Flow](#1-top-uponramp-flow)
2. [On-chain Send (Send to Address)](#2-on-chain-send-send-to-address)
3. [Login Flow](#3-login-flow)
4. [Signup Flow](#4-signup-flow)

---

## 1. Top-up/Onramp Flow

The onramp flow allows users to buy cryptocurrency (USDC, etc.) using local payment methods like M-Pesa.

### Overview

There are two main onramp methods:
1. **`rift.onramp.initiateSafaricomSTK()`** - Legacy M-Pesa STK push (Kenya only)
2. **`rift.onrampV2.buy()`** - New unified onramp API (supports multiple countries)

### Method 1: Legacy M-Pesa STK (Kenya)

#### Step 1: Get Exchange Rate

```typescript
import rift from "@/lib/rift";

// Set authentication token
const authToken = localStorage.getItem("token");
rift.setBearerToken(authToken);

// Get exchange rate for onramp (use selling_rate)
const exchangeResponse = await rift.offramp.previewExchangeRate({
  currency: "KES"
});

const sellingRate = exchangeResponse.selling_rate; // Rate for buying crypto
```

#### Step 2: Initiate STK Push

```typescript
import { MpesaSTKInitiateRequest } from "@rift-finance/wallet";

const stkRequest: MpesaSTKInitiateRequest = {
  amount: 1000,                    // Amount in KES (local currency)
  cryptoAsset: "USDC",             // Token to buy: "USDC" | "ETH" | etc.
  cryptoWalletAddress: "0x...",    // User's wallet address
  externalReference: "user123",    // User's external ID
  phone: "0712345678",             // M-Pesa phone number (07... format)
};

const response = await rift.onramp.initiateSafaricomSTK(stkRequest);

// Response:
// {
//   success: true,
//   data: {
//     checkoutRequestID: "abc123...",
//     merchantRequestID: "xyz789...",
//     responseCode: "0",
//     responseDescription: "Success. Request accepted for processing"
//   }
// }
```

#### Step 3: Poll Transaction Status

```typescript
const checkoutRequestId = response.data.checkoutRequestID;

// Poll status every 3 seconds
const statusResponse = await rift.onramp.pollSafaricomTransactionStatus(
  checkoutRequestId
);

// Status values:
// - "pending" - Waiting for user to complete payment
// - "completed" - Payment successful, crypto received
// - "failed" - Payment failed or cancelled
// - "expired" - STK push expired
```

#### Complete Example

```typescript
async function buyCryptoWithMpesa(
  phoneNumber: string,
  amountKES: number,
  cryptoAsset: string = "USDC"
) {
  try {
    // 1. Authenticate
    const authToken = localStorage.getItem("token");
    if (!authToken) throw new Error("Not authenticated");
    rift.setBearerToken(authToken);

    // 2. Get user info
    const userResponse = await rift.auth.getUser();
    const user = userResponse.user;
    const walletAddress = localStorage.getItem("address");

    // 3. Initiate STK push
    const stkRequest: MpesaSTKInitiateRequest = {
      amount: amountKES,
      cryptoAsset: cryptoAsset,
      cryptoWalletAddress: walletAddress!,
      externalReference: user.externalId || user.email || "",
      phone: phoneNumber,
    };

    const response = await rift.onramp.initiateSafaricomSTK(stkRequest);

    if (!response.success) {
      throw new Error(response.data?.responseDescription || "STK push failed");
    }

    // 4. Return checkout request ID for polling
    return {
      checkoutRequestId: response.data.checkoutRequestID,
      message: "Check your phone for M-Pesa prompt",
    };
  } catch (error) {
    console.error("Onramp failed:", error);
    throw error;
  }
}

// Poll status (call this repeatedly)
async function checkOnrampStatus(checkoutRequestId: string) {
  const status = await rift.onramp.pollSafaricomTransactionStatus(
    checkoutRequestId
  );
  return status;
}
```

### Method 2: Unified Onramp V2 (Multiple Countries)

#### Step 1: Get Exchange Rate

```typescript
const exchangeResponse = await rift.offramp.previewExchangeRate({
  currency: "KES" | "ETB" | "UGX" | "GHS"
});

const sellingRate = exchangeResponse.selling_rate; // For onramp
```

#### Step 2: Calculate USD Amount

```typescript
const localAmount = 1000; // KES 1000
const usdAmount = Math.round((localAmount / sellingRate) * 1e6) / 1e6;
```

#### Step 3: Initiate Onramp

```typescript
const onrampRequest = {
  shortcode: "0712345678",        // Phone number (formatted per country)
  amount: usdAmount,               // USD amount (NOT local currency!)
  chain: "base",                   // Blockchain: "base" | "ethereum" | etc.
  asset: "USDC",                   // Token: "USDC" | "ETH" | etc.
  mobile_network: "Safaricom",      // Network: "Safaricom" | "MTN" | "Telebirr" | etc.
  country_code: "KES",             // Currency code
};

const response = await rift.onrampV2.buy(onrampRequest);

// Response contains order information
```

#### Complete Example (V2)

```typescript
async function buyCryptoV2(
  phoneNumber: string,
  localAmount: number,
  currency: "KES" | "ETB" | "UGX" | "GHS",
  cryptoAsset: string = "USDC"
) {
  try {
    // 1. Authenticate
    const authToken = localStorage.getItem("token");
    if (!authToken) throw new Error("Not authenticated");
    rift.setBearerToken(authToken);

    // 2. Get exchange rate
    const exchangeResponse = await rift.offramp.previewExchangeRate({
      currency: currency as any,
    });

    // 3. Calculate USD amount
    const usdAmount = Math.round(
      (localAmount / exchangeResponse.selling_rate) * 1e6
    ) / 1e6;

    // 4. Format phone number (country-specific)
    const formattedPhone = formatPhoneNumber(phoneNumber, currency);

    // 5. Determine mobile network
    const mobileNetwork = getMobileNetwork(currency);

    // 6. Initiate onramp
    const response = await rift.onrampV2.buy({
      shortcode: formattedPhone,
      amount: usdAmount,
      chain: "base",
      asset: cryptoAsset,
      mobile_network: mobileNetwork,
      country_code: currency,
    });

    return response;
  } catch (error) {
    console.error("Onramp V2 failed:", error);
    throw error;
  }
}

function formatPhoneNumber(phone: string, currency: string): string {
  // Format based on country
  if (currency === "KES") {
    // Kenya: 07XXXXXXXX
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("254")) {
      return "0" + cleaned.substring(3);
    }
    if (cleaned.startsWith("7") && cleaned.length === 9) {
      return "07" + cleaned.substring(1);
    }
    return cleaned;
  }
  // Add other country formats as needed
  return phone;
}

function getMobileNetwork(currency: string): string {
  const networks: Record<string, string> = {
    KES: "Safaricom",
    ETB: "Telebirr",
    UGX: "MTN", // or "Airtel Money"
    GHS: "MTN", // or "AirtelTigo" or "Airtel Money"
  };
  return networks[currency] || "Unknown";
}
```

### Getting Onramp Orders

```typescript
// Get all onramp orders for the current user
const userResponse = await rift.auth.getUser();
const userId = userResponse.user.id;

const orders = await rift.onrampV2.getOnrampOrders(userId);

// Returns array of orders with status, amount, etc.
```

### Important Notes

1. **Amount Calculation**: Always convert local currency to USD using `selling_rate`
2. **Phone Format**: Format phone numbers correctly per country
3. **Network Selection**: Choose the correct mobile network for the country
4. **Status Polling**: Poll transaction status to know when payment completes
5. **Fees**: Fees are automatically included in the calculation

---

## 2. On-chain Send (Send to Address)

Send cryptocurrency directly to a blockchain address (on-chain transaction).

### Overview

Use `rift.transactions.send()` to send tokens on-chain. This requires authentication via OTP or password.

### Step 1: Prepare Transaction

```typescript
import rift from "@/lib/rift";

// Set authentication token
const authToken = localStorage.getItem("token");
rift.setBearerToken(authToken);

// Get user info
const userResponse = await rift.auth.getUser();
const user = userResponse.user;
```

### Step 2: Authenticate Transaction

You need to authenticate the transaction using one of these methods:

#### Option A: Phone OTP

```typescript
// 1. Request OTP
await rift.auth.sendOtp({
  phone: user.phoneNumber,
});

// 2. User enters OTP code
const otpCode = "123456"; // From user input

// 3. Verify OTP (optional, can skip if you trust the OTP)
await rift.auth.verifyOtp({
  code: otpCode,
  phone: user.phoneNumber,
});
```

#### Option B: Email OTP

```typescript
// 1. Request OTP
await rift.auth.sendOtp({
  email: user.email,
});

// 2. User enters OTP code
const otpCode = "123456"; // From user input

// 3. Verify OTP (optional)
await rift.auth.verifyOtp({
  code: otpCode,
  email: user.email,
});
```

#### Option C: Username/Password

```typescript
// No separate request needed, just use password directly
const password = "user_password"; // From user input
```

### Step 3: Send Transaction

```typescript
// Prepare transaction payload
const transactionPayload = {
  chain: "base",                    // Blockchain: "base" | "ethereum" | "polygon" | etc.
  token: "USDC",                    // Token symbol: "USDC" | "ETH" | "MATIC" | etc.
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  // Recipient address
  value: "10.5",                    // Amount as string
  type: "gasless",                  // Transaction type: "gasless" (user doesn't pay gas)
  
  // Authentication (choose one):
  // Option 1: Phone OTP
  phoneNumber: user.phoneNumber,
  otpCode: otpCode,
  
  // Option 2: Email OTP
  // email: user.email,
  // otpCode: otpCode,
  
  // Option 3: Username/Password
  // externalId: user.externalId,
  // password: password,
};

const response = await rift.transactions.send(transactionPayload);

// Response:
// {
//   transactionHash: "0xabc123...",
//   status: "pending" | "confirmed" | "failed"
// }
```

### Complete Example

```typescript
interface SendToAddressArgs {
  recipient: string;
  amount: string;
  token: string;
  chain: string;
  authMethod: "phone-otp" | "email-otp" | "password";
  otpCode?: string;
  password?: string;
}

async function sendToAddress(args: SendToAddressArgs) {
  try {
    // 1. Authenticate
    const authToken = localStorage.getItem("token");
    if (!authToken) throw new Error("Not authenticated");
    rift.setBearerToken(authToken);

    // 2. Get user info
    const userResponse = await rift.auth.getUser();
    const user = userResponse.user;

    // 3. Prepare authentication payload
    let authPayload: any = {};

    if (args.authMethod === "phone-otp") {
      if (!args.otpCode) throw new Error("OTP code required");
      authPayload.phoneNumber = user.phoneNumber;
      authPayload.otpCode = args.otpCode;
    } else if (args.authMethod === "email-otp") {
      if (!args.otpCode) throw new Error("OTP code required");
      authPayload.email = user.email;
      authPayload.otpCode = args.otpCode;
    } else if (args.authMethod === "password") {
      if (!args.password) throw new Error("Password required");
      authPayload.externalId = user.externalId;
      authPayload.password = args.password;
    } else {
      throw new Error("Invalid authentication method");
    }

    // 4. Prepare transaction payload
    const transactionPayload = {
      chain: args.chain,
      token: args.token,
      to: args.recipient,
      value: args.amount,
      type: "gasless",
      ...authPayload,
    };

    // 5. Send transaction
    const response = await rift.transactions.send(transactionPayload);

    return {
      hash: response.transactionHash,
      status: response.status,
    };
  } catch (error) {
    console.error("Send transaction failed:", error);
    throw error;
  }
}

// Usage example:
// 1. Request OTP first
await rift.auth.sendOtp({ phone: user.phoneNumber });

// 2. User enters OTP, then send
const result = await sendToAddress({
  recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  amount: "10.5",
  token: "USDC",
  chain: "base",
  authMethod: "phone-otp",
  otpCode: "123456",
});
```

### Supported Chains

- `base` - Base (Ethereum L2)
- `ethereum` - Ethereum Mainnet
- `polygon` - Polygon
- `arbitrum` - Arbitrum
- `optimism` - Optimism
- And more...

### Supported Tokens

- `USDC` - USD Coin
- `ETH` - Ethereum
- `MATIC` - Polygon
- And more...

### Important Notes

1. **Authentication Required**: Every transaction requires OTP or password
2. **Gasless Transactions**: Use `type: "gasless"` - user doesn't pay gas fees
3. **Amount Format**: Always pass amount as string (e.g., `"10.5"` not `10.5`)
4. **Address Validation**: Validate recipient address before sending
5. **Balance Check**: Check user balance before sending (use `rift.wallet.getTokenBalance()`)

---

## 3. Login Flow

Authenticate existing users to access their wallet.

### Overview

Rift supports multiple login methods:
1. **Phone OTP** - Login with phone number + OTP code
2. **Email OTP** - Login with email + OTP code
3. **Username/Password** - Login with external ID + password

### Method 1: Phone OTP Login

#### Step 1: Request OTP

```typescript
import rift from "@/lib/rift";

// Request OTP to phone number
await rift.auth.sendOtp({
  phone: "0712345678",  // Phone number (with or without country code)
});
```

#### Step 2: Verify OTP and Login

```typescript
// User enters OTP code
const otpCode = "123456"; // From user input

// Login with phone + OTP
const response = await rift.auth.login({
  phoneNumber: "0712345678",
  otpCode: otpCode,
});

// Response:
// {
//   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
//   userId: "user_123"
// }
```

#### Step 3: Store Token and Set Bearer

```typescript
// Store token in localStorage
localStorage.setItem("token", response.accessToken);
localStorage.setItem("address", response.address);

// Set bearer token for future API calls
rift.setBearerToken(response.accessToken);
```

### Method 2: Email OTP Login

#### Step 1: Request OTP

```typescript
await rift.auth.sendOtp({
  email: "user@example.com",
});
```

#### Step 2: Verify OTP and Login

```typescript
const otpCode = "123456"; // From user input

const response = await rift.auth.login({
  email: "user@example.com",
  otpCode: otpCode,
});

// Store token
localStorage.setItem("token", response.accessToken);
localStorage.setItem("address", response.address);
rift.setBearerToken(response.accessToken);
```

### Method 3: Username/Password Login

```typescript
const response = await rift.auth.login({
  externalId: "username123",
  password: "user_password",
});

// Store token
localStorage.setItem("token", response.accessToken);
localStorage.setItem("address", response.address);
rift.setBearerToken(response.accessToken);
```

### Get User Information

After login, get user details:

```typescript
const userResponse = await rift.auth.getUser();

// Response:
// {
//   user: {
//     id: "user_123",
//     email: "user@example.com",
//     phoneNumber: "0712345678",
//     externalId: "username123",
//     address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
//     telegramId: "123456789",
//     displayName: "John Doe",
//     createdAt: "2024-01-01T00:00:00Z",
//     paymentAccount: "{...}", // JSON string
//     // ... more fields
//   }
// }
```

### Check Authentication Status

```typescript
const isAuthenticated = rift.auth.isAuthenticated();
// Returns: true | false
```

### Complete Login Example

```typescript
interface LoginArgs {
  method: "phone-otp" | "email-otp" | "username-password";
  phoneNumber?: string;
  email?: string;
  externalId?: string;
  password?: string;
  otpCode?: string;
}

async function loginUser(args: LoginArgs) {
  try {
    let response;

    if (args.method === "phone-otp") {
      // Step 1: Request OTP
      await rift.auth.sendOtp({
        phone: args.phoneNumber!,
      });

      // Step 2: Login with OTP (after user enters code)
      response = await rift.auth.login({
        phoneNumber: args.phoneNumber!,
        otpCode: args.otpCode!,
      });
    } else if (args.method === "email-otp") {
      // Step 1: Request OTP
      await rift.auth.sendOtp({
        email: args.email!,
      });

      // Step 2: Login with OTP
      response = await rift.auth.login({
        email: args.email!,
        otpCode: args.otpCode!,
      });
    } else if (args.method === "username-password") {
      // Direct login with username/password
      response = await rift.auth.login({
        externalId: args.externalId!,
        password: args.password!,
      });
    } else {
      throw new Error("Invalid login method");
    }

    // Store authentication data
    localStorage.setItem("token", response.accessToken);
    localStorage.setItem("address", response.address);
    rift.setBearerToken(response.accessToken);

    // Get user info
    const userResponse = await rift.auth.getUser();

    return {
      success: true,
      user: userResponse.user,
      address: response.address,
    };
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

// Usage:
// Phone OTP
await loginUser({
  method: "phone-otp",
  phoneNumber: "0712345678",
  otpCode: "123456",
});

// Email OTP
await loginUser({
  method: "email-otp",
  email: "user@example.com",
  otpCode: "123456",
});

// Username/Password
await loginUser({
  method: "username-password",
  externalId: "username123",
  password: "password123",
});
```

### Error Handling

```typescript
try {
  const response = await rift.auth.login({...});
} catch (error: any) {
  if (error.message?.includes("Invalid OTP")) {
    // OTP code is wrong
    console.error("Invalid OTP code");
  } else if (error.message?.includes("User not found")) {
    // User doesn't exist, redirect to signup
    console.error("User not found");
  } else if (error.message?.includes("Invalid credentials")) {
    // Wrong password
    console.error("Invalid password");
  } else {
    // Other errors
    console.error("Login failed:", error);
  }
}
```

---

## 4. Signup Flow

Create a new user account and wallet.

### Overview

Rift supports multiple signup methods:
1. **Phone OTP** - Signup with phone number
2. **Email OTP** - Signup with email
3. **Username/Password** - Signup with external ID + password

### Method 1: Phone OTP Signup

```typescript
import rift from "@/lib/rift";

// Signup with phone number
const response = await rift.auth.signup({
  phoneNumber: "0712345678",
});

// Response:
// {
//   userId: "user_123",
//   message: "OTP sent to phone"
// }

// After signup, user needs to verify OTP to complete registration
// This is typically done in the login flow
```

### Method 2: Email OTP Signup

```typescript
const response = await rift.auth.signup({
  email: "user@example.com",
});

// Response:
// {
//   userId: "user_123",
//   message: "OTP sent to email"
// }
```

### Method 3: Username/Password Signup

```typescript
const response = await rift.auth.signup({
  externalId: "username123",
  password: "secure_password",
});

// Response:
// {
//   userId: "user_123",
//   message: "Account created successfully"
// }

// After signup, user can immediately login with username/password
```

### Complete Signup Flow (Phone OTP)

```typescript
async function signupWithPhone(phoneNumber: string) {
  try {
    // Step 1: Signup
    const signupResponse = await rift.auth.signup({
      phoneNumber: phoneNumber,
    });

    // Step 2: Request OTP (automatically sent, but can request again)
    await rift.auth.sendOtp({
      phone: phoneNumber,
    });

    // Step 3: User enters OTP, then verify and login
    // This is done in the login flow
    return {
      success: true,
      userId: signupResponse.userId,
      message: "OTP sent to your phone",
    };
  } catch (error) {
    console.error("Signup failed:", error);
    throw error;
  }
}

// After signup, complete registration by logging in with OTP
async function completePhoneSignup(phoneNumber: string, otpCode: string) {
  try {
    // Login with OTP (this completes the signup)
    const loginResponse = await rift.auth.login({
      phoneNumber: phoneNumber,
      otpCode: otpCode,
    });

    // Store authentication data
    localStorage.setItem("token", loginResponse.accessToken);
    localStorage.setItem("address", loginResponse.address);
    rift.setBearerToken(loginResponse.accessToken);

    return {
      success: true,
      address: loginResponse.address,
    };
  } catch (error) {
    console.error("Complete signup failed:", error);
    throw error;
  }
}
```

### Complete Signup Flow (Email OTP)

```typescript
async function signupWithEmail(email: string) {
  try {
    // Step 1: Signup
    const signupResponse = await rift.auth.signup({
      email: email,
    });

    // Step 2: Request OTP
    await rift.auth.sendOtp({
      email: email,
    });

    return {
      success: true,
      userId: signupResponse.userId,
      message: "OTP sent to your email",
    };
  } catch (error) {
    console.error("Signup failed:", error);
    throw error;
  }
}

// Complete registration by logging in with OTP
async function completeEmailSignup(email: string, otpCode: string) {
  try {
    const loginResponse = await rift.auth.login({
      email: email,
      otpCode: otpCode,
    });

    localStorage.setItem("token", loginResponse.accessToken);
    localStorage.setItem("address", loginResponse.address);
    rift.setBearerToken(loginResponse.accessToken);

    return {
      success: true,
      address: loginResponse.address,
    };
  } catch (error) {
    console.error("Complete signup failed:", error);
    throw error;
  }
}
```

### Complete Signup Flow (Username/Password)

```typescript
async function signupWithUsername(externalId: string, password: string) {
  try {
    // Step 1: Signup
    const signupResponse = await rift.auth.signup({
      externalId: externalId,
      password: password,
    });

    // Step 2: Immediately login
    const loginResponse = await rift.auth.login({
      externalId: externalId,
      password: password,
    });

    // Store authentication data
    localStorage.setItem("token", loginResponse.accessToken);
    localStorage.setItem("address", loginResponse.address);
    rift.setBearerToken(loginResponse.accessToken);

    return {
      success: true,
      userId: signupResponse.userId,
      address: loginResponse.address,
    };
  } catch (error) {
    console.error("Signup failed:", error);
    throw error;
  }
}
```

### Universal Signup Function

```typescript
interface SignupArgs {
  method: "phone-otp" | "email-otp" | "username-password";
  phoneNumber?: string;
  email?: string;
  externalId?: string;
  password?: string;
}

async function signupUser(args: SignupArgs) {
  try {
    let signupResponse;

    if (args.method === "phone-otp") {
      signupResponse = await rift.auth.signup({
        phoneNumber: args.phoneNumber!,
      });
      // OTP is automatically sent
    } else if (args.method === "email-otp") {
      signupResponse = await rift.auth.signup({
        email: args.email!,
      });
      // OTP is automatically sent
    } else if (args.method === "username-password") {
      signupResponse = await rift.auth.signup({
        externalId: args.externalId!,
        password: args.password!,
      });
      // Can immediately login
    } else {
      throw new Error("Invalid signup method");
    }

    return {
      success: true,
      userId: signupResponse.userId,
      requiresOTP: args.method !== "username-password",
    };
  } catch (error) {
    console.error("Signup failed:", error);
    throw error;
  }
}
```

### Error Handling

```typescript
try {
  const response = await rift.auth.signup({...});
} catch (error: any) {
  if (error.message?.includes("already exists")) {
    // User already exists, redirect to login
    console.error("User already exists");
  } else if (error.message?.includes("Invalid phone")) {
    // Invalid phone number format
    console.error("Invalid phone number");
  } else if (error.message?.includes("Invalid email")) {
    // Invalid email format
    console.error("Invalid email");
  } else {
    // Other errors
    console.error("Signup failed:", error);
  }
}
```

### Important Notes

1. **OTP Signup**: After signup, user must verify OTP via login flow to complete registration
2. **Username/Password**: Can immediately login after signup
3. **Wallet Creation**: Wallet is automatically created on successful signup/login
4. **Address**: User's wallet address is returned in login response
5. **Token Storage**: Always store `accessToken` and `address` in localStorage

---

## Summary

### Quick Reference

| Feature | Method | Authentication |
|---------|--------|----------------|
| **Top-up (Legacy)** | `rift.onramp.initiateSafaricomSTK()` | Bearer token |
| **Top-up (V2)** | `rift.onrampV2.buy()` | Bearer token |
| **On-chain Send** | `rift.transactions.send()` | OTP or Password |
| **Login (Phone)** | `rift.auth.login({ phoneNumber, otpCode })` | OTP |
| **Login (Email)** | `rift.auth.login({ email, otpCode })` | OTP |
| **Login (Username)** | `rift.auth.login({ externalId, password })` | Password |
| **Signup (Phone)** | `rift.auth.signup({ phoneNumber })` | None |
| **Signup (Email)** | `rift.auth.signup({ email })` | None |
| **Signup (Username)** | `rift.auth.signup({ externalId, password })` | None |

### Common Patterns

1. **Always set bearer token**: `rift.setBearerToken(token)`
2. **Store tokens**: `localStorage.setItem("token", accessToken)`
3. **Get exchange rates**: `rift.offramp.previewExchangeRate({ currency })`
4. **Get user info**: `rift.auth.getUser()`
5. **Check auth**: `rift.auth.isAuthenticated()`

---

For more details on sending money to different countries, see `RIFT_SDK_SEND_MONEY_GUIDE.md`.
