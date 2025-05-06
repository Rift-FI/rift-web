import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "@telegram-apps/sdk-react";
import { createBrowserRouter, RouterProvider } from "react-router";
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
import Home from "./pages/Home.tsx";
import Splash from "./pages/Splash.tsx";
import Signup from "./pages/Signup.tsx";
import PhoneAuth from "./pages/PhoneAuth.tsx";
import EthAsset from "./pages/assets/EthAsset.tsx";
import WberaAsset from "./pages/assets/WberaAsset.tsx";
import PolygonUsdcAsset from "./pages/assets/PolygonUsdcAsset.tsx";
import BeraUsdcAsset from "./pages/assets/BeraUsdcAsset.tsx";
import SendCrypto from "./pages/transactions/SendCrypto.tsx";
import SendCollectLink from "./pages/transactions/SendCollectLink.tsx";
import ClaimLendKeyLink from "./pages/transactions/ClaimLendKeyLink.tsx";
import Deposit from "./pages/Deposit.tsx";
import CreateLendSecret from "./pages/lend/CreateLendSecret.tsx";
import WebAssets from "./pages/WebAssets.tsx";
import ChatBotWithKey from "./pages/bot/ChatBotWithKey.tsx";
import ChatBotWithSharedSecret from "./pages/bot/ChatBotWithSharedSecret.tsx";
import Premium from "./pages/premium/index.tsx";
import GetPremium from "./pages/premium/GetPremium.tsx";
import ServerFailure from "./pages/ServerFailure.tsx";
import Logout from "./pages/Logout.tsx";
// import ConvertFiat from "./pages/transactions/ConvertFiat.tsx";
// import SwapCrypto from "./pages/transactions/Swap.tsx";
// import StakeTokens from "./pages/transactions/StakeTokens.tsx";
// import StakeVault from "./pages/transactions/StakeVault.tsx";
// import BuyOm from "./pages/transactions/BuyOm.tsx";
// import CoinInfo from "./pages/CoinInfo.tsx";
// import AboutSecurity from "./pages/security/AboutSecurity.tsx";
// import SecuritySetup from "./pages/security/SecuritySetup.tsx";
// import AddPin from "./pages/security/AddPin.tsx";
// import AddEmail from "./pages/security/AddEmail.tsx";
// import AddPhone from "./pages/security/AddPhone.tsx";
// import WBERA from "./pages/assets/WBERA.tsx";
// import NodesTeeSelector from "./pages/security/NodesTeeSelector.tsx";
// import Business from "./pages/business/Index.tsx";
// import StartCampaign from "./pages/business/StartCampaign.tsx";
// import PstTokenInfo from "./pages/quvault/PstTokenInfo.tsx";
// import LaunchPadInfo from "./pages/quvault/LaunchpadInfo.tsx";
// import PortfolioDetails from "./pages/PortfolioDetails.tsx";
// import VaultDetails from "./pages/VaultDetails.tsx";
// import MarketDetails from "./pages/polymarket/Market.tsx";

init();
const queryclient = new QueryClient();

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  import("eruda").then((erudadev) => {
    const eruda = erudadev.default;
    eruda.init();
  });
}

let routes = createBrowserRouter([
  { path: "/", index: true, element: <Splash /> },
  { path: "/auth", element: <Signup /> },
  { path: "/auth/phone", element: <PhoneAuth /> },
  { path: "/app", element: <Home /> },
  { path: "/claimlendkey", element: <ClaimLendKeyLink /> },
  { path: "/eth-asset/:intent", element: <EthAsset /> },
  { path: "/wbera-asset/:intent", element: <WberaAsset /> },
  { path: "/polygon-usdc-asset/:intent", element: <PolygonUsdcAsset /> },
  { path: "/bera-usdc-asset/:intent", element: <BeraUsdcAsset /> },
  { path: "/send-crypto/:srccurrency/:intent", element: <SendCrypto /> },
  {
    path: "/sendcollectlink/:srccurrency/:intent",
    element: <SendCollectLink />,
  },
  { path: "/web-assets", element: <WebAssets /> },
  { path: "/chatbot/:openaikey", element: <ChatBotWithKey /> },
  {
    path: "/chat/:conversationId/:chatAccessToken/:nonce",
    element: <ChatBotWithSharedSecret />,
  },
  { path: "/lend/secret", element: <CreateLendSecret /> },
  { path: "/premium", element: <Premium /> },
  { path: "/get-premium", element: <GetPremium /> },
  { path: "/deposit", element: <Deposit /> },
  { path: "/logout", element: <Logout /> },
  { path: "/server-error", element: <ServerFailure /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryclient}>
      <SocketProvider>
        <SnackBarProvider>
          <AppDrawerProvider>
            <TabsProvider>
              <TxStatusProvider>
                <AppDialogProvider>
                  <RouterProvider router={routes} />

                  <TransactionStatus />
                  <SnackBar />
                  <AppDialog />
                  <AppDrawer />
                </AppDialogProvider>
              </TxStatusProvider>
            </TabsProvider>
          </AppDrawerProvider>
        </SnackBarProvider>
      </SocketProvider>
    </QueryClientProvider>
  </StrictMode>
);
