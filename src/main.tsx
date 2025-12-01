import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "@telegram-apps/sdk-react";
import posthog from "posthog-js";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { POSTHOG_HOST, POSTHOG_KEY } from "./constants.ts";
import AppShell from "./v2/shell/index.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { PWAInstallPrompt } from "./components/pwa-install-prompt.tsx";
import { WalletConnectSocketProvider } from "./hooks/walletconnect/use-walletconnect-socket.tsx";
import { WalletConnectUserProvider } from "./components/walletconnect/WalletConnectUserProvider.tsx";
import MaintenanceMode from "./components/MaintenanceMode.tsx";
import { NotificationProvider } from "./contexts/NotificationContext.tsx";
import rift from "./lib/rift.ts";
import "./styles/index.scss";
import "./styles/tailwind.css";

try {
  init();
} catch (error) {
  console.warn(
    "Failed to initialize Telegram SDK - probably running in browser mode"
  );
}

const token = localStorage.getItem("token");
if (token) {
  rift.auth.setBearerToken(token);
}

if (import.meta.env.MODE === "development") {
  import("eruda").then((erudadev) => {
    const eruda = erudadev.default;
    eruda.init();
  });

  // Auto-clear Pusher Beams cache on dev mode (for testing new instance)
  // Comment this out once instance is stable
  const shouldClearPusherCache = localStorage.getItem("clear_pusher_cache");
  if (shouldClearPusherCache === "true") {
    console.log("🧹 [Dev] Auto-clearing Pusher Beams cache...");

    // Clear IndexedDB
    indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (
          db.name &&
          (db.name.includes("pusher") || db.name.includes("beams"))
        ) {
          indexedDB.deleteDatabase(db.name);
          console.log("✅ Deleted database:", db.name);
        }
      });
    });

    // Clear flag
    localStorage.removeItem("clear_pusher_cache");
    console.log("✅ Pusher cache cleared! Refresh to reinitialize.");
  }
}

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  person_profiles: "identified_only",
});

const queryclient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MaintenanceMode>
      <QueryClientProvider client={queryclient}>
        <BrowserRouter>
          <NotificationProvider>
            <WalletConnectUserProvider>
              <AppShell />
            </WalletConnectUserProvider>
          </NotificationProvider>
        </BrowserRouter>

        <Toaster />
        <PWAInstallPrompt />
      </QueryClientProvider>
    </MaintenanceMode>
  </StrictMode>
);
