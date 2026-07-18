# Iriis in-app chat (sandbox preview)

Iriis is Rift's AI assistant. This doc covers how the in-app "Chat with
Iriis" button on `feat/sandbox-v3` talks to the deployed Iriis service
and what we need to change before this ships to prod.

## What's in this branch

- `src/features/iriis/` — the whole feature. Self-contained.
  - `iriis-config.ts` — reads `VITE_IRIIS_URL` + `VITE_IRIIS_TOKEN`
  - `use-iriis-chat.ts` — the hook that owns message state + calls
    `POST /chat`
  - `iriis-avatar.tsx` — reusable circular avatar
  - `iriis-chat-panel.tsx` — the drawer (bottom sheet on mobile,
    corner card on desktop)
  - `iriis-support-button.tsx` — the FAB with Iriis's face + panel
- `src/assets/iriis.jpeg` — the avatar image
- `src/v2/shell/index.tsx` — swapped `WhatsAppSupportButton` →
  `IriisSupportButton` at both mobile + desktop mount points

The WhatsApp button component itself (`components/ui/whatsapp-support-button.tsx`)
is untouched. It's just no longer referenced from the shell.

## Sandbox env setup

On the sandbox Vercel deployment set these two vars:

```
VITE_IRIIS_URL=https://iriis.riftfi.com
VITE_IRIIS_TOKEN=<a USER-role Iriis JWT — see below>
```

If `VITE_IRIIS_TOKEN` is empty, the panel still opens but Iriis replies
with a "not wired up in this build" message. So on prod (where the var
is unset) the feature degrades to a harmless placeholder instead of
crashing.

### Minting a USER-role Iriis JWT

From `/c/Users/ADMIN/rift/iriis`, with the sandbox `JWT_SECRET` in the
environment:

```bash
JWT_SECRET="<sandbox JWT secret>" \
  ./.venv/Scripts/python.exe -c "
from iriis.core.auth import AuthContext, Role, create_token
print(create_token(AuthContext(
  user_id='sandbox-preview', rift_user_id='sandbox-preview',
  email='sandbox@rift.local',
  role=Role.USER, channel='inapp-sandbox', session_id='inapp-preview',
)))"
```

Paste the token into Vercel → sandbox project → Environment Variables
→ `VITE_IRIIS_TOKEN`. Redeploy.

The token's `exp` defaults to `JWT_ACCESS_TOKEN_EXPIRES_MINUTES=60`
minutes. For sandbox previews bump that env on the Iriis Railway
service (e.g. `JWT_ACCESS_TOKEN_EXPIRES_MINUTES=10080` for a week) so
the sandbox token doesn't die between test sessions.

## What has to change before merging to main

Currently the sandbox app carries a real Iriis JWT in the frontend
bundle. Fine for sandbox — every sandbox tester is a Rift employee —
NOT fine for prod, because:

1. The token is one JWT shared across every user, so Iriis can't
   attribute a chat to the actual Rift user (breaks per-user memory,
   breaks the `get_my_*` tool set that reads the caller's own data).
2. Anyone who cracks open DevTools can read it and hit Iriis directly.

The prod cutover is a small backend addition + one frontend swap:

1. **Add `POST /api/iriis/token` to Rift backend.** It requires a
   normal Rift session, then server-side mints an Iriis JWT for that
   user using the shared `JWT_SECRET`. Returns
   `{ token, expires_at }`. Iriis exposes the auth module already —
   see `iriis/src/iriis/core/auth.py` (`create_token(AuthContext(...))`).
2. **Swap the frontend hook.** `use-iriis-chat.ts` fetches the token
   from that endpoint at panel-open time and caches it until expiry,
   instead of reading `VITE_IRIIS_TOKEN`. `iriis-config.ts` drops
   `IRIIS_DEV_TOKEN`.

That's the whole delta. Everything else — the panel, the button, the
avatar, the greeting, the anti-jargon rules Iriis is prompted with —
stays the same.

## Design decisions

- **Rift palette, not chat-app palette.** Teal accent (`accent-primary`
  `#2E8C96`), soft blue surface, Satoshi + Clash Display fonts, radii
  from the Rift design tokens. Deliberately not a green WhatsApp look
  — Iriis is a Rift product.
- **Bottom sheet on mobile, corner card on desktop.** Bottom sheet
  respects thumb reach on mobile. Desktop uses a 400×640 corner card
  (Intercom-style) rather than a center modal, so the user can still
  see the app underneath while chatting.
- **Iriis avatar in three places for identity coherence.** The FAB
  (56×56, subtle pulse ring), the header (40×40, online dot), and next
  to every Iriis message (28×28). Same image everywhere.
- **Typing indicator with animated dots** so latency (~2–6s per Claude
  turn) doesn't feel like the app hung.
- **Never share passwords warning** in the composer footer — one line,
  small, always visible. Matches Iriis's own anti-jargon and secrets
  rules on the server side.
- **Escape closes, Enter sends, Shift+Enter newlines.** Standard chat
  keybindings; no surprises.

## Testing checklist

Locally (before pushing to sandbox):

- [ ] `pnpm dev` → app loads without console errors
- [ ] FAB appears bottom-right (desktop) / above bottom tabs (mobile)
- [ ] Click FAB → panel opens with slide-up animation
- [ ] Iriis greeting message renders with the avatar
- [ ] Type a message + Enter → user bubble appears, typing indicator
      shows, Iriis replies within ~10s
- [ ] Esc closes the panel, backdrop click closes the panel
- [ ] Shift+Enter inserts a newline, textarea grows
- [ ] With `VITE_IRIIS_TOKEN` unset → panel opens, Iriis replies with
      the "not wired up" placeholder (does not crash)

On sandbox Vercel deployment:

- [ ] Same as above, but on the deployed URL
- [ ] Network tab: `POST https://iriis.riftfi.com/chat` returns 200
- [ ] No CORS errors (Iriis has `app.riftfi.com` in its allow-list;
      confirm the sandbox host is there too — if not, add it to
      `CORS_ALLOWED_ORIGINS` on Railway)
