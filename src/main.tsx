import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "@telegram-apps/sdk-react";
import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackBarProvider } from "./hooks/snackbar";
import { AppDialogProvider } from "./hooks/dialog.tsx";
import { AppDrawerProvider } from "./hooks/drawer.tsx";
import { TabsProvider } from "./hooks/tabs.tsx";
import { TxStatusProvider } from "./hooks/txstatus.tsx";
import { SocketProvider } from "./utils/SocketProvider.tsx";
import { TransactionStatus } from "./components/TransactionStatus.tsx";
import { SnackBar } from "./components/global/SnackBar.tsx";
import { AppDialog } from "./components/global/AppDialog.tsx";
import { AppDrawer } from "./components/global/AppDrawer.tsx";
import Splash from "./pages/Splash.tsx";
import Auth from "./pages/Auth.tsx";
import Home from "./pages/Home.tsx";
import PhoneAuth from "./pages/PhoneAuth.tsx";
import EthAsset from "./pages/assets/EthAsset.tsx";
import BeraAsset from "./pages/assets/BeraAsset.tsx";
import PolygonUsdcAsset from "./pages/assets/PolygonUsdcAsset.tsx";
import BeraUsdcAsset from "./pages/assets/BeraUsdcAsset.tsx";
import SendCryptoMethods from "./pages/transactions/SendCryptoMethods.tsx";
import SendCryptoToAddress from "./pages/transactions/SendCryptoToAddress.tsx";
import SendCryptoCollectLink from "./pages/transactions/SendCryptoCollectLink.tsx";
import ClaimLendKeyLink from "./pages/transactions/ClaimLendKeyLink.tsx";
import SwapCrypto from "./pages/transactions/SwapCrypto.tsx";
import Deposit from "./pages/Deposit.tsx";
import CreateLendSecret from "./pages/lend/CreateLendSecret.tsx";
import ChatBotWithKey from "./pages/bot/ChatBotWithKey.tsx";
import ChatBotWithSharedSecret from "./pages/bot/ChatBotWithSharedSecret.tsx";
import SphereExchangeRate from "./pages/SphereExchangeRate.tsx";
import Profile from "./pages/Profile.tsx";
import Notifications from "./pages/Notifications.tsx";
import ServerFailure from "./pages/ServerFailure.tsx";
import "./styles/index.scss";
import { AnalyticsListener } from "./hocs/posthog-provider.tsx";
import { enableTelegramMock } from "./development/mock.ts";
import { DevelopmentTools } from "./development/development-tools.tsx";
import "./styles/tailwind.css"
import { Toaster } from "./components/ui/sonner.tsx";
import AppShell from "./v2/shell/index.tsx";

if (import.meta.env.MODE == "development") {
  enableTelegramMock()
}

init();
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
      <SocketProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </SocketProvider>
      <Toaster />
      <AnalyticsListener />
      <DevelopmentTools />
    </QueryClientProvider>
  </StrictMode>
);
