import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "@telegram-apps/sdk-react";
// import eruda from "eruda";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackBarProvider } from "./hooks/snackbar";
import { AppDrawerProvider } from "./hooks/drawer.tsx";
import { TabsProvider } from "./hooks/tabs.tsx";
import { AppDialogProvider } from "./hooks/dialog.tsx";
import { AppDialog } from "./components/global/AppDialog.tsx";
import { AppDrawer } from "./components/global/AppDrawer.tsx";
import { SnackBar } from "./components/global/SnackBar.tsx";
import App from "./App.tsx";
import Authentication from "./pages/Auth.tsx";
import Logout from "./pages/Logout.tsx";
import CoinInfo from "./pages/CoinInfo.tsx";
import BtcAsset from "./pages/BtcAsset.tsx";
import EthAsset from "./pages/EthAsset.tsx";
import OmAsset from "./pages/OmAsset.tsx";
import ChatBot from "./pages/ChatBot.tsx";
import SendBtc from "./pages/transactions/SendBtc.tsx";
import SendEth from "./pages/transactions/SendEth.tsx";
import SendUsdc from "./pages/transactions/SendUsdc.tsx";
import SecuritySetup from "./pages/security/SecuritySetup.tsx";
import NodesTeeSelector from "./pages/security/NodesTeeSelector.tsx";
import Referral from "./pages/Referral.tsx";
import SendEthLink from "./pages/transactions/SendEthLink.tsx";
import ImportSecret from "./pages/secrets/ImportSecret.tsx";
import ShareSecret from "./pages/secrets/ShareSecret.tsx";
import Splash from "./pages/Splash.tsx";
import LendToUse from "./pages/lend/LendToUse.tsx";
import CreateLendAsset from "./pages/lend/CreateLendAsset.tsx";
import CreateLendSecret from "./pages/lend/CreateLendSecret.tsx";
import Rewards from "./pages/Rewards.tsx";
import ImportAirwllxKey from "./pages/secrets/ImportAwxKey.tsx";
import BuyOm from "./pages/transactions/BuyOm.tsx";
import DepositLinkGenerator from "./pages/DepositLinkGenerator.tsx";
import PremiumFeaturesPage from "./pages/Premiums.tsx";
import DepositPage from "./pages/Depositpage.tsx";
import AIHelper from "./pages/AIHelper.tsx";
import Business from "./pages/business/Index.tsx";
import StartCampaign from "./pages/business/StartCampaign.tsx";
import "./styles/index.scss";
import { SocketProvider } from "./utils/SocketProvider.tsx";

// eruda.init();
init();

const queryclient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SocketProvider>
    <QueryClientProvider client={queryclient}>
      <SnackBarProvider>
        <AppDrawerProvider>
          <TabsProvider>
            <AppDialogProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" index element={<Splash />} />
                  <Route path="/auth" element={<Authentication />} />
                  <Route path="/app" element={<App />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/coin/:coinId" element={<CoinInfo />} />
                  <Route path="/btc-asset" element={<BtcAsset />} />
                  <Route path="/send-btc/:intent" element={<SendBtc />} />
                  <Route path="/eth-asset/:intent" element={<EthAsset />} />
                  <Route path="/send-eth/:intent" element={<SendEth />} />
                  <Route
                    path="/sendcollectlink/:intent"
                    element={<SendEthLink />}
                  />
                  <Route path="/om-asset" element={<OmAsset />} />
                  <Route path="/send-usdc/:intent" element={<SendUsdc />} />
                  <Route path="/get-om" element={<BuyOm />} />
                  <Route
                    path="/chat/:conversationId/:chatAccessToken/:initialMessage/:nonce"
                    element={<ChatBot />}
                  />
                  <Route path="/security/setup" element={<SecuritySetup />} />
                  <Route
                    path="/security/selector/:type"
                    element={<NodesTeeSelector />}
                  />
                  <Route path="/importsecret" element={<ImportSecret />} />
                  <Route path="/importawx" element={<ImportAirwllxKey />} />
                  
                  <Route
                    path="/sharesecret/:key/:purpose"
                    element={<ShareSecret />}
                  />
                  <Route path="/refer/:intent" element={<Referral />} />
                  <Route path="/lend" element={<LendToUse />} />
                  <Route path="/lend/asset" element={<CreateLendAsset />} />
                  <Route path="/lend/secret" element={<CreateLendSecret />} />
                  <Route path="/rewards/:id" element={<Rewards />} />
                  <Route
                    path="/shareble-deposit-link"
                    element={<DepositLinkGenerator />}
                  />
                  <Route path="/premiums" element={<PremiumFeaturesPage />} />
                  <Route
                    path="/deposit/shared-link"
                    element={<DepositPage />}
                  />
                  <Route path="/ai-helper" element={<AIHelper />} />
                  <Route path="/business" element={<Business />} />
                  <Route path="/start-campaign" element={<StartCampaign />} />
                </Routes>

                <SnackBar />
                <AppDialog />
                <AppDrawer />
              </BrowserRouter>
            </AppDialogProvider>
          </TabsProvider>
        </AppDrawerProvider>
      </SnackBarProvider>
    </QueryClientProvider>
    </SocketProvider>
  </StrictMode>
);
