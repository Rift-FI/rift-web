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
}

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  person_profiles: "identified_only",
});

const queryclient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryclient}>
      <BrowserRouter>
        <WalletConnectUserProvider>
          <AppShell />
        </WalletConnectUserProvider>
      </BrowserRouter>

      <Toaster />
      <PWAInstallPrompt />
    </QueryClientProvider>
  </StrictMode>
);
