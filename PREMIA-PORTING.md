# Porting PREMIA onto a fresh wallet-app clone

Captured 2026-11-22 from `rift/app-lp` before that tree was deleted. `app-lp` was built on the
**Nov-11 generation** of the web wallet and was missing everything shipped since — notably the
"Move money across borders" welcome redesign that is live on `wallet.riftfi.xyz` and that you built
in `rift/mobile/src/app/welcome.tsx`. That staleness is why PREMIA is being ported rather than
`app-lp` being deployed: deploying it would have reverted the redesign.

Everything PREMIA lives in its own two directories. Only **two existing files** need edits, and both
edits are guarded by one flag import, so nothing runs unless the flag is explicitly on.

## 1. Copy in, unchanged

    src/v2/lib/premia/      → src/v2/lib/premia/      (12 files)
    src/v2/pages/premia/    → src/v2/pages/premia/    (8 files)
    tests/premia-live-screenshots.spec.ts
    .env.premia.example

No existing file is overwritten by any of these.

## 2. Two existing files to edit

Do NOT copy the `.REFERENCE` files over the clone's versions — the clone is newer and its own
contents must win. Re-apply only these lines.

### `src/v2/shell/nav.ts`

```ts
import { CandlestickChart } from "lucide-react";          // add to the existing lucide import
import { FEATURE_PREMIA } from "@/v2/lib/premia/flag";

/** PREMIA trading — additive, only present when the feature flag is on. */
const PREMIA_NAV: NavItem[] = FEATURE_PREMIA
  ? [{ id: "markets", label: "Markets", to: "/app/markets", icon: CandlestickChart, match: ["/app/markets", "/app/portfolio"] }]
  : [];
```

Then spread it into the nav array after the `home` entry, and add the tab:

```ts
export const NAV_ITEMS: NavItem[] = [
  { id: "home", ... },
  ...PREMIA_NAV,              // ← add
  { id: "activity", ... },
];

export const MOBILE_TABS = ["home", ...(FEATURE_PREMIA ? ["markets"] : []), "activity", "advanced", "settings"];
```

### `src/v2/shell/page-container/index.tsx`

```tsx
import { FEATURE_PREMIA } from "@/v2/lib/premia/flag";
import { PremiaProvider } from "@/v2/lib/premia/store";
import PremiaMarkets from "@/v2/pages/premia";
import PremiaMarket from "@/v2/pages/premia/market";
import PremiaPortfolio from "@/v2/pages/premia/portfolio";
```

and, inside the route tree:

```tsx
{FEATURE_PREMIA && (
  <>
    <Route element={<PremiaProvider><Outlet /></PremiaProvider>}>
      <Route path="/app/markets" element={<PremiaMarkets />} />
      <Route path="/app/markets/:id" element={<PremiaMarket />} />
      <Route path="/app/portfolio" element={<PremiaPortfolio />} />
    </Route>
  </>
)}
```

Check `page-container.index.tsx.REFERENCE` lines 99-111 for the exact nesting used — the provider
wraps only PREMIA's routes, so no other page pays for its context.

## 3. The flag

`FEATURE_PREMIA` is **opt-in**: `raw === "true" || raw === "1"`, unset = OFF. Verified that with the
var empty the string "Trade the premium" appears **zero** times in the production bundle — the whole
section tree-shakes out.

Keep it off in production until the blockers below are closed. For local work put
`VITE_FEATURE_PREMIA="true"` in `.env`.

## 4. Local dev: the CORS workaround

The sandbox backend's CORS allow-list does not include `http://localhost:5173`, so API calls fail
preflight and the app bounces to `/auth`. Two files in `app-lp` worked around it without changing
anything deployed — re-apply if you hit the same wall:

`vite.config.ts` → `server.proxy`:

```ts
proxy: { "/v1": { target: "https://sandbox.riftfi.com", changeOrigin: true, secure: true } }
```

`.env.local`:

```
VITE_RIFT_API_BASE=http://localhost:5173
```

That makes every API call same-origin so CORS never applies. Both readers of the var are covered:
`lib/apiBase.ts` `getApiBase()` and `lib/rift.ts` (which patches the SDK's `httpClient.baseUrl`).

Google Sign-In still fails locally (`GSI_LOGGER: The given origin is not allowed`) because Google
enforces that on its own servers — use email sign-in, or add the origin in the Google Cloud console.

## 5. State of the code at capture

Working and verified against live Base mainnet: all reads from chain, gas-sponsored user-ops through
the in-app wallet (no WalletConnect), real P&L from `PositionModified` logs, RPC failover
publicnode → drpc → mainnet.base.org. The full flow faucet → approve → deposit → modifyPosition →
close → withdraw was proven end-to-end against a Base fork with byte-identical calldata.

**No mainnet trade has ever executed** — that needs a passkey.

`points.ts` was mid-review when capture happened: time-weighted exposure (`units × seconds`) derived
from on-chain events, chosen over volume because the faucet is free and volume-based points can be
farmed by churning. Treat it as a draft and re-read it before trusting it.

## 6. Blockers before this touches real money

1. **λ_ref is a placeholder** → the mark for "Rise" is 0.00010¢ and the LMSR would sell the entire
   $408,648 cap for about **$0.63**. Harmless on prmUSD (valueless mock), catastrophic on USDC. A
   calibration was in progress; check `vomma/research/MREF-CALIBRATION.md`.
2. **κ_m is overridden to $200k**, not the measured $95k — see `vomma/research/KAPPA-NGN-BETA-OVERRIDE.md`.
3. **`nMin` lowered 5 → 3** on chain for the beta; `sourceAttestation()` still claims 5.
4. **prmUSD must read as valueless everywhere** — no bare `$` on a mock quantity. This work was
   in progress when capture happened and is incomplete.

## 7. Deployed contracts (Base mainnet, chainId 8453)

    prmUSD              0x7152280AfE7493d84533565Cd5c79B5d4B4EC4CB
    CollateralVault     0x127048434EfD4ac79e5E4ff41E1c6e3d5Fd0279A
    FeeSplitter         0x17CA473D42131CB27C1BA129A4404a2FF0140f81
    SettlementKeeper    0xA10042C12F0ADE1CAF928F023799F6F594C4236b
    PushOracleAdapter   0x93D1dbAC87AcCf85C3070eEdD9EeD0Ad699b7090
    MarketFactory       0xf9CFf47DE2E6bEAA5F32Cf2090E35aC3B829c3A8
    Market NG_USDT      0xa2F5e7CE731b1ed1e7bc0501eAEF451685AA3dE7   Active   cap $408,648.65
    Market NG_DIESEL    0x85cfE703ecBe14E66531C7F360DdfF9F0Bc48E25   Frozen   cap $221,351.35

Governance/keeper/fees `0x8fC19fBc01DD9b9aEEa626c2AE980F710A390da7`;
oracle reporter `0x7AB104FE43968CBf2Ca4b571d0c64C9D8eefE67C`.

Market addresses resolve at runtime via `MarketFactory.marketOf(marketId)` — nothing is hardcoded.
Do **not** use `base.llamarpc.com`: it returns 525s and falsely reports deployed contracts as
having no code.
