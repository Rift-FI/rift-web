import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "@telegram-apps/sdk-react";
import posthog from "posthog-js";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { POSTHOG_HOST, POSTHOG_KEY } from "./constants.ts";
import { enableTelegramMock } from "./development/mock.ts";
import { DevelopmentTools } from "./development/development-tools.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { PWAInstallPrompt } from "./components/pwa-install-prompt.tsx";
import AppShell from "./v2/shell/index.tsx";
import BlurProvider from "./hocs/blur-provider.tsx";
import "./styles/index.scss";
import "./styles/tailwind.css";
import sphere from "./lib/sphere.ts";

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
    "Failed to initialize Telegram SDK - probably running in browser mode"
  );
}

const token = localStorage.getItem("token");
if (token) {
  sphere.auth.setBearerToken(token);
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
        <BlurProvider>
          <AppShell />
        </BlurProvider>
      </BrowserRouter>

      <Toaster />
      <PWAInstallPrompt />
      <DevelopmentTools />
    </QueryClientProvider>
  </StrictMode>
);
