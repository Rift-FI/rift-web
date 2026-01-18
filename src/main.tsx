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
import { WalletConnectUserProvider } from "./components/walletconnect/WalletConnectUserProvider.tsx";
import MaintenanceMode from "./components/MaintenanceMode.tsx";
import { NotificationProvider } from "./contexts/NotificationContext.tsx";
import { SuspensionProvider } from "./contexts/SuspensionContext.tsx";
import { OnboardingDemoProvider } from "./contexts/OnboardingDemoContext.tsx";
import rift from "./lib/rift.ts";
import "./styles/index.scss";
import "./styles/tailwind.css";

try {
  init();
} catch {
  // Running in browser mode - Telegram SDK not available
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
    

    // Clear IndexedDB
    indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (
          db.name &&
          (db.name.includes("pusher") || db.name.includes("beams"))
        ) {
          indexedDB.deleteDatabase(db.name);
          
        }
      });
    });

    // Clear flag
    localStorage.removeItem("clear_pusher_cache");
    
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
          <SuspensionProvider>
            <NotificationProvider>
              <OnboardingDemoProvider>
                <WalletConnectUserProvider>
                  <AppShell />
                </WalletConnectUserProvider>
              </OnboardingDemoProvider>
            </NotificationProvider>
          </SuspensionProvider>
        </BrowserRouter>

        <Toaster />
        <PWAInstallPrompt />
      </QueryClientProvider>
    </MaintenanceMode>
  </StrictMode>
);
