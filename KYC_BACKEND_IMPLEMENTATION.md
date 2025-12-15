# KYC Backend Implementation Guide

This document outlines the backend implementation requirements for the Smile ID KYC integration.

## Overview

The backend needs to provide two main endpoints:

1. **Web Token Generation** - Creates a session token for the frontend to initialize Smile ID
2. **Callback Handler** - Receives verification results from Smile ID

## Prerequisites

### 1. Smile ID Account Setup

1. Sign up at [Smile ID](https://usesmileid.com)
2. Get your credentials:
   - Partner ID
   - API Key
   - Callback URL

### 2. Install Smile ID Server Library

**For Node.js/TypeScript:**

```bash
npm install smile-identity-core
# or
yarn add smile-identity-core
# or
pnpm add smile-identity-core
```

### 3. Environment Variables

Add these to your `.env` file:

```env
# Smile ID Configuration
SMILE_ID_PARTNER_ID=your_partner_id_here
SMILE_ID_API_KEY=your_api_key_here
SMILE_ID_ENVIRONMENT=sandbox # or 'live' for production
SMILE_ID_CALLBACK_URL=https://your-api.com/api/kyc/callback

# Optional - for signature verification
SMILE_ID_SIGNATURE_SECRET=your_signature_secret_here
```

## Required Endpoints

### 1. POST /api/kyc/token

This endpoint generates a web token for the frontend to initialize Smile ID.

#### Request

**Headers:**

```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

**Body:**

```json
{
  "country_code": "NG"
}
```

#### Response

**Success (200):**

```json
{
  "token": "generated_web_token_here",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

**Error (400/500):**

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

#### Implementation Example (TypeScript + Express)

```typescript
import express from "express";
import { WebApi, Signature } from "smile-identity-core";
import { v4 as uuid } from "uuid";

const router = express.Router();

// Middleware to verify user authentication
const authenticateUser = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify your JWT token and attach user to request
    const user = await verifyJWT(token); // Your JWT verification logic
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

router.post("/api/kyc/token", authenticateUser, async (req, res) => {
  try {
    const { country_code } = req.body;
    const user = req.user; // From authentication middleware

    // Validate country code
    if (!country_code || typeof country_code !== "string") {
      return res.status(400).json({
        error: "Invalid country_code",
        code: "INVALID_COUNTRY",
      });
    }

    // Initialize Smile ID WebAPI
    const connection = new WebApi(
      process.env.SMILE_ID_PARTNER_ID!,
      process.env.SMILE_ID_CALLBACK_URL!,
      process.env.SMILE_ID_API_KEY!,
      process.env.SMILE_ID_ENVIRONMENT === "live" ? 1 : 0 // 0 for sandbox, 1 for live
    );

    // Generate unique IDs for this verification
    const userId = user.id || `user-${uuid()}`;
    const jobId = `job-${uuid()}`;

    // Generate web token
    const tokenResponse = await connection.get_web_token(
      userId,
      jobId,
      "biometric_kyc" // or 'doc_verification', 'smartselfie', etc.
    );

    // Store the job_id and user_id in your database for later reference
    await storeKYCSession({
      userId: user.id,
      jobId,
      country_code,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({
      token: tokenResponse,
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    });
  } catch (error) {
    console.error("Error generating KYC token:", error);
    res.status(500).json({
      error: "Failed to generate verification token",
      code: "TOKEN_GENERATION_FAILED",
    });
  }
});

export default router;
```

### 2. POST /api/kyc/callback

This endpoint receives verification results from Smile ID after the user completes the KYC process.

#### Request from Smile ID

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "Actions": {
    "Liveness_Check": "Passed",
    "Register_Selfie": "Approved",
    "Selfie_Provided": "Passed",
    "Verify_ID_Number": "Verified",
    "Human_Review_Compare": "Passed",
    "Return_Personal_Info": "Returned"
  },
  "ConfidenceValue": "99",
  "PartnerParams": {
    "job_id": "job-uuid-here",
    "job_type": "1",
    "user_id": "user-uuid-here"
  },
  "ResultCode": "1210",
  "ResultText": "Enroll User",
  "SmileJobID": "0000056574",
  "Source": "WebAPI",
  "Country": "NG",
  "IDType": "BVN",
  "IDNumber": "12345678901",
  "FullName": "John Doe",
  "DOB": "1990-01-01",
  "timestamp": "2024-12-12T08:48:50.763Z",
  "signature": "----signature-----"
}
```

#### Implementation Example (TypeScript + Express)

```typescript
import express from "express";
import crypto from "crypto";

const router = express.Router();

// Verify Smile ID signature (optional but recommended)
function verifySmileIDSignature(payload: any, signature: string): boolean {
  if (!process.env.SMILE_ID_SIGNATURE_SECRET) {
    console.warn("No signature secret configured, skipping verification");
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.SMILE_ID_SIGNATURE_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

router.post("/api/kyc/callback", async (req, res) => {
  try {
    const payload = req.body;
    const signature = payload.signature;

    // Verify signature (recommended for security)
    if (signature && !verifySmileIDSignature(payload, signature)) {
      console.error("Invalid signature from Smile ID");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const {
      Actions,
      ConfidenceValue,
      PartnerParams,
      ResultCode,
      ResultText,
      SmileJobID,
      Country,
      IDType,
      IDNumber,
      FullName,
      DOB,
    } = payload;

    const { job_id, user_id } = PartnerParams;

    // Determine if KYC passed
    const isPassed =
      Actions.Liveness_Check === "Passed" &&
      Actions.Verify_ID_Number === "Verified" &&
      parseInt(ConfidenceValue) >= 80; // Adjust threshold as needed

    // Update KYC status in your database
    await updateKYCStatus({
      userId: user_id,
      jobId: job_id,
      smileJobId: SmileJobID,
      status: isPassed ? "verified" : "failed",
      resultCode: ResultCode,
      resultText: ResultText,
      confidenceValue: ConfidenceValue,
      country: Country,
      idType: IDType,
      idNumber: IDNumber, // Be careful with PII - consider encryption
      fullName: FullName,
      dateOfBirth: DOB,
      actions: Actions,
      rawResult: payload, // Store full result for audit
      completedAt: new Date(),
    });

    // Update user verification status
    await updateUserVerificationStatus(user_id, isPassed);

    // Send notification to user (optional)
    if (isPassed) {
      await sendKYCSuccessNotification(user_id);
    } else {
      await sendKYCFailureNotification(user_id, ResultText);
    }

    // Log for monitoring
    console.log(`KYC ${isPassed ? "PASSED" : "FAILED"} for user ${user_id}`, {
      jobId: job_id,
      smileJobId: SmileJobID,
      confidence: ConfidenceValue,
    });

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: "Callback received and processed",
    });
  } catch (error) {
    console.error("Error processing KYC callback:", error);

    // Still return 200 to prevent Smile ID from retrying
    // Log the error for manual review
    res.status(200).json({
      success: false,
      error: "Error processing callback",
    });
  }
});

export default router;
```

## Database Schema

### KYC Sessions Table

```typescript
interface KYCSession {
  id: string;
  userId: string;
  jobId: string;
  smileJobId?: string;
  country: string;
  status: "pending" | "verified" | "failed" | "expired";
  resultCode?: string;
  resultText?: string;
  confidenceValue?: string;
  idType?: string;
  idNumber?: string; // Encrypted
  fullName?: string;
  dateOfBirth?: string;
  actions?: Record<string, string>;
  rawResult?: any; // Full callback payload for audit
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}
```

### Users Table Update

Add these fields to your existing users table:

```typescript
interface User {
  // ... existing fields
  kycVerified: boolean;
  kycVerifiedAt?: Date;
  kycCountry?: string;
  kycJobId?: string;
}
```

## Helper Functions

### Database Operations

```typescript
import { db } from "./database"; // Your database connection

async function storeKYCSession(data: {
  userId: string;
  jobId: string;
  country_code: string;
  status: string;
  createdAt: Date;
}) {
  return await db.kycSessions.create({
    data: {
      ...data,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    },
  });
}

async function updateKYCStatus(data: {
  userId: string;
  jobId: string;
  smileJobId: string;
  status: string;
  resultCode: string;
  resultText: string;
  confidenceValue: string;
  country: string;
  idType?: string;
  idNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  actions: any;
  rawResult: any;
  completedAt: Date;
}) {
  // Encrypt sensitive data before storing
  const encryptedIdNumber = data.idNumber
    ? encryptData(data.idNumber)
    : undefined;

  return await db.kycSessions.update({
    where: { jobId: data.jobId },
    data: {
      ...data,
      idNumber: encryptedIdNumber,
    },
  });
}

async function updateUserVerificationStatus(userId: string, verified: boolean) {
  return await db.users.update({
    where: { id: userId },
    data: {
      kycVerified: verified,
      kycVerifiedAt: verified ? new Date() : undefined,
    },
  });
}

// Encryption helper (use a proper encryption library)
function encryptData(data: string): string {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}
```

### Notification Functions

```typescript
async function sendKYCSuccessNotification(userId: string) {
  // Implement your notification logic (email, push, etc.)
  console.log(`Sending KYC success notification to user ${userId}`);
}

async function sendKYCFailureNotification(userId: string, reason: string) {
  // Implement your notification logic
  console.log(`Sending KYC failure notification to user ${userId}: ${reason}`);
}
```

## Security Best Practices

### 1. Data Protection

- **Encrypt PII**: Always encrypt sensitive data like ID numbers, full names, and DOB
- **Minimize Storage**: Only store what's necessary for compliance
- **Access Control**: Restrict who can view KYC data
- **Audit Logs**: Log all access to KYC data

### 2. API Security

- **Rate Limiting**: Prevent abuse of the token generation endpoint
- **Signature Verification**: Always verify Smile ID callback signatures
- **HTTPS Only**: Never use HTTP for KYC endpoints
- **Token Expiry**: Set reasonable expiry times for web tokens

### 3. Compliance

- **Data Retention**: Follow GDPR/local laws for data retention
- **User Consent**: Get explicit consent before KYC
- **Right to Erasure**: Implement data deletion on user request
- **Audit Trail**: Keep logs for compliance audits

## Testing

### Sandbox Testing

Smile ID provides sandbox results you can control:

```typescript
// In your token generation, add partner_params for testing
const partner_params = {
  user_id: userId,
  job_id: jobId,
  sandbox_result: "0", // "0" = success, "1" = fail, "2" = review
};
```

### Test Cases

1. **Successful Verification**: Use sandbox_result "0"
2. **Failed Verification**: Use sandbox_result "1"
3. **Manual Review Required**: Use sandbox_result "2"
4. **Network Failures**: Test callback endpoint resilience
5. **Duplicate Callbacks**: Ensure idempotency

## Monitoring

### Metrics to Track

- Token generation success/failure rate
- Verification completion rate
- Average verification time
- Callback processing time
- Failed verifications by reason

### Logging

```typescript
// Structured logging example
logger.info("KYC token generated", {
  userId,
  jobId,
  country: country_code,
  timestamp: new Date().toISOString(),
});

logger.info("KYC verification completed", {
  userId,
  jobId,
  smileJobId: SmileJobID,
  status: isPassed ? "passed" : "failed",
  confidence: ConfidenceValue,
  duration: Date.now() - startTime,
});
```

## Troubleshooting

### Common Issues

1. **Token Generation Fails**

   - Check API credentials
   - Verify environment (sandbox vs live)
   - Check network connectivity

2. **Callbacks Not Received**

   - Verify callback URL is publicly accessible
   - Check firewall/security group settings
   - Ensure endpoint returns 200 status

3. **Signature Verification Fails**
   - Verify signature secret matches Smile ID config
   - Check payload hasn't been modified
   - Ensure consistent JSON serialization

## Additional Resources

- [Smile ID Documentation](https://docs.usesmileid.com/)
- [Smile ID Node.js Library](https://github.com/smileidentity/smile-identity-core-js)
- [Smile ID Support](https://usesmileid.com/contact)

## Next Steps

1. Set up Smile ID account and get credentials
2. Implement the two endpoints above
3. Test with sandbox environment
4. Add proper error handling and logging
5. Implement data encryption
6. Set up monitoring and alerts
7. Go live with production credentials

## Frontend Environment Variables

Make sure to add these to your frontend `.env` file:

```env
VITE_API_URL=https://your-backend-api.com
VITE_SMILE_ID_ENV=sandbox # or 'live'
VITE_SMILE_ID_PARTNER_ID=your_partner_id
VITE_APP_NAME=Rift
VITE_APP_LOGO_URL=https://your-app.com/logo.png
VITE_PRIVACY_POLICY_URL=https://your-app.com/privacy
```
