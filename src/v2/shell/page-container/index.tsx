import { useCallback, useEffect } from "react";
import { useShellContext } from "../shell-context";
import { Route, Routes, useNavigate, Navigate } from "react-router";
import { usePWAShortcuts } from "@/hooks/use-pwa-shortcuts";
import Home from "@/v2/pages/home";
import History from "@/v2/pages/history";
import AuthenticatedShell from "./authenticated-shell";
import Onboarding from "@/features/onboarding";
import Swap from "@/v2/pages/swap";
import Splash from "@/v2/pages/splash";
import Profile from "@/v2/pages/profile";
import Recovery from "@/v2/pages/profile/recovery";
import Invest from "@/v2/pages/invest";
import SailVault from "@/v2/pages/invest/sail-vault";
import Agent from "@/features/agent";
import TokenInfo from "@/features/token";
import ReceiveFromAddress from "@/features/receive/address";
import ReceiveFromLink from "@/features/receive/link";
import SendToAddress from "@/features/send/address";
import SendOpenLink from "@/features/send/openlink";
import SendSpecificLink from "@/features/send/specificlink";
import BuyCrypto from "@/features/buycrypto";
import Explore from "@/v2/pages/explore";
import WalletConnect from "@/v2/pages/walletconnect";
import PredictionMarkets from "@/features/predictionmarkets";
import PredictionMarketDetails from "@/features/predictionmarkets/MarketDetails";
import Request from "@/features/request";
import Pay from "@/features/pay";
import Withdraw from "@/features/withdraw";
import SuspendedPage from "@/v2/pages/suspended";
import KYCPage from "@/v2/pages/kyc";

export default function PageContainer() {
  const { form } = useShellContext();
  const navigate = useNavigate();

  usePWAShortcuts();

  useEffect(() => {
    const subscription = form?.watch((values) => {
      if (values.tab) {
        if (values.tab == "home") {
          navigate("/app");
        } else {
          navigate(`/app/${values.tab}`);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [form]);

  const RenderScreenWithShell = useCallback(
    (props: { screen: "home" | "invest" | "profile" }) => {
      const { screen } = props;
      switch (screen) {
        case "home": {
          return (
            <AuthenticatedShell>
              <Home />
            </AuthenticatedShell>
          );
        }
        case "invest": {
          return (
            <AuthenticatedShell>
              <Invest />
            </AuthenticatedShell>
          );
        }
        case "profile": {
          return (
            <AuthenticatedShell>
              <Profile />
            </AuthenticatedShell>
          );
        }
        default: {
          return null;
        }
      }
    },
    []
  );

  return (
    <Routes>
      <Route path="/" index element={<Splash />} />
      <Route path="/auth" index element={<Onboarding />} />
      <Route path="/suspended" element={<SuspendedPage />} />
      <Route path="/kyc" element={<KYCPage />} />
      <Route
        path="/app"
        index
        element={<RenderScreenWithShell screen="home" />}
      />
      <Route
        path="/app/profile"
        element={<RenderScreenWithShell screen="profile" />}
      />
      <Route
        path="/app/invest"
        element={<RenderScreenWithShell screen="invest" />}
      />
      <Route
        path="/app/swap"
        element={
          <AuthenticatedShell>
            <Swap />
          </AuthenticatedShell>
        }
      />
      <Route
        path="/app/history"
        element={
          <AuthenticatedShell>
            <History />
          </AuthenticatedShell>
        }
      />
      <Route
        path="/app/explore"
        element={
          <AuthenticatedShell>
            <Explore />
          </AuthenticatedShell>
        }
      />
      <Route
        path="/app/walletconnect"
        element={
          <AuthenticatedShell>
            <WalletConnect />
          </AuthenticatedShell>
        }
      />
      <Route path="/app/agent" element={<Agent />} />
      <Route
        path="/app/token/:tokenId/:chain/:balance"
        element={<TokenInfo />}
      />
      <Route path="/app/receive/address" element={<ReceiveFromAddress />} />
      <Route path="/app/receive/link" element={<ReceiveFromLink />} />
      <Route path="/app/send/address" element={<SendToAddress />} />
      <Route path="/app/send/open-link" element={<SendOpenLink />} />
      <Route path="/app/send/specific-link" element={<SendSpecificLink />} />
      <Route path="/app/buy" element={<BuyCrypto />} />
      <Route path="/app/request" element={<Request />} />
      <Route path="/app/pay" element={<Pay />} />
      <Route path="/app/withdraw" element={<Withdraw />} />
      <Route path="/app/markets" element={<PredictionMarkets />} />
      <Route path="/app/markets/:id" element={<PredictionMarketDetails />} />
      <Route path="/app/profile/recovery/:method" element={<Recovery />} />
      <Route
        path="/app/invest/sail-vault"
        element={
          <AuthenticatedShell>
            <SailVault />
          </AuthenticatedShell>
        }
      />
      {/* Catch-all route - redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
