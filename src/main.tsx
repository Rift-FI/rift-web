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
import Signup from "./pages/Signup.tsx";
import PhoneAuth from "./pages/PhoneAuth.tsx";
import Logout from "./pages/Logout.tsx";
import BtcAsset from "./pages/assets/BtcAsset.tsx";
import EthAsset from "./pages/assets/EthAsset.tsx";
import OmAsset from "./pages/assets/WBERA.tsx";
import UsdcAsset from "./pages/assets/UsdcAsset.tsx";
import SendCrypto from "./pages/transactions/SendCrypto.tsx";
import SendCollectLink from "./pages/transactions/SendCollectLink.tsx";
import ConvertFiat from "./pages/transactions/ConvertFiat.tsx";
import SwapCrypto from "./pages/transactions/Swap.tsx";
import StakeTokens from "./pages/transactions/StakeTokens.tsx";
import StakeVault from "./pages/transactions/StakeVault.tsx";
import BuyOm from "./pages/transactions/BuyOm.tsx";
import ClaimLendKeyLink from "./pages/transactions/ClaimLendKeyLink.tsx";
import CoinInfo from "./pages/CoinInfo.tsx";
import AboutSecurity from "./pages/security/AboutSecurity.tsx";
import SecuritySetup from "./pages/security/SecuritySetup.tsx";
import AddPin from "./pages/security/AddPin.tsx";
import AddEmail from "./pages/security/AddEmail.tsx";
import AddPhone from "./pages/security/AddPhone.tsx";
import WUsdcAsset from "./pages/assets/WUsdcAsset.tsx";
import WBERA from "./pages/assets/WBERA.tsx";
import NodesTeeSelector from "./pages/security/NodesTeeSelector.tsx";
import CreateLendSecret from "./pages/lend/CreateLendSecret.tsx";
import Premium from "./pages/Premium.tsx";
import Business from "./pages/business/Index.tsx";
import StartCampaign from "./pages/business/StartCampaign.tsx";
import ChatWithBot from "./pages/bot/ChatWithBot.tsx";
import ChatBotWithKey from "./pages/bot/ChatBotWithKey.tsx";
import WebAssets from "./pages/WebAssets.tsx";
import DepositToAddress from "./pages/deposit/DepositToAddress.tsx";
import SpherePremium from "./pages/premium/SpherePremium.tsx";
import PstTokenInfo from "./pages/quvault/PstTokenInfo.tsx";
import LaunchPadInfo from "./pages/quvault/LaunchpadInfo.tsx";
import PortfolioDetails from "./pages/PortfolioDetails.tsx";
import VaultDetails from "./pages/VaultDetails.tsx";
import ServerFailure from "./pages/ServerFailure.tsx";
import MarketDetails from "./pages/polymarket/Market.tsx";
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
                      <Route path="/auth" element={<Signup />} />
                      <Route path="/auth/phone" element={<PhoneAuth />} />
                      <Route path="/app" element={<App />} />
                      <Route path="/logout" element={<Logout />} />
                      <Route path="/coininfo" element={<CoinInfo />} />
                      <Route path="/btc-asset" element={<BtcAsset />} />
                      <Route path="/web2" element={<WebAssets />} />
                      <Route
                        path="/send-crypto/:srccurrency/:intent"
                        element={<SendCrypto />}
                      />
                      <Route path="/eth-asset/:intent" element={<EthAsset />} />
                      <Route path="/wbera-asset/:intent" element={<WBERA />} />
                      <Route
                        path="/sendcollectlink/:srccurrency/:intent"
                        element={<SendCollectLink />}
                      />
                      <Route path="/convertfiat" element={<ConvertFiat />} />
                      <Route path="/swap" element={<SwapCrypto />} />
                      <Route
                        path="/stake/:srctoken"
                        element={<StakeTokens />}
                      />
                      <Route
                        path="/stakevault/:srcvault"
                        element={<StakeVault />}
                      />
                      <Route path="/om-asset" element={<OmAsset />} />
                      <Route path="/get-om" element={<BuyOm />} />
                      <Route
                        path="/usdc-asset/:intent"
                        element={<UsdcAsset />}
                      />
                      <Route
                        path="/wusdc-asset/:intent"
                        element={<WUsdcAsset />}
                      />
                      <Route
                        path="/claimlendkey"
                        element={<ClaimLendKeyLink />}
                      />
                      <Route
                        path="/chat/:conversationId/:chatAccessToken/:nonce"
                        element={<ChatWithBot />}
                      />
                      <Route
                        path="/chatbot/:openaikey"
                        element={<ChatBotWithKey />}
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
                        path="/security/selector/:type"
                        element={<NodesTeeSelector />}
                      />
                      <Route
                        path="/lend/secret/:type/:secretvalue"
                        element={<CreateLendSecret />}
                      />
                      <Route path="/deposit" element={<DepositToAddress />} />
                      <Route path="/premiums" element={<Premium />} />
                      <Route
                        path="/premiums/sphere"
                        element={<SpherePremium />}
                      />
                      <Route path="/business" element={<Business />} />
                      <Route
                        path="/pst/:token/:price"
                        element={<PstTokenInfo />}
                      />
                      <Route
                        path="/launchpad/:id"
                        element={<LaunchPadInfo />}
                      />
                      <Route
                        path="/start-campaign"
                        element={<StartCampaign />}
                      />
                      <Route
                        path="/portfolio-details"
                        element={<PortfolioDetails />}
                      />
                      <Route
                        path="/vault-details/:vaultId"
                        element={<VaultDetails />}
                      />
                      <Route path="/market/:id" element={<MarketDetails />} />
                      <Route path="/server-error" element={<ServerFailure />} />
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
