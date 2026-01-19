# KYC API Response Documentation

This document describes the response structures for the KYC verification endpoints.

## Endpoints

### 1. POST `/api/kyc/verify`

**Description:** Submits KYC verification images to SmileID and returns immediately with a job ID. The verification is processed asynchronously via webhooks.

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "images": ["base64_image_1", "base64_image_2", ...],
  "partner_params": {
    "job_id": "optional-job-id",
    "user_id": "user-id",
    "job_type": 1,
    "id_number": "ID_NUMBER",
    "id_type": "NATIONAL_ID",
    "country_code": "KE"
  },
  "country_code": "KE",
  "user_id": "user-id",
  "email": "user@example.com",
  "phone_number": "+254712345678"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "jobId": "job-1234567890",
  "message": "KYC verification submitted successfully. Waiting for approval.",
  "status": "pending"
}
```

**Error Responses:**

**400 - Duplicate ID:**

```json
{
  "success": false,
  "passed": false,
  "pending": false,
  "reason": "This ID document is already registered to another account",
  "code": "DUPLICATE_ID"
}
```

**400 - Duplicate Biometrics:**

```json
{
  "success": false,
  "passed": false,
  "pending": false,
  "reason": "This identity has already been registered to another account",
  "code": "DUPLICATE_BIOMETRICS",
  "message": "The biometric data (face) you provided is already associated with another account. Each person can only verify one account."
}
```

**503 - Service Unavailable (Out of Credits):**

```json
{
  "success": false,
  "passed": false,
  "pending": false,
  "reason": "Verification service temporarily unavailable. Please try again later.",
  "code": "SERVICE_UNAVAILABLE",
  "message": "Verification service temporarily unavailable. Please try again later."
}
```

**500 - System Error:**

```json
{
  "success": false,
  "passed": false,
  "pending": false,
  "reason": "Verification service temporarily unavailable. Please try again later.",
  "_debug": {
    "smileIdCode": "2201",
    "smileIdError": "System Error",
    "isSystemError": true
  }
}
```

---

### 2. GET `/api/kyc/job/:jobId`

**Description:** Polls the KYC job status. This endpoint checks the result codes from the `resultcodes.json` file and only returns a final response when the category is "Approved" or "Rejected". For other categories (provisional, pending, etc.), it continues polling for up to 5 minutes.

**Authentication:** Required (JWT)

**URL Parameters:**

- `jobId` (string, required): The job ID returned from the `/verify` endpoint

**Success Responses:**

**200 - Approved:**

```json
{
  "success": true,
  "jobId": "job-1234567890",
  "status": "verified",
  "complete": true,
  "passed": true,
  "underReview": false,
  "message": "Identity verified successfully",
  "resultCode": "1210",
  "resultText": "Enroll User. Human Judgement - PASS",
  "category": "approved",
  "completedAt": "2024-01-15T10:30:00.000Z"
}
```

**200 - Rejected:**

```json
{
  "success": true,
  "jobId": "job-1234567890",
  "status": "failed",
  "complete": true,
  "passed": false,
  "underReview": false,
  "message": "Failed Enroll Machine Judgement - FAIL - Compare Rejected",
  "resultCode": "0811",
  "resultText": "Failed Enroll Machine Judgement - FAIL - Compare Rejected",
  "category": "rejected",
  "completedAt": "2024-01-15T10:30:00.000Z"
}
```

**200 - System Unavailable (0908):**

```json
{
  "success": true,
  "jobId": "job-1234567890",
  "status": "failed",
  "complete": true,
  "passed": false,
  "underReview": false,
  "message": "Verification service temporarily unavailable. Please try again later.",
  "resultCode": "0908",
  "resultText": "Verification service temporarily unavailable. Please try again later.",
  "category": "re-run the job when id authority is back online",
  "completedAt": "2024-01-15T10:30:00.000Z"
}
```

**200 - Pending (Timeout after 5 minutes):**

```json
{
  "success": true,
  "jobId": "job-1234567890",
  "status": "pending",
  "complete": false,
  "passed": false,
  "underReview": true,
  "message": "Verification is pending. Please check your profile later to see if you're verified.",
  "resultCode": "0812",
  "resultText": "Machine Judgement - Pure Provisional"
}
```

**Error Responses:**

**400 - Invalid Job ID:**

```json
{
  "success": false,
  "error": "Job ID is required",
  "code": "INVALID_JOB_ID"
}
```

**401 - Unauthorized:**

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**403 - Access Denied:**

```json
{
  "success": false,
  "error": "Access denied",
  "code": "ACCESS_DENIED"
}
```

**404 - Session Not Found:**

```json
{
  "success": false,
  "error": "KYC session not found",
  "code": "SESSION_NOT_FOUND"
}
```

**500 - Internal Server Error:**

```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## Response Fields

