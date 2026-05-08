# Cross-border Pay Flow (e.g. sending money to Nigeria)

This document explains exactly how the **Pay** feature works end-to-end: which
screens the user moves through, what state we keep, what we send to the
backend, and where the money actually goes.

The flow is the same for every supported destination country — Kenya, Nigeria,
Uganda, Tanzania, DR Congo, Malawi, Brazil, USD. The only thing that changes
per country is the **`type` + `institution`** the user picks on the Recipient
screen, plus the validation rules around the recipient identifier.

---

## 1. The route and the components

| Route | Component | Purpose |
|---|---|---|
| `/app/pay` | [`src/features/pay/index.tsx`](../src/features/pay/index.tsx) | Wraps the flow in `PayProvider` and renders the current step. |

The page is a small state machine driven by `currentStep` in
[`src/features/pay/context.tsx`](../src/features/pay/context.tsx). Steps:

```
country → type → source → amount → recipient → confirmation
```

| Step | Component | What happens |
|---|---|---|
| `country` | [`CountrySelector`](../src/features/pay/components/CountrySelector.tsx) | User picks the destination currency (Nigeria → `NGN`). Sets `paymentData.currency`. |
| `type` | [`PaymentTypeSelector`](../src/features/pay/components/PaymentTypeSelector.tsx) | Only used for Kenya (mobile vs bank vs paybill vs buy-goods). For Nigeria/Uganda/etc. this step is skipped — the type is implicitly `MOBILE`. |
| `source` | [`PaySourceSelect`](../src/features/pay/components/PaySourceSelect.tsx) | User picks the chain + token to pay from (Base USDC, Polygon USDT, etc.). Sets `paymentData.selectedSource`. |
| `amount` | [`AmountInput`](../src/features/pay/components/AmountInput.tsx) | User enters how much in **local currency** (NGN). Min is computed from `$3 × buying_rate`, only enforced if the smart account isn't deployed yet on the source chain. |
| `recipient` | [`RecipientInput`](../src/features/pay/components/RecipientInput.tsx) | User enters the bank/account info (account number, account name, bank). Builds the `RecipientData` object. |
| `confirmation` | [`PaymentConfirmation`](../src/features/pay/components/PaymentConfirmation.tsx) | Final review + OTP/password, then fires `paymentMutation.mutateAsync(paymentRequest)`. |

The actual mutation lives in [`src/hooks/data/use-payment.tsx`](../src/hooks/data/use-payment.tsx), which calls `rift.offramp.pay(request)` — that hits the backend at:

```
POST https://payment.riftfi.xyz/offramp/pay
Authorization: Bearer <user JWT>
x-api-key:     <VITE_SDK_API_KEY>
Content-Type:  application/json
```

---

## 2. The shape of `paymentData` (front-end state)

```ts
// src/features/pay/context.tsx
interface PaymentData {
  currency?:        SupportedCurrency;      // "NGN", "KES", "UGX", ...
  type?:            "MOBILE" | "PAYBILL" | "BUY_GOODS" | "BANK" | "PHONE_NUMBER";
  selectedSource?:  OfframpSource;          // "polygon-usdc", "base-usdt", ...
  amount?:          number;                  // local-currency amount (e.g. NGN 5000)
  recipient?:       RecipientData;
  feeBreakdown?:    FeeBreakdown;
}

interface RecipientData {
  accountIdentifier: string;   // for NGN → bank account number, e.g. "0123456789"
  accountName?:      string;   // required for bank transfers, e.g. "John Doe"
  institution:       string;   // for NGN → bank name, e.g. "Access Bank"
  type?:             PaymentType;
  currency:          SupportedCurrency;
  bankCode?:         string;   // optional, used by some integrators (Pretium)
  accountNumber?:    string;   // only for Kenyan PAYBILL
}
```

