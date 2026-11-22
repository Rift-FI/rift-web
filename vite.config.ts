import fs from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { iriisDevProxy } from "./vite-plugins/iriis-dev-proxy";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env / .env.local so the Iriis dev proxy can pick up
  // IRIIS_JWT_SECRET without the user having to `export` it manually.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  // Passkey dev mode: when serving as the real origin (see `server` below), the
  // WebAuthn RP-ID must be the eTLD+1 of that host, or the browser rejects the
  // request before any network call. Deriving it from the one toggle means the
  // host and the RP-ID can never drift apart — a mismatch is silent and the
  // only symptom is "passkey not found", which costs an hour to diagnose.
  if (process.env.DEV_PASSKEY_DOMAIN) {
    const parts = process.env.DEV_PASSKEY_DOMAIN.split(".");
    process.env.VITE_PASSKEY_RP_ID = parts.slice(-2).join(".");
    // The API base must follow the host too. In this mode the app is served
    // from https://<domain> on 443, so a base left pointing at
    // http://localhost:5173 (what .env.local carries for ordinary dev) is a
    // dead port: every API call fails ERR_CONNECTION_REFUSED and the invite
    // gate correctly fails closed, which looks like a broken page rather than
    // a misconfigured one. Same origin => the /v1 proxy below handles it and
    // CORS never applies.
    process.env.VITE_RIFT_API_BASE = `https://${process.env.DEV_PASSKEY_DOMAIN}`;
  }

  return {
  plugins: [
    react(),
    tailwindcss(),
    iriisDevProxy(),
    VitePWA({
      injectRegister: "auto", // Auto-register service worker
      registerType: "autoUpdate", // Auto-update when new version is available
      includeAssets: [
        "rift.png",
        "hero.png",
        "icon.png",
        "splash.png",
        "s1.png",
        "s2.png",
        "s3.png",
        "service-worker.js",
        "version.json",
      ],
      manifest: {
        name: "Rift Payment Solutions",
        short_name: "Rift",
        description:
          "Accept USDC and M-Pesa payments. Convert crypto to KES. Payment solutions for freelancers, businesses and individuals.",
        theme_color: "#2E8C96",
        background_color: "#E9F1F4",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "rift.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "rift.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        shortcuts: [
          { name: "Home", short_name: "Home", description: "Balance and recent payments", url: "/app", icons: [{ src: "rift.png", sizes: "192x192" }] },
          { name: "Send money", short_name: "Send", description: "Pay to mobile money, bank or wallet", url: "/app/send", icons: [{ src: "rift.png", sizes: "192x192" }] },
          { name: "Payments", short_name: "Payments", description: "Payment history and receipts", url: "/app/payments", icons: [{ src: "rift.png", sizes: "192x192" }] },
          { name: "Add funds", short_name: "Add funds", description: "Buy, payment links, wallet address", url: "/app/add-funds", icons: [{ src: "rift.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,json}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        // Skip waiting - immediately activate new service worker
        skipWaiting: true,
        clientsClaim: true,
        // Clean old caches
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Don't cache version.json - always fetch fresh
            urlPattern: /version\.json/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/api\./,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: true,
    // ── Passkey dev mode ────────────────────────────────────────────────────
    // A WebAuthn credential is bound to its RP-ID, so a passkey enrolled on
    // wallet.riftfi.com is NOT offered to a page on localhost — the browser
    // refuses before any network call ("passkey not found"). There is no
    // server-side fix: RP binding is enforced by the authenticator.
    //
    // The way around it is to serve this build *as* the real origin. With a
    // hosts entry pointing wallet.riftfi.com at 127.0.0.1 and a trusted local
    // certificate, the page origin genuinely is https://wallet.riftfi.com, so
    // the existing passkey matches and nothing about the account changes.
    //
    // Enable by setting DEV_PASSKEY_DOMAIN=wallet.riftfi.com (see certs/README).
    // Unset = ordinary http://localhost:5173, where passkeys will not work.
    ...(process.env.DEV_PASSKEY_DOMAIN
      ? {
          // Bind locally, NOT to the domain name — Vite's `host` is the
          // interface to listen on, and resolving wallet.riftfi.com gives
          // Rift's real server, which this machine cannot bind (EADDRNOTAVAIL).
          // The hostname is mapped browser-side via Chrome's
          // --host-resolver-rules, so no hosts file and no admin are needed.
          host: "127.0.0.1",
          // MUST be 443: the WebAuthn origin includes the port, so
          // https://wallet.riftfi.com:5173 is a different origin and the
          // credential would not match.
          port: 443,
          strictPort: true,
          https: {
            key: fs.readFileSync(path.resolve(__dirname, "certs/dev-key.pem")),
            cert: fs.readFileSync(path.resolve(__dirname, "certs/dev-cert.pem")),
          },
        }
      : {}),
    // LOCAL DEV ONLY (`server` is ignored by `vite build`). The sandbox backend's
    // CORS allow-list does not include http://localhost:5173 — see
    // .env.sandbox.example: "the widget+backend allow-lists also need to include
    // your dev origin" — so every /v1 call from a localhost page fails preflight
    // and the app bounces to /auth before you can sign in. Proxying /v1 through
    // the dev server makes those calls SAME-ORIGIN, so CORS never applies and no
    // deployed service has to change. Pair with VITE_RIFT_API_BASE in .env.local.
    proxy: {
      "/v1": {
        // PRODUCTION backend. Local dev talks to the real API so the signing
        // path matches what ships; sandbox was 12.5 days stale and still had
        // the removed enclave path, which surfaced as "enclave sign returned
        // null". payment.riftfi.xyz is what the live wallet itself calls.
        target: "https://payment.riftfi.xyz",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
