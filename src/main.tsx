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
// import ClaimLendKeyLink from "./pages/transactions/ClaimLendKeyLink.tsx";
import Deposit from "./pages/Deposit.tsx";
// import CreateLendSecret from "./pages/lend/CreateLendSecret.tsx";
// import WebAssets from "./pages/WebAssets.tsx";
// import ChatBotWithKey from "./pages/bot/ChatBotWithKey.tsx";
// import ChatBotWithSharedSecret from "./pages/bot/ChatBotWithSharedSecret.tsx";
// import SwapCrypto from "./pages/transactions/Swap.tsx";
// import Premium from "./pages/premium/index.tsx";
// import GetPremium from "./pages/premium/GetPremium.tsx";
// import ServerFailure from "./pages/ServerFailure.tsx";
// import Logout from "./pages/Logout.tsx";
import "./styles/index.scss";

init();
const queryclient = new QueryClient();

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  import("eruda").then((erudadev) => {
    const eruda = erudadev.default;
    eruda.init();
  });
}

// createBrowserRouter([
// { path: "", index: true, element: <Splash /> },
// { path: "/auth", element: <Auth /> },
// { path: "/auth/phone", element: <PhoneAuth /> },
// { path: "/app", element: <Home /> },
// { path: "/claimlendkey", element: <ClaimLendKeyLink /> },
// { path: "/eth-asset/:intent", element: <EthAsset /> },
// { path: "/bera-asset/:intent", element: <BeraAsset /> },
// { path: "/polygon-usdc-asset/:intent", element: <PolygonUsdcAsset /> },
// { path: "/bera-usdc-asset/:intent", element: <BeraUsdcAsset /> },
// { path: "/send-crypto-methods/:intent", element: <SendCryptoMethods /> },
// { path: "/send-crypto/:srccurrency/:intent", element: <SendCrypto /> },
// {
//   path: "/sendcollectlink/:srccurrency/:intent",
//   element: <SendCryptoCollectLink />,
// },
// { path: "/deposit/:srccurrency", element: <Deposit /> },
// { path: "/web-assets", element: <WebAssets /> },
// { path: "/chatbot/:openaikey", element: <ChatBotWithKey /> },
// {
//   path: "/chat/:conversationId/:chatAccessToken/:nonce",
//   element: <ChatBotWithSharedSecret />,
// },
// { path: "/lend/secret", element: <CreateLendSecret /> },
// { path: "/swap", element: <SwapCrypto /> },
// { path: "/premium", element: <Premium /> },
// { path: "/get-premium", element: <GetPremium /> },
// { path: "/logout", element: <Logout /> },
// { path: "/server-error", element: <ServerFailure /> },
// ]);

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
                      <Route path="" index element={<Splash />} />
                      <Route path="/auth" index element={<Auth />} />
                      <Route path="/auth/phone" element={<PhoneAuth />} />
                      <Route path="/app" element={<Home />} />
                      <Route path="/eth-asset/:intent" element={<EthAsset />} />
                      <Route
                        path="/bera-asset/:intent"
                        element={<BeraAsset />}
                      />
                      <Route
                        path="/polygon-usdc-asset/:intent"
                        element={<PolygonUsdcAsset />}
                      />
                      <Route
                        path="/bera-usdc-asset/:intent"
                        element={<BeraUsdcAsset />}
                      />
                      <Route
                        path="/send-crypto-methods/:srccurrency/:intent"
                        element={<SendCryptoMethods />}
                      />
                      <Route
                        path="/send-crypto/:srccurrency/:intent"
                        element={<SendCryptoToAddress />}
                      />
                      <Route
                        path="/sendcollectlink/:srccurrency/:intent"
                        element={<SendCryptoCollectLink />}
                      />
                      <Route
                        path="/deposit/:srccurrency"
                        element={<Deposit />}
                      />
                    </Routes>

                    <AppDrawer />
                    <AppDialog />
                    <SnackBar />
                    <TransactionStatus />
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
