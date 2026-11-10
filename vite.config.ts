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
  server: { allowedHosts: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