### Common Fields

- `success` (boolean): Indicates if the request was successful
- `jobId` (string): The unique job identifier for this KYC verification
- `status` (string): Current status of the verification. Possible values:
  - `"pending"`: Verification is being processed
  - `"verified"`: Verification was successful
  - `"failed"`: Verification failed
  - `"provisional"`: Verification is under human review

### Job Status Fields

- `complete` (boolean): Whether the verification process is complete
- `passed` (boolean): Whether the verification passed (only when `complete: true`)
- `underReview` (boolean): Whether the verification is still under review
- `message` (string): Human-readable message about the verification status
- `resultCode` (string): SmileID result code (e.g., "1210", "0811", "0908")
- `resultText` (string): Human-readable description of the result code
- `category` (string): Category of the result code from `resultcodes.json`:
  - `"approved"`: Verification approved
  - `"rejected"`: Verification rejected
  - `"provisional"`: Under human review
  - `"pending"`: Still processing
  - Other categories as defined in `resultcodes.json`
- `completedAt` (string, ISO 8601): Timestamp when verification completed (only when `complete: true`)

### Error Fields

- `error` (string): Error message
- `code` (string): Error code for programmatic handling
- `reason` (string): User-friendly error reason
- `_debug` (object, optional): Technical debugging information (only in development)

---

## Polling Behavior

The `/api/kyc/job/:jobId` endpoint polls the database every 3 seconds for up to 5 minutes, checking result codes against the `resultcodes.json` file.

### Polling Logic:

1. **If result code has category "approved" or "rejected":**

   - Returns immediately with final result
   - Updates user verification status if approved
   - Marks ID number as rejected if rejected

2. **If result code has other categories (provisional, pending, etc.):**

   - Continues polling for up to 5 minutes
   - Updates database with correct `resultText` from `resultcodes.json`

3. **If no result code yet:**

   - Continues polling until result code is available or timeout

4. **After 5 minutes timeout:**
   - Returns pending status
   - Message: "Verification is pending. Please check your profile later to see if you're verified."
   - User should check their profile later for final verification status

---

## Result Codes

Result codes are defined in `resultcodes.json` and categorized as:

- **Approved**: Verification passed
- **Rejected**: Verification failed
- **Provisional**: Under human review (continues polling)
- **Pending**: Still processing (continues polling)
- **Other**: System errors, retry codes, etc.

Common result codes:

- `1210`: Human Judgement - PASS (Approved)
- `0810`: Machine Judgement - PASS (Approved)
- `0811`: Machine Judgement - FAIL - Compare Rejected (Rejected)
- `0812`: Machine Judgement - Pure Provisional (Continue polling)
- `0908`: Issuer not available (System unavailable - returns immediately)
- `2428`: Out of credits (System error - returns immediately with admin notification)

---

## Usage Flow

1. **Submit Verification:**

   ```
   POST /api/kyc/verify
   → Returns: { success: true, jobId: "job-123", status: "pending" }
   ```

2. **Poll for Status:**

   ```
   GET /api/kyc/job/job-123
   → Polls every 3 seconds for up to 5 minutes
   → Returns final result when category is "approved" or "rejected"
   → Returns pending status after timeout
   ```

3. **Check Profile (if timeout):**
   ```
   User should check their profile later to see if verification completed
   ```

---

## Notes

- The `/verify` endpoint returns immediately after submission
- Webhooks update the KYC session in the background
- The `/job/:jobId` endpoint reads from the database (updated by webhooks)
- All decisions are based on result codes from `resultcodes.json`, not session status
- Special handling for error code `0908` (system unavailable) and `2428` (out of credits)
