import { useCallback, useEffect } from "react";
import { useShellContext } from "../shell-context";
import { Route, Routes, useNavigate } from "react-router";
import { usePWAShortcuts } from "@/hooks/use-pwa-shortcuts";
import Home from "@/v2/pages/home";
import History from "@/v2/pages/history";
import AuthenticatedShell from "./authenticated-shell";
import Onboarding from "@/features/onboarding";
import Swap from "@/v2/pages/swap";
import Splash from "@/v2/pages/splash";
import Profile from "@/v2/pages/profile";
import Recovery from "@/v2/pages/profile/recovery";
import AgentPage from "@/v2/pages/agent";
import TokenInfo from "@/features/token";
import ReceiveFromAddress from "@/features/receive/address";
import ReceiveFromLink from "@/features/receive/link";
import SendToAddress from "@/features/send/address";

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
    (props: { screen: "home" | "swap" | "history" | "profile" | "agent" }) => {
      const { screen } = props;
      switch (screen) {
        case "home": {
          return (
            <AuthenticatedShell>
              <Home />
            </AuthenticatedShell>
          );
        }
        case "history": {
          return (
            <AuthenticatedShell>
              <History />
            </AuthenticatedShell>
          );
        }
        case "swap": {
          return (
            <AuthenticatedShell>
              <Swap />
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
        case "agent": {
          return (
            <AuthenticatedShell>
              <AgentPage />
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
      <Route
        path="/app"
        index
        element={<RenderScreenWithShell screen="home" />}
      />
      <Route
        path="/app/swap"
        index
        element={<RenderScreenWithShell screen="swap" />}
      />
      <Route
        path="/app/history"
        element={<RenderScreenWithShell screen="history" />}
      />
      <Route
        path="/app/profile"
        element={<RenderScreenWithShell screen="profile" />}
      />
      <Route
        path="/app/agent"
        element={<RenderScreenWithShell screen="agent" />}
      />
      <Route
        path="/app/token/:tokenId/:chain/:balance"
        element={<TokenInfo />}
      />
      <Route path="/app/receive/address" element={<ReceiveFromAddress />} />
      <Route path="/app/receive/link" element={<ReceiveFromLink />} />
      <Route path="/app/send/address" element={<SendToAddress />} />
      <Route path="/app/profile/recovery/:method" element={<Recovery />} />
    </Routes>
  );
}
