# Onramp Money Integration

Onramp Money handles onramp (buy crypto) and offramp (sell crypto) for currencies **not covered by Pretium or Paycrest**. It works via a **widget link flow** — the backend generates a secure payment link, the frontend opens it, and the user completes the transaction in the Onramp Money widget.


All endpoints are under `/onramp-money`.

---

## Supported Currencies

### Onramp (Buy Crypto with Fiat)

| Currency | Country | Payment Methods |
|----------|---------|-----------------|
| INR | India | UPI, IMPS (bank) |
| EUR | EU (20+ countries) | Open Banking, SEPA Bank Transfer |
| USD | USA | Wire Transfer, ACH |
| AED | UAE | Bank Transfer |
| GBP | UK | Faster Payments, Bank Transfer |
| ZAR | South Africa | Bank Transfer |
| RWF | Rwanda | (active, methods TBD) |

### Offramp (Sell Crypto for Fiat)

| Currency | Country | Payment Methods |
|----------|---------|-----------------|
| INR | India | IMPS |
| EUR | EU | SEPA Bank Transfer |
| GBP | UK | (active) |
| ZAR | South Africa | (active) |

**Not available for offramp:** USD, AED, RWF

### NOT on Onramp Money (use existing endpoints)

These currencies are handled by Pretium/Paycrest — do NOT send them to `/onramp-money`:
- KES, UGX, CDF, ETB, NGN, TZS, MWK, BRL, GHS

---

## Supported Chains

| Chain | Status |
|-------|--------|
| Polygon (matic20) | Confirmed |
| BSC (bep20) | Confirmed |
| Solana (spl) | Confirmed |
| Base | Not in their config — may work via widget, test first |
| Celo | Not confirmed |
| Arbitrum | Not confirmed |

Pass chain as: `"POLYGON"`, `"BASE"`, `"ARBITRUM"`, etc. (uppercase).

---

## Supported Tokens

- **USDC** (primary)
- **USDT** (also available)

---

## Which Endpoint Do I Call?

Don't hardcode provider routing. Call this first:

**`GET /offramp/resolve-provider?currency=INR&type=onramp`**

Response:
```json
{
  "currency": "INR",
  "type": "onramp",
  "provider": "onramp_money",
  "endpoint": "POST /onramp-money/buy",
  "quoteEndpoint": "POST /onramp-money/quote",
  "flow": "widget_link"
}
```

```json
// GET /offramp/resolve-provider?currency=KES&type=onramp
{
  "currency": "KES",
  "type": "onramp",
  "provider": "pretium",
  "endpoint": "POST /offramp/onramp",
  "quoteEndpoint": "POST /offramp/preview_exchange_rate",
  "flow": "stk_push"
}
```

```json
// GET /offramp/resolve-provider?currency=EUR&type=offramp
{
  "currency": "EUR",
  "type": "offramp",
  "provider": "onramp_money",
  "endpoint": "POST /onramp-money/sell",
  "quoteEndpoint": "POST /onramp-money/quote",
  "flow": "widget_link"
}
```

**`flow` tells you how to handle the response:**
- `"stk_push"` — Pretium/Paycrest. User gets a push notification or payment is processed directly. Show a "waiting for confirmation" screen.
- `"widget_link"` — Onramp Money. Response contains a `link`. Open it in a new tab or iframe. User completes payment there.
- `"direct"` — Offramp via Pretium/Paycrest. Backend handles the payout directly.

### Frontend Example

```typescript
async function startOnramp(currency: string, amount: number, chain: string) {
  // 1. Ask backend which provider to use
  const res = await fetch(`/offramp/resolve-provider?currency=${currency}&type=onramp`);
  const { provider, endpoint, flow } = await res.json();

  // 2. Call the right endpoint
  const txRes = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currency, amount, chain }),
  });
  const data = await txRes.json();

  // 3. Handle based on flow type
  if (flow === 'widget_link') {
    window.open(data.link, '_blank'); // or embed in iframe
  } else {
    showWaitingScreen(data); // STK push or direct processing
  }
}
```

