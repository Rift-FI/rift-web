import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "@telegram-apps/sdk-react";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsListener } from "./hocs/posthog-provider.tsx";
import { enableTelegramMock } from "./development/mock.ts";
import { DevelopmentTools } from "./development/development-tools.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { PWAInstallPrompt } from "./components/pwa-install-prompt.tsx";
import AppShell from "./v2/shell/index.tsx";
import BlurProvider from "./hocs/blur-provider.tsx";
import "./styles/index.scss";
import "./styles/tailwind.css";

// Platform detection - check if we're running in a real browser vs Telegram
const isRealBrowser = () => {
  if (typeof window === "undefined") return false;

  // Check if we're in development mode
  if (import.meta.env.MODE === "development") {
    // In development, always enable mock unless we're testing browser mode
    const testBrowserMode = import.meta.env.VITE_TEST_BROWSER_MODE === "true";
    return testBrowserMode;
  }

  // In production, check if Telegram WebApp is available
  return !window.Telegram?.WebApp;
};

// Only enable Telegram mock in development mode when not testing browser mode
if (import.meta.env.MODE === "development" && !isRealBrowser()) {
  enableTelegramMock();
}

// Initialize Telegram SDK - this will work in both environments
try {
  init();
} catch (error) {
  console.warn(
    "Failed to initialize Telegram SDK - probably running in browser mode:",
    error
  );
}

const queryclient = new QueryClient();

if (import.meta.env.VITE_APP_ENV === "preview") {
  import("eruda").then((erudadev) => {
    const eruda = erudadev.default;
    eruda.init();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryclient}>
      <BrowserRouter>
        <BlurProvider>
          <AppShell />
        </BlurProvider>
      </BrowserRouter>

      <Toaster />
      <PWAInstallPrompt />
      <AnalyticsListener />
      <DevelopmentTools />
    </QueryClientProvider>
  </StrictMode>
);
