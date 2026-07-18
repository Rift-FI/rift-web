# Iriis in-app chat

End-users click the FAB with Iriis's face and start chatting. No tokens,
no keys, no dev jargon — everything token-related happens server-side.

## How it works end-to-end

**Browser** → `POST /api/iriis/chat` with the user's existing Rift
session token (Bearer). No Iriis JWT touches the frontend bundle.

**Rift backend** ([`backend/src/routes/iriisRoutes.ts`](../../backend/src/routes/iriisRoutes.ts))
→ verifies the Rift session, mints a short-lived (15 min) Iriis
USER-role JWT for THAT user's identity using the shared
`IRIIS_JWT_SECRET`, forwards to `${IRIIS_URL}/chat`, streams the reply
back untouched. Per-IP rate-limited (20 msgs/min).

**Iriis** — same deployment that Railway already runs
(`https://iriis.riftfi.com`). Sees the real Rift user id so per-user
memory + tool scoping work.

## Deploy checklist

### 1. Backend (Railway `rift-backend` service)

Add two env vars:

```
IRIIS_URL=https://iriis.riftfi.com
IRIIS_JWT_SECRET=<the exact same value as JWT_SECRET on the iriis Railway service>
```

Then merge/push the backend branch and Railway auto-redeploys. Verify:

```bash
# 1. Route mounted (unauthenticated request → 401, not 404)
curl -sS -w "\nHTTP %{http_code}\n" -X POST https://payment.riftfi.xyz/api/iriis/chat \
  -H 'content-type: application/json' -d '{"message":"hi"}'
# → HTTP 401

# 2. Authenticated round-trip (paste a real Rift session token)
TOKEN=<a valid Rift session JWT from a real logged-in user>
curl -sS -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -X POST https://payment.riftfi.xyz/api/iriis/chat \
  -d '{"message":"hi iriis"}'
# → 200 with Iriis's reply
```

### 2. Iriis service (Railway `iriis` service)

Add `payment.riftfi.xyz` (and any sandbox host) to `CORS_ALLOWED_ORIGINS`
env var if not already there. The backend server → Iriis call doesn't
care about CORS (server-to-server), but if you ever call Iriis directly
from a browser you'll need it.

### 3. App (sandbox Vercel)

Nothing to configure. The frontend automatically hits `${VITE_API_URL}/api/iriis/chat`
with the session token. As long as the sandbox app's `VITE_API_URL` /
`VITE_RIFT_API_BASE` points at the backend that has the new route, it
works.

Ship the sandbox branch, real users see the Iriis face bottom-right,
they chat.

## Run locally in 30 seconds

If you're just iterating on the UI and don't want to run the full
backend, the Vite dev proxy has your back — it mints a generic dev
token and forwards directly to Iriis:

1. Drop Iriis's `JWT_SECRET` (from Railway iriis service) into
   `app/.env.local`:

   ```
   IRIIS_JWT_SECRET=<paste>
   # optional — defaults to https://iriis.riftfi.com
   # IRIIS_URL=https://iriis.riftfi.com
   ```

2. `pnpm dev`.

3. Click the Iriis face bottom-right, chat.

If `IRIIS_JWT_SECRET` isn't set, the panel still opens but Iriis
replies with a one-liner "not wired up" message — no crash.

**Note**: local dev uses a shared "local-dev" user id in the Iriis JWT.
Prod uses the real Rift user id (via the backend endpoint). That means
memory in local dev is shared across all your local sessions, which is
fine for UI iteration.

## Files in this feature

Frontend:
- [`app/src/features/iriis/`](../src/features/iriis/) — self-contained feature dir
  - `iriis-config.ts` — resolves the endpoint (backend URL + Rift
    session token if available; else same-origin for local dev)
  - `use-iriis-chat.ts` — state + fetch
  - `iriis-avatar.tsx` — circular avatar with optional online dot
  - `iriis-chat-panel.tsx` — the drawer (bottom sheet mobile, corner
    card desktop; Framer Motion spring; Esc + click-outside close)
  - `iriis-support-button.tsx` — the FAB with Iriis's face, pulse ring,
    presence dot
- [`app/src/assets/iriis.jpeg`](../src/assets/iriis.jpeg) — the pfp
- [`app/vite-plugins/iriis-dev-proxy.ts`](../vite-plugins/iriis-dev-proxy.ts)
  — dev-only Vite middleware (generic token, for UI iteration)
- [`app/src/v2/shell/index.tsx`](../src/v2/shell/index.tsx) — swapped
  `<WhatsAppSupportButton>` → `<IriisSupportButton>` at both mount points

Backend:
- [`backend/src/routes/iriisRoutes.ts`](../../backend/src/routes/iriisRoutes.ts)
  — the proxy controller (auth, mint, forward, timeout, error mapping)
- [`backend/src/middleware/security.ts`](../../backend/src/middleware/security.ts)
  — new `iriisRateLimit` (20 msgs/min per IP)
- [`backend/src/index.ts`](../../backend/src/index.ts) —
  `app.use("/api/iriis", corsMiddlewareForAll, iriisRateLimit, iriisRoutes)`

## Failure modes and how they're handled

| What happens | User sees | Server logs |
|---|---|---|
| User not signed in | 401 Unauthorized (browser error path shows friendly retry message) | (nothing) |
| Empty message | 400 (blocked at frontend before send) | (nothing) |
| Message > 4000 chars | 400 with `error: "message too long..."` | (nothing) |
| `IRIIS_JWT_SECRET` missing | 503 "Iriis is not configured on this environment yet." | `iriis_jwt_secret_not_set` |
| Iriis slow (>30s) | 504 "Iriis is a bit slow..." | `iriis_upstream_failed timeout=true` |
| Iriis unreachable | 502 "Couldn't reach Iriis..." | `iriis_upstream_failed timeout=false` |
| Iriis 4xx/5xx | Passed through verbatim | (Iriis service logs) |
| >20 msgs/min from one IP | 429 "Slow down..." | (express-rate-limit standard) |

## Design notes

- **Rift palette**, not chat-app green. Teal (`accent-primary` = `#2E8C96`),
  soft-blue surface, Satoshi + Clash Display fonts.
- **Bottom sheet on mobile, corner card on desktop.** 400×640 corner
  card (Intercom-style) so the user still sees the app underneath.
- **Iriis avatar in three places** (FAB, header, next to each assistant
  message) for identity coherence.
- **Typing dots** so ~2–6s Claude latency doesn't feel like a hang.
- **"Don't share passwords" footer** in the composer, always visible.
- **Enter to send, Shift+Enter newline, Esc closes.** Standard chat
  keys, no surprises.
