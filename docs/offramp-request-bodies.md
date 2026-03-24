# Frontend Offramp Integration — Request Bodies

This document describes exactly what the frontend sends to `POST /offramp/offramp` (withdraw) and `POST /offramp/pay` for every supported currency and chain combination. Please verify these are correct.

---

## General Request Shape

Both endpoints receive the same shape:

```json
{
  "token": "USDC" | "USDT",
  "amount": <number>,          // USD amount (not local currency)
  "currency": "<CURRENCY_CODE>",
  "chain": "base" | "ethereum" | "celo" | "polygon" | "lisk",
  "recipient": "<JSON string>"
}
```

- `amount` is always in USD (converted from local currency using `buying_rate` from `preview_exchange_rate`)
- `recipient` is always a **stringified JSON object**, not a nested object
- `chain` is always lowercase

---

## Supported Chains × Tokens

The frontend allows users to offramp from any chain/token combo where they have a balance:

| Source ID | token | chain | sdkChain |
|-----------|-------|-------|----------|
| base-usdc | USDC | BASE | base |
| ethereum-usdc | USDC | ETHEREUM | ethereum |
| ethereum-usdt | USDT | ETHEREUM | ethereum |
| celo-usdc | USDC | CELO | celo |
| celo-usdt | USDT | CELO | celo |
| polygon-usdc | USDC | POLYGON | polygon |
| polygon-usdt | USDT | POLYGON | polygon |
| lisk-usdc | USDC | LISK | lisk |
| lisk-usdt | USDT | LISK | lisk |

---

## Supported Currencies

| Currency | Country | Supported Payment Methods |
|----------|---------|--------------------------|
| KES | Kenya | Mobile Money (Safaricom, Airtel), Paybill, Buy Goods |
| NGN | Nigeria | Bank Transfer (15+ banks) |
| UGX | Uganda | Mobile Money (MTN, Airtel Money) |
| TZS | Tanzania | Mobile Money (Tigo Pesa, Airtel), Bank Transfer (CRDB, NMB, etc.) |
| CDF | DR Congo | Mobile Money (Orange Money, Airtel Money) |
| MWK | Malawi | Mobile Money (TNM), Bank Transfer (National Bank, Standard, etc.) |
| BRL | Brazil | PIX |

**Removed:** GHS (Ghana), ETB (Ethiopia) — no longer available in the frontend.

---

## Pay (`/offramp/pay`) — Recipient Bodies by Currency

### KES — Mobile Money (Safaricom)

```json
{
  "token": "USDC",
  "amount": 1.5,
  "currency": "KES",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0797168636\",\"currency\":\"KES\",\"type\":\"MOBILE\",\"institution\":\"Safaricom\"}"
}
```

### KES — Mobile Money (Airtel)

```json
{
  "token": "USDC",
  "amount": 1.5,
  "currency": "KES",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0733123456\",\"currency\":\"KES\",\"type\":\"MOBILE\",\"institution\":\"Airtel\"}"
}
```

### KES — Paybill

```json
{
  "token": "USDC",
  "amount": 1.5,
  "currency": "KES",
  "chain": "celo",
  "recipient": "{\"accountIdentifier\":\"247247\",\"accountNumber\":\"0797168636\",\"currency\":\"KES\",\"type\":\"PAYBILL\",\"institution\":\"Safaricom\"}"
}
```

### KES — Buy Goods (Till)

```json
{
  "token": "USDC",
  "amount": 1.5,
  "currency": "KES",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"5678901\",\"currency\":\"KES\",\"type\":\"BUY_GOODS\",\"institution\":\"Safaricom\"}"
}
```

### NGN — Bank Transfer

```json
{
  "token": "USDT",
  "amount": 50,
  "currency": "NGN",
  "chain": "ethereum",
  "recipient": "{\"accountIdentifier\":\"0123456789\",\"currency\":\"NGN\",\"institution\":\"Access Bank\",\"type\":\"MOBILE\",\"accountName\":\"John Doe\"}"
}
```

> **Note:** `type` is `"MOBILE"` even for bank transfers per your docs. `accountName` is always included for NGN (required by frontend for bank transfers).

### UGX — MTN Mobile Money

```json
{
  "token": "USDC",
  "amount": 10,
  "currency": "UGX",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0771234567\",\"currency\":\"UGX\",\"institution\":\"MTN\",\"type\":\"MOBILE\"}"
}
```

### UGX — Airtel Money