For **Nigeria specifically**, the user picks a bank from a hardcoded list in
[`RecipientInput.tsx`](../src/features/pay/components/RecipientInput.tsx#L29-L45)
and types an account number + account name. The currently supported NGN banks
are:

| # | Bank name (string sent in `institution`) |
|---|---|
| 1 | `Access Bank` |
| 2 | `GTBank` |
| 3 | `First Bank` |
| 4 | `UBA` |
| 5 | `Zenith Bank` |
| 6 | `Fidelity Bank` |
| 7 | `FCMB` |
| 8 | `Union Bank` |
| 9 | `Polaris Bank` |
| 10 | `Stanbic IBTC` |
| 11 | `Sterling Bank` |
| 12 | `Wema Bank` |
| 13 | `Keystone Bank` |
| 14 | `Ecobank` |
| 15 | `Heritage Bank` |

> The exact strings above are what we send in `recipient.institution`. The
> back-end resolves them to a `bankCode` for the Pretium / Flutterwave
> integration. Adding a new Nigerian bank means adding it to the `INSTITUTIONS.NGN`
> array and making sure the integrator recognises the same string. Unlike
> Kenya, there is no remote `/reference/...` lookup for NGN — the list is
> static client-side.

The recipient object built at the end of the recipient step (Nigeria branch)
looks like:

```js
{
  accountIdentifier: "0123456789",   // user's typed account number
  institution:       "Access Bank",  // user's selection from the bank list
  type:              "MOBILE",       // backend uses MOBILE for every non-Kenya country
  currency:          "NGN",
  accountName:       "John Doe"      // appended only when the user filled it in
}
```

> The `type: "MOBILE"` looks weird for a bank transfer — it's not a literal
> "mobile money" flag. The Rift backend overloaded `MOBILE` to mean "the
> default off-ramp method for this country", and only Kenya distinguishes
> further (BANK / PAYBILL / BUY_GOODS). See
> [`RecipientInput.tsx:194-197`](../src/features/pay/components/RecipientInput.tsx#L194-L197).

---

## 3. The request body sent to `/offramp/pay`

In [`PaymentConfirmation.tsx`](../src/features/pay/components/PaymentConfirmation.tsx#L116-L127)
we build the request like this:

```ts
const recipientString = JSON.stringify(paymentData.recipient);

const paymentRequest = {
  token:       sourceConfig.token,        // "USDC" | "USDT"
  amount:      usdAmountToSend,           // USD amount, decimal e.g. 12.345678
  localAmount: localAmount,               // NGN amount, integer e.g. 5000
  currency:    currency,                  // "NGN"
  chain:       sourceConfig.sdkChain,     // "polygon" | "base" | "ethereum" | "arbitrum" | "celo"
  recipient:   recipientString,           // stringified RecipientData
  otpCode:     verification.otpCode,      // present when auth method is OTP
  password:    verification.password,     // present when auth method is password
};

await paymentMutation.mutateAsync(paymentRequest);
```

The corresponding TypeScript shape from the SDK
([`@rift-finance/wallet`](../node_modules/@rift-finance/wallet/dist/types.d.ts#L257-L270)):

```ts
interface PayRequest {
  token:           "USDC" | "USDT" | ...;
  amount:          number;            // USD value being paid (post-fee)
  localAmount?:    number;            // local currency amount the recipient receives
  currency:        OfframpCurrency;   // NGN, KES, UGX, ...
  chain:           "base" | "polygon" | "ethereum" | "arbitrum" | "celo";
  recipient:       string;            // JSON-stringified RecipientData
  otpCode?:        string;
  password?:       string;
  utilities?:      boolean;           // utility-bill payments (Kenya-only)
  service_code?:   string;
  contact_number?: string;
  shortcode?:      string;
}
```

### Concrete example: NGN 5,000 to a GTBank account on Polygon USDC

```http
POST /offramp/pay HTTP/1.1
Host:           payment.riftfi.xyz
Authorization:  Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
x-api-key:      pk_live_...
Content-Type:   application/json
```

```json
{
  "token":       "USDC",
  "amount":      3.378378,
  "localAmount": 5000,
  "currency":    "NGN",
  "chain":       "polygon",
  "recipient":   "{\"accountIdentifier\":\"0123456789\",\"institution\":\"GTBank\",\"type\":\"MOBILE\",\"currency\":\"NGN\",\"accountName\":\"John Doe\"}",
  "otpCode":     "1234"
}
```

> `recipient` really is a string — the backend `JSON.parse`s it server-side.
> This is awkward but kept for backwards compatibility with the SDK contract.

### How the numbers are computed

- `localAmount` — exactly what the user typed in NGN.
- `amount` — `localAmount` divided by `feePreview.buying_rate` (or `feePreview.rate`),
  rounded to 6 decimal places (USDC has 6 decimals, so anything finer would round-trip wrong).
  Source: [`PaymentConfirmation.tsx:101-106`](../src/features/pay/components/PaymentConfirmation.tsx#L101-L106).
- `feePreview` comes from a separate hook, [`useOfframpFeePreview(currency)`](../src/hooks/data/use-offramp-fee.tsx),
  which calls `POST /offramp/preview_exchange_rate` once at the start of the amount step.
- The user's wallet is debited by `usdcNeeded = amount + fee` (USDC). The backend keeps the fee.

### Auth fields (`otpCode` / `password`)

The user's auth method is one of three:
- `phone-otp` — we ask for a 4-digit code (delivered via SMS) and send it as `otpCode`.
- `email-otp` — same but delivered to email.
- `external-id-password` — username + password account; we send `password`.

These are gathered in the
[`TransactionVerification`](../src/components/ui/transaction-verification.tsx)
modal that pops up before we fire the mutation.

---

## 4. The response

```ts
interface PayResponse {
  order: {
    id:                string;
    status:            string;       // "PENDING" / "COMPLETED" / "FAILED" ...
    transactionCode:   string;       // Rift's internal id
    amount:            number;       // local-currency amount
    createdAt:         string;
    transaction_hash?: string;       // on-chain tx hash once relayed
    receipt_number?:   string;       // upstream receipt (M-Pesa / Pretium)
    currency?:         string;
    chain?:            string | null;
    token?:            string | null;
    totalDeducted?:    number;
    usdcDeducted?:     number;       // exact USD equivalent — used by receipt PDF
    fee?:              number;
    feePercentage?:    number;
    feeNote?:          string;
    provider?:         string;
    public_name?:      string | null;
  }
}
```

After the mutation resolves successfully we:

1. Call [`markAccountDeployed(sourceConfig.chain)`](../src/hooks/wallet/use-account-deployed.tsx)
   so the smart account is recorded as deployed on this chain — future
   transfers from the same chain skip the $3 first-time minimum.
2. Add a "Pending withdrawal" row to local storage (so the user sees an
   inflight tile on the home screen).
3. Reset `paymentData` and route back to `/app`.

The history list later picks up the order via
[`useWithdrawalOrders`](../src/hooks/data/use-withdrawal-orders.tsx) (the
backend treats Pay and Withdraw as the same off-ramp order type).

---

## 5. What happens on the backend (high level)

The Rift payment service receives the JSON above and roughly does this:

1. **Authenticates** the user (JWT) and checks KYC tier limits. If the user is
   over their daily/monthly cap, returns `403` with `"KYC verification required"`,
   which the front-end maps to the "Verify identity" toast at
   [`PaymentConfirmation.tsx:140-147`](../src/features/pay/components/PaymentConfirmation.tsx#L140-L147).
2. **Computes the off-ramp quote**: locks in the `buying_rate`, derives `usdcNeeded`,
   subtracts the fee.
3. **Bundles a UserOperation** that pulls `usdcNeeded` from the user's smart
   account on the chosen chain (e.g. Polygon) and forwards it to Rift's
   liquidity contract. This is what physically deploys the account if it
   wasn't deployed yet — it's why the very first transfer on a chain has the
   $3 minimum.
4. **Hands off to a local provider** in the destination country:
   - Kenya: M-Pesa / Pesalink / KCB-Buni
   - Nigeria: Pretium / Flutterwave
   - Uganda: MTN MoMo / Airtel Money
   - Tanzania: M-Pesa / Tigo Pesa / Airtel
   - DR Congo: Orange Money / Airtel Money
   - Malawi: TNM / NBM
   - Brazil: PIX
5. **Persists an order row** with `transactionCode`, status `PENDING`. The
   front-end polls (or just refetches the orders list) to surface state
   changes — `COMPLETED` / `FAILED` / `RECEIVED` etc.

You can poll a single order with `rift.offramp.pollOrderStatus({ transactionCode })`,
which corresponds to `POST /offramp/poll`. We don't poll on the success page —
we just navigate home and let the orders list refetch.

---

## 6. Validation summary (what blocks the user from proceeding)

Per step:

- **`country`** — user must pick a flag tile.
- **`source`** — at least one of the user's chains must have a non-zero USDC
  or USDT balance. Lisk is excluded (no off-ramp path). Celo is fine.
- **`amount`** — local-currency amount > 0, ≥ first-time minimum if the
  account isn't yet deployed on the source chain (`$3 × buying_rate`),
  and the source must have enough USDC/USDT to cover `amount + fee`.
- **`recipient`** — the rules vary by country. For Nigeria:
  - account number must be non-empty
  - bank must be selected
  - account name must be non-empty (Nigeria treats `accountName` as required
    via the `needsAccountName` rule, since the institution type is `bank`).
- **`confirmation`** — verification step (OTP or password) must succeed before
  the request is fired.

All of these set the inline error text and disable the Continue button —
nothing fails silently.

---

## 7. Local cache + idempotency

Two pieces of front-end state worth knowing about:

- **Transaction lock** ([`src/utils/transaction-lock.ts`](../src/utils/transaction-lock.ts)):
  before firing the mutation we record `("pay", usdAmountToSend, recipient,
  currency)` and refuse to fire again within the dedupe window. This stops
  double-taps from creating two orders.
- **Account-deployed cache** ([`src/hooks/wallet/use-account-deployed.tsx`](../src/hooks/wallet/use-account-deployed.tsx)):
  `localStorage["rift:deployed:<chain>:<address>"] = "1"` is written on
  successful pay/withdraw/send. Future runs read it synchronously and skip
  the eth_getCode round-trip — once an account is deployed it stays deployed
  forever, so this is safe to cache indefinitely.

---

## 8. Quick reference: the smallest possible NGN-bank pay request

```jsonc
// POST https://payment.riftfi.xyz/offramp/pay
{
  "token":       "USDC",
  "amount":      3.4,            // USD ≈ NGN 5000 / 1469 buying_rate
  "localAmount": 5000,
  "currency":    "NGN",
  "chain":       "polygon",
  "recipient":   "{\"accountIdentifier\":\"0123456789\",\"institution\":\"GTBank\",\"type\":\"MOBILE\",\"currency\":\"NGN\",\"accountName\":\"Jane Doe\"}",
  "otpCode":     "1234"
}
```

That's the whole story.
