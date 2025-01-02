import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "@telegram-apps/sdk-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import eruda from "eruda";
import { SnackBarProvider } from "./hooks/snackbar";
import { AppDrawerProvider } from "./hooks/drawer.tsx";
import { TabsProvider } from "./hooks/tabs.tsx";
import App from "./App.tsx";
import Authentication from "./pages/Auth.tsx";
import Logout from "./pages/Logout.tsx";
import CoinInfo from "./pages/CoinInfo.tsx";
import BtcAsset from "./pages/BtcAsset.tsx";
import EthAsset from "./pages/EthAsset.tsx";
import UsdtAsset from "./pages/UsdtAset.tsx";
import ChatBot from "./pages/ChatBot.tsx";
import "./styles/constants.css";
import "./styles/index.css";

// initialize eruda for remote debugging
// comment out in production
eruda.init();
// initialize @telegram-mini-apps
init();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SnackBarProvider>
      <AppDrawerProvider>
        <TabsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="" element={<App />} />
              <Route path="/signup" element={<Authentication />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/coin/:coinId" element={<CoinInfo />} />
              <Route path="/btc-asset" element={<BtcAsset />} />
              <Route path="/eth-asset" element={<EthAsset />} />
              <Route path="/usdt-asset" element={<UsdtAsset />} />
              <Route
                path="/chat/:conversationId/:chatAccessToken/:initialMessage"
                element={<ChatBot />}
              />
            </Routes>
          </BrowserRouter>
        </TabsProvider>
      </AppDrawerProvider>
    </SnackBarProvider>
  </StrictMode>
);