---

## How It Works

1. Frontend calls `/onramp-money/quote` to show the user a preview
2. Frontend calls `/onramp-money/buy` (or `/sell`) with the amount
3. Backend returns a `link` (widget URL) and `urlHash`
4. **Frontend opens the link** — either in a new tab, iframe, or webview
5. User completes payment in the Onramp Money widget
6. Onramp Money sends crypto to the user's wallet (onramp) or fiat to their bank (offramp)
7. Backend receives a webhook and updates the order status

---

## Endpoints

### 1. Get Quote

Preview the exchange rate and fees before transacting.

**`POST /onramp-money/quote`** (public, no auth)

#### Onramp Quote (fiat to crypto)

```json
{
  "currency": "INR",
  "amount": 5000,
  "type": "onramp",
  "chain": "POLYGON"
}
```

Response:
```json
{
  "provider": "onramp_money",
  "type": "onramp",
  "currency": "INR",
  "quote": {
    "rate": 89.28,
    "quantity": 54.32,
    "onrampFee": 0.5,
    "clientFee": 0,
    "gatewayFee": 0,
    "gasFee": 0.21
  }
}
```

- `rate` — crypto price in fiat (e.g. 1 USDC = 89.28 INR)
- `quantity` — estimated USDC the user will receive
- `onrampFee` — Onramp Money's fee (percentage)
- `gasFee` — onchain withdrawal fee (in USDC)

#### Offramp Quote (crypto to fiat)

```json
{
  "currency": "INR",
  "amount": 50,
  "type": "offramp",
  "chain": "POLYGON"
}
```

`amount` here is the USDC quantity the user wants to sell. You can also use `"quantity": 50` instead.

Response:
```json
{
  "provider": "onramp_money",
  "type": "offramp",
  "currency": "INR",
  "quote": {
    "fiatAmount": 4350.50,
    "rate": 89.28,
    "onrampFee": 0.89,
    "clientFee": 0,
    "gatewayFee": 2.36,
    "tdsFee": 1.79
  }
}
```

- `fiatAmount` — fiat the user will receive after all deductions
- `tdsFee` — India-specific tax (only for INR)

---

### 2. Buy Crypto (Onramp)

**`POST /onramp-money/buy`** (authenticated, JWT required)

```json
{
  "currency": "INR",
  "amount": 5000,
  "chain": "POLYGON"
}
```

- `currency` — fiat currency code (INR, EUR, USD, AED, GBP, ZAR, RWF)
- `amount` — fiat amount the user wants to pay
- `chain` — blockchain to receive USDC on (POLYGON, BASE, etc.)

Response:
```json
{
  "provider": "onramp_money",
  "link": "https://onramp.money/main/buy?urlHash=ABCua4asd_10048",
  "urlHash": "ABCua4asd_10048",
  "fiatAmount": 5000,
  "currency": "INR"
}
```

**Frontend action:** Open `link` in a new tab or embedded webview. The user completes payment there.

---

### 3. Sell Crypto (Offramp)

**`POST /onramp-money/sell`** (authenticated, JWT required)

Only available for: INR, EUR, GBP, ZAR.

```json
{
  "currency": "EUR",
  "amount": 100,
  "chain": "POLYGON"
}
```

- `amount` — fiat amount the user wants to receive

Response:
```json
{
  "provider": "onramp_money",
  "link": "https://onramp.money/main/sell?urlHash=XYZdef_10048",
  "urlHash": "XYZdef_10048",
  "fiatAmount": 100,
  "currency": "EUR"
}
```

**Frontend action:** Open `link`. User connects wallet in widget and completes the sale.

---

### 4. Check Order Status

**`POST /onramp-money/order-status`** (authenticated)

```json
{
  "orderId": 12345,
  "type": "onramp"
}
```


