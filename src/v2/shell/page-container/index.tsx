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
import Links from "@/v2/pages/links";

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
    (props: { screen: "home" | "swap" | "history" | "links" }) => {
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
        case "links": {
          return (
            <AuthenticatedShell>
              <Links />
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
        path="/app/links"
        element={<RenderScreenWithShell screen="links" />}
      />
    </Routes>
  );
}
