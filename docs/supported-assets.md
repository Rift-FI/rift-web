# Supported Assets — Send & Convert

---

## Send Crypto

Users can send any token they own to another wallet address, via a specific link, or via an open link. The send flow discovers tokens from the SDK (`rift.assets.getUserTokens()`) — if the user holds it, they can send it.

### Sendable Tokens (by chain)

| Chain | Chain ID | Tokens |
|-------|----------|--------|
| **Base** | 8453 | ETH, USDC, USDT |
| **Ethereum** | 1 | Any token returned by SDK (USDC, USDT, ETH, DAI, WETH, etc.) |
| **Polygon** | 137 | USDC (+ any SDK-discovered token) |
| **Arbitrum** | 42161 | ETH, USDC, USDT |
| **Lisk** | 1135 | LSK, USDC, USDT |
| **Berachain** | 80085 | USDC.e |
| **Optimism** | 10 | Any SDK-discovered token |
| **Avalanche** | 43114 | Any SDK-discovered token |
| **BSC** | 56 | Any SDK-discovered token |

### Blocked from Sending

| Chain | Token | Reason |
|-------|-------|--------|
| **Celo** | USDC | `sendable: false` in token config |
| **Celo** | USDT | `sendable: false` in token config |

### How It Works

1. Frontend calls `rift.assets.getUserTokens()` to get all tokens the user owns across all chains
2. Tokens are matched against local definitions in `src/lib/assets/tokens.ts`
3. SDK tokens without a local definition are still shown (with fallback icons)
4. Tokens with `sendable: false` are filtered out
5. User picks a token → enters recipient address → enters amount → sends

---

## Convert (Cross-Chain Bridge)

Users can move **USDC** or **USDT** between supported chains. This is a same-token cross-chain bridge, not a swap.

### Supported Chains for Convert

| Chain | Chain ID | Tokens |
|-------|----------|--------|
| **Base** | 8453 | USDC, USDT |
| **Ethereum** | 1 | USDC, USDT |
| **Polygon** | 137 | USDC, USDT |
| **Arbitrum** | 42161 | USDC, USDT |
| **Celo** | 42220 | USDC, USDT |

### Not Supported for Convert

| Chain | Reason |
|-------|--------|
| **Lisk** | Bridge routes not available |
| **Optimism** | Not a withdrawable chain |
| **Avalanche** | Not a withdrawable chain |
| **BSC** | Not a withdrawable chain |
| **Berachain** | Not a withdrawable chain |

### How It Works

1. User selects token (USDC or USDT)
2. User selects source chain and destination chain (must be different)
3. Frontend fetches a quote via `useBridgeQuote`
4. On confirm, frontend executes via `useBridgeExecute`
5. An "in transit" banner appears on the home page while the bridge processes (typically 1–5 minutes)
6. Minimum amount: 1 USDC/USDT

### Why Convert Exists

Users may hold USDC/USDT on a chain that's less optimal for withdrawals. Convert lets them move funds to a preferred chain (e.g., Base) before withdrawing to fiat. The withdraw/pay source select pages show a "Move" button next to non-withdrawable balances that links directly to the convert page.

---

## Withdrawable Assets (for reference)

These are the chain/token combos that can be offramped to fiat. Users can withdraw from any of these:

| Chain | Token |
|-------|-------|
| Base | USDC, USDT |
| Ethereum | USDC, USDT |
| Polygon | USDC, USDT |
| Celo | USDC, USDT |
| Arbitrum | USDC, USDT |
| Lisk | USDC, USDT |

Only USDC and USDT can be withdrawn. All other tokens are hold-only or need to be converted/swapped first.
