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
import SendBtc from "./pages/transactions/SendBtc.tsx";
import SendEth from "./pages/transactions/SendEth.tsx";
import SendUsdc from "./pages/transactions/SendUsdc.tsx";
import SecuritySetup from "./pages/security/SecuritySetup.tsx";
import NodesTeeSelector from "./pages/security/NodesTeeSelector.tsx";
import Referral from "./pages/Referral.tsx";
import SendEthLink from "./pages/transactions/SendEthLink.tsx";
import "./styles/constants.css";
import "./styles/index.css";
import ImportSecret from "./pages/secrets/ImportSecret.tsx";
import ShareSecret from "./pages/secrets/ShareSecret.tsx";

// initialize eruda for remote debugging
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
              <Route path="/send-btc" element={<SendBtc />} />
              <Route path="/eth-asset" element={<EthAsset />} />
              <Route path="/send-eth" element={<SendEth />} />
              <Route path="/usdt-asset" element={<UsdtAsset />} />
              <Route path="/send-usdc" element={<SendUsdc />} />
              <Route
                path="/chat/:conversationId/:chatAccessToken/:initialMessage/:nonce"
                element={<ChatBot />}
              />
              <Route path="/security/setup" element={<SecuritySetup />} />
              <Route
                path="/security/selector/:type"
                element={<NodesTeeSelector />}
              />
              <Route path="/sendcollectlink" element={<SendEthLink />} />
              <Route path="/importsecret" element={<ImportSecret />} />
              <Route
                path="/sharesecret/:key/:purpose"
                element={<ShareSecret />}
              />
              <Route path="/refer" element={<Referral />} />
            </Routes>
          </BrowserRouter>
        </TabsProvider>
      </AppDrawerProvider>
    </SnackBarProvider>
  </StrictMode>
);