```json
{
  "token": "USDC",
  "amount": 10,
  "currency": "UGX",
  "chain": "polygon",
  "recipient": "{\"accountIdentifier\":\"0751234567\",\"currency\":\"UGX\",\"institution\":\"Airtel Money\",\"type\":\"MOBILE\"}"
}
```

### TZS — Tigo Pesa (Mobile)

```json
{
  "token": "USDC",
  "amount": 15,
  "currency": "TZS",
  "chain": "lisk",
  "recipient": "{\"accountIdentifier\":\"0651234567\",\"currency\":\"TZS\",\"institution\":\"Tigo Pesa\",\"type\":\"MOBILE\"}"
}
```

### TZS — Airtel (Mobile)

```json
{
  "token": "USDT",
  "amount": 15,
  "currency": "TZS",
  "chain": "celo",
  "recipient": "{\"accountIdentifier\":\"0681234567\",\"currency\":\"TZS\",\"institution\":\"Airtel\",\"type\":\"MOBILE\"}"
}
```

### TZS — Bank Transfer (CRDB)

```json
{
  "token": "USDC",
  "amount": 15,
  "currency": "TZS",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"1234567890\",\"currency\":\"TZS\",\"institution\":\"CRDB Bank\",\"type\":\"MOBILE\",\"accountName\":\"John Doe\"}"
}
```

### CDF — Orange Money

```json
{
  "token": "USDC",
  "amount": 5,
  "currency": "CDF",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0991234567\",\"currency\":\"CDF\",\"institution\":\"Orange Money\",\"type\":\"MOBILE\"}"
}
```

### CDF — Airtel Money

```json
{
  "token": "USDC",
  "amount": 5,
  "currency": "CDF",
  "chain": "ethereum",
  "recipient": "{\"accountIdentifier\":\"0971234567\",\"currency\":\"CDF\",\"institution\":\"Airtel Money\",\"type\":\"MOBILE\"}"
}
```

### MWK — TNM Mpamba (Mobile)

```json
{
  "token": "USDC",
  "amount": 8,
  "currency": "MWK",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0881234567\",\"currency\":\"MWK\",\"institution\":\"TNM\",\"type\":\"MOBILE\"}"
}
```

### MWK — Bank Transfer (National Bank)

```json
{
  "token": "USDT",
  "amount": 8,
  "currency": "MWK",
  "chain": "polygon",
  "recipient": "{\"accountIdentifier\":\"1234567890\",\"currency\":\"MWK\",\"institution\":\"National Bank of Malawi\",\"type\":\"MOBILE\",\"accountName\":\"John Doe\"}"
}
```

### BRL — PIX

```json
{
  "token": "USDC",
  "amount": 25,
  "currency": "BRL",
  "chain": "ethereum",
  "recipient": "{\"accountIdentifier\":\"user@email.com\",\"currency\":\"BRL\",\"institution\":\"Pix\",\"type\":\"MOBILE\"}"
}
```

> `accountIdentifier` for PIX can be: email, CPF, phone number, or random key.

---

## Withdraw (`/offramp/offramp`) — Recipient Bodies

Withdrawals use the same recipient format as pay. The difference is that the recipient comes from the **stored withdrawal account** (set up in profile settings), not from inline user input.

The stored account is saved as a JSON string in the user's `paymentAccount` field and sent directly as the `recipient` value.

### KES — Withdrawal Account (Safaricom Mobile)

```json
{
  "token": "USDC",
  "amount": 5.2,
  "currency": "KES",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0797168636\",\"institution\":\"Safaricom\",\"type\":\"MOBILE\",\"currency\":\"KES\"}"
}
```

### KES — Withdrawal Account (Paybill)

```json
{
  "token": "USDC",
  "amount": 5.2,
  "currency": "KES",
  "chain": "celo",
  "recipient": "{\"accountIdentifier\":\"247247\",\"accountNumber\":\"0797168636\",\"institution\":\"Safaricom\",\"type\":\"PAYBILL\",\"currency\":\"KES\"}"
}
```

### NGN — Withdrawal Account (Bank)

```json
{
  "token": "USDT",
  "amount": 20,
  "currency": "NGN",
  "chain": "ethereum",
  "recipient": "{\"accountIdentifier\":\"0123456789\",\"accountName\":\"John Doe\",\"institution\":\"GTBank\",\"currency\":\"NGN\"}"
}
```

> **Note:** NGN withdrawal accounts do NOT include `type` or `bankCode` in the stored account. The backend should handle this. If `bankCode` is required, let us know and we'll add it.

### UGX — Withdrawal Account (MTN)

