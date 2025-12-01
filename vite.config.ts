import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "rift.png",
        "hero.png",
        "icon.png",
        "splash.png",
        "s1.png",
        "s2.png",
        "s3.png",
        "service-worker.js",
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
          {
            name: "Wallet Home",
            short_name: "Home",
            description: "View your wallet balance and tokens",
            url: "/app",
            icons: [
              {
                src: "rift.png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Swap Tokens",
            short_name: "Swap",
            description: "Exchange cryptocurrencies",
            url: "/app/swap",
            icons: [
              {
                src: "rift.png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Transaction History",
            short_name: "History",
            description: "View recent transactions",
            url: "/app/history",
            icons: [
              {
                src: "rift.png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Buy Crypto",
            short_name: "Buy",
            description: "Purchase cryptocurrency",
            url: "/app/oo",
            icons: [
              {
                src: "rift.png",
                sizes: "192x192",
              },
            ],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        runtimeCaching: [
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
});
