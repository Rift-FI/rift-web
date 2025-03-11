import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "@telegram-apps/sdk-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import App from "./App.tsx";
import Splash from "./pages/Splash.tsx";
import Authentication from "./pages/Auth.tsx";
import Logout from "./pages/Logout.tsx";
import BtcAsset from "./pages/assets/BtcAsset.tsx";
import EthAsset from "./pages/assets/EthAsset.tsx";
import OmAsset from "./pages/assets/OmAsset.tsx";
import UsdcAsset from "./pages/assets/UsdcAsset.tsx";
import SendCrypto from "./pages/transactions/SendCrypto.tsx";
import SendCollectLink from "./pages/transactions/SendCollectLink.tsx";
import SwapCrypto from "./pages/transactions/Swap.tsx";
import StakeTokens from "./pages/transactions/StakeTokens.tsx";
import Polymarket from "./pages/transactions/Polymarket.tsx";
import BuyOm from "./pages/transactions/BuyOm.tsx";
import CoinInfo from "./pages/CoinInfo.tsx";
import ImportAirwllxKey from "./pages/secrets/ImportAwxKey.tsx";
import AboutSecurity from "./pages/security/AboutSecurity.tsx";
import SecuritySetup from "./pages/security/SecuritySetup.tsx";
import RecoverySetup from "./pages/security/Recovery.tsx";
import AddPin from "./pages/security/AddPin.tsx";
import AddEmail from "./pages/security/AddEmail.tsx";
import AddPhone from "./pages/security/AddPhone.tsx";
import NodesTeeSelector from "./pages/security/NodesTeeSelector.tsx";
import LendToUse from "./pages/lend/LendToUse.tsx";
import CreateLendAsset from "./pages/lend/CreateLendAsset.tsx";
import CreateLendSecret from "./pages/lend/CreateLendSecret.tsx";
import Premium from "./pages/Premium.tsx";
import Business from "./pages/business/Index.tsx";
import StartCampaign from "./pages/business/StartCampaign.tsx";
import ChatWithBot from "./pages/bot/ChatWithBot.tsx";
import WebAssets from "./pages/WebAssets.tsx";
import Deposit from "./pages/deposit/Deposit.tsx";
import DepositToAddress from "./pages/deposit/DepositToAddress.tsx";
import DepositFromAwx from "./pages/deposit/DepositFromAwx.tsx";
import SpherePremium from "./pages/premium/SpherePremium.tsx";
import "./styles/index.scss";

init();
const queryclient = new QueryClient();

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  import("eruda").then((erudadev) => {
    const eruda = erudadev.default;
    eruda.init();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryclient}>
      <SocketProvider>
        <SnackBarProvider>
          <AppDrawerProvider>
            <TabsProvider>
              <TxStatusProvider>
                <AppDialogProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" index element={<Splash />} />
                      <Route path="/auth" element={<Authentication />} />
                      <Route path="/app" element={<App />} />
                      <Route path="/logout" element={<Logout />} />
                      <Route path="/coin/:coinId" element={<CoinInfo />} />
                      <Route path="/btc-asset" element={<BtcAsset />} />
                      <Route path="/web2" element={<WebAssets />} />
                      <Route
                        path="/send-crypto/:srccurrency/:intent"
                        element={<SendCrypto />}
                      />
                      <Route path="/eth-asset/:intent" element={<EthAsset />} />
                      <Route
                        path="/sendcollectlink/:srccurrency/:intent"
                        element={<SendCollectLink />}
                      />
                      <Route path="/swap" element={<SwapCrypto />} />
                      <Route
                        path="/stake/:srctoken"
                        element={<StakeTokens />}
                      />
                      <Route path="/polymarket" element={<Polymarket />} />
                      <Route path="/om-asset" element={<OmAsset />} />
                      <Route path="/get-om" element={<BuyOm />} />
                      <Route path="/usdc-asset" element={<UsdcAsset />} />
                      <Route
                        path="/chatwithbot/:poekey"
                        element={<ChatWithBot />}
                      />
                      <Route
                        path="/security/info"
                        element={<AboutSecurity />}
                      />
                      <Route path="/security/pin" element={<AddPin />} />
                      <Route path="/security/email" element={<AddEmail />} />
                      <Route path="/security/phone" element={<AddPhone />} />
                      <Route
                        path="/security/setup"
                        element={<SecuritySetup />}
                      />
                      <Route
                        path="/security/recover"
                        element={<RecoverySetup />}
                      />
                      <Route
                        path="/security/selector/:type"
                        element={<NodesTeeSelector />}
                      />
                      <Route path="/importawx" element={<ImportAirwllxKey />} />
                      <Route path="/lend" element={<LendToUse />} />
                      <Route path="/lend/asset" element={<CreateLendAsset />} />
                      <Route
                        path="/lend/secret/:type"
                        element={<CreateLendSecret />}
                      />
                      <Route path="/deposit" element={<Deposit />} />
                      <Route
                        path="/deposit-address"
                        element={<DepositToAddress />}
                      />
                      <Route
                        path="/deposit-awx/:target"
                        element={<DepositFromAwx />}
                      />
                      <Route path="/premiums" element={<Premium />} />
                      <Route
                        path="/premiums/sphere"
                        element={<SpherePremium />}
                      />
                      <Route path="/business" element={<Business />} />
                      <Route
                        path="/start-campaign"
                        element={<StartCampaign />}
                      />
                    </Routes>

                    <TransactionStatus />
                    <SnackBar />
                    <AppDialog />
                    <AppDrawer />
                  </BrowserRouter>
                </AppDialogProvider>
              </TxStatusProvider>
            </TabsProvider>
          </AppDrawerProvider>
        </SnackBarProvider>
      </SocketProvider>
    </QueryClientProvider>
  </StrictMode>
);