Response:
```json
{
  "provider": "onramp_money",
  "orderId": 12345,
  "status": {
    "orderStatus": 4
  }
}
```

Status codes:
- **Onramp:** 0=created, 1-3=processing, 4/5=completed, negative=failed
- **Offramp:** 0=created, 1-5=processing, 6/7=completed, 19=success, negative=failed

---

### 5. Get Supported Countries

**`GET /onramp-money/countries`** (public)

Returns the full country config from Onramp Money with active/inactive status and available payment methods for buy and sell.

Response:
```json
{
  "provider": "onramp_money",
  "data": {
    "buy": {
      "IN": { "currency": "INR", "isActive": 1, "paymentMethods": { "UPI": 1, "IMPS": 2 } },
      "GB": { "currency": "GBP", "isActive": 1, "paymentMethods": { "FASTER_PAYMENTS": 1, "GBP-BANK-TRANSFER": 2 } }
    },
    "sell": {
      "IN": { "currency": "INR", "isActive": 1, "paymentMethods": { "IMPS": 1 } }
    }
  }
}
```

---

## Frontend Integration Example

```typescript
// 1. Show quote preview
const quoteRes = await fetch('/onramp-money/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currency: 'INR',
    amount: 5000,
    type: 'onramp',
    chain: 'POLYGON'
  })
});
const { quote } = await quoteRes.json();
// Show user: "You'll receive ~{quote.quantity} USDC"

// 2. Initiate the transaction
const buyRes = await fetch('/onramp-money/buy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    currency: 'INR',
    amount: 5000,
    chain: 'POLYGON'
  })
});
const { link } = await buyRes.json();

// 3. Open the payment link
window.open(link, '_blank');
// Or embed in an iframe:
// <iframe src={link} width="100%" height="600" />
```

---

## Provider Routing Summary

When the frontend needs to buy/sell crypto, pick the right endpoint based on currency:

| Currency | Onramp Endpoint | Offramp Endpoint |
|----------|----------------|-----------------|
| KES | `POST /offramp/onramp` | `POST /offramp/offramp` or `/offramp/pay` |
| UGX, CDF, ETB | `POST /offramp/onramp` | `POST /offramp/offramp` or `/offramp/pay` |
| NGN | `POST /offramp/onramp` | `POST /offramp/offramp` or `/offramp/pay` |
| TZS, MWK, BRL | `POST /offramp/onramp` | `POST /offramp/offramp` or `/offramp/pay` |
| GHS | `POST /offramp/onramp` | `POST /offramp/offramp` or `/offramp/pay` |
| **INR, EUR, USD, AED, GBP, ZAR, RWF** | **`POST /onramp-money/buy`** | **`POST /onramp-money/sell`** |

The backend will return an error with `"provider": "onramp_money"` if you accidentally send an Onramp Money currency to the old `/offramp/onramp` endpoint.

---

## Error Handling

All errors return:
```json
{
  "error": "description of what went wrong"
}
```

Common errors:
- `"Offramp is not active for USD"` — currency doesn't support that direction
- `"Chain BASE is not supported by Onramp Money"` — try POLYGON instead
- `"currency, amount, and chain are required"` — missing fields
- `"INR fiatType not found"` — backend config issue, contact backend team

---

## Key Differences from Pretium/Paycrest Flow

| | Pretium/Paycrest | Onramp Money |
|---|---|---|
| **How it works** | Backend initiates STK push or creates order directly | Backend returns a payment link, user completes in widget |
| **User experience** | User gets push notification / pays directly | User is redirected to Onramp Money widget |
| **Chain support** | Base, Celo | Polygon, BSC, Solana (Base TBD) |
| **Currencies** | KES, UGX, NGN, TZS, etc. | INR, EUR, USD, GBP, AED, ZAR, RWF |
| **Response** | Transaction code + fee breakdown | Payment link + urlHash |
| **Status updates** | Webhook to backend | Webhook to backend |