```json
{
  "token": "USDC",
  "amount": 10,
  "currency": "UGX",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0771234567\",\"institution\":\"MTN\",\"currency\":\"UGX\"}"
}
```

### TZS — Withdrawal Account (Mobile)

```json
{
  "token": "USDC",
  "amount": 15,
  "currency": "TZS",
  "chain": "lisk",
  "recipient": "{\"accountIdentifier\":\"0651234567\",\"institution\":\"Tigo Pesa\",\"currency\":\"TZS\"}"
}
```

### TZS — Withdrawal Account (Bank)

```json
{
  "token": "USDC",
  "amount": 15,
  "currency": "TZS",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"1234567890\",\"accountName\":\"John Doe\",\"institution\":\"CRDB Bank\",\"currency\":\"TZS\"}"
}
```

### CDF — Withdrawal Account (Orange Money)

```json
{
  "token": "USDC",
  "amount": 5,
  "currency": "CDF",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0991234567\",\"institution\":\"Orange Money\",\"currency\":\"CDF\"}"
}
```

### MWK — Withdrawal Account (TNM)

```json
{
  "token": "USDC",
  "amount": 8,
  "currency": "MWK",
  "chain": "base",
  "recipient": "{\"accountIdentifier\":\"0881234567\",\"institution\":\"TNM\",\"currency\":\"MWK\"}"
}
```

### MWK — Withdrawal Account (Bank)

```json
{
  "token": "USDT",
  "amount": 8,
  "currency": "MWK",
  "chain": "polygon",
  "recipient": "{\"accountIdentifier\":\"1234567890\",\"accountName\":\"John Doe\",\"institution\":\"National Bank of Malawi\",\"currency\":\"MWK\"}"
}
```

### BRL — Withdrawal Account (PIX)

```json
{
  "token": "USDC",
  "amount": 25,
  "currency": "BRL",
  "chain": "ethereum",
  "recipient": "{\"accountIdentifier\":\"user@email.com\",\"institution\":\"Pix\",\"currency\":\"BRL\"}"
}
```

---

## Differences Between Pay and Withdraw Recipients

| Field | Pay (`/offramp/pay`) | Withdraw (`/offramp/offramp`) |
|-------|---------------------|-------------------------------|
| Source | Constructed inline from user input | Pre-stored in user's `paymentAccount` field |
| `type` field | Always included (e.g., `"MOBILE"`, `"PAYBILL"`, `"BUY_GOODS"`) | Only included for KES accounts that have a type |
| `accountName` | Included if user enters it | Included if user entered it during setup |
| `bankCode` | NOT included | NOT included |

---

## Questions for Backend

1. **NGN `bankCode`:** The docs mention `bankCode` is required for Pretium NGN transfers. The frontend currently does NOT send `bankCode`. Does the backend resolve this from the institution name, or do we need to add bank code selection to the frontend?

2. **NGN `type` field:** For pay, we send `type: "MOBILE"` per the docs. For withdraw (stored accounts), we don't store a `type`. Is this OK?

3. **BRL `type` field:** For pay, we send `type: "MOBILE"` per the docs. For withdraw (stored accounts), we don't store a `type`. Is this OK?

4. **KES Airtel:** We now allow Airtel as a provider for KES mobile money (in addition to Safaricom). Is this supported?

5. **`accountName` for NGN:** Is `accountName` required for all NGN bank transfers, or optional? Frontend currently requires it for all bank-type institutions.

6. **All chain/token combos:** Are all 9 source configs (base USDC, ethereum USDC/USDT, celo USDC/USDT, polygon USDC/USDT, lisk USDC/USDT) supported for ALL currencies listed above? Or are some combos unsupported?

---

## Institutions Sent by Frontend

### NGN Banks
Access Bank, GTBank, First Bank, UBA, Zenith Bank, Fidelity Bank, FCMB, Union Bank, Polaris Bank, Stanbic IBTC, Sterling Bank, Wema Bank, Keystone Bank, Ecobank, Heritage Bank

### TZS Providers
**Mobile:** Tigo Pesa, Airtel
**Banks:** CRDB Bank, NMB, Stanbic, Bank of Africa

### CDF Providers
Orange Money, Airtel Money

### MWK Providers
**Mobile:** TNM
**Banks:** National Bank of Malawi, Standard Bank, FDH Bank, NBS Bank, Ecobank

### BRL
Pix (institution name sent as `"Pix"`)

### KES
**Mobile:** Safaricom, Airtel
**Paybill/Buy Goods:** institution from user selection (defaults to Safaricom)

### UGX
MTN, Airtel Money
