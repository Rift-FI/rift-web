import { useCallback, useEffect } from "react";
import { useShellContext } from "../shell-context";
import { Route, Routes, useNavigate } from "react-router";
import Home from "@/v2/pages/home";
import OnRamp from "@/v2/pages/onramp";
import History from "@/v2/pages/history";
import Explore from "@/v2/pages/explore";
import AuthenticatedShell from "./authenticated-shell";
import Onboarding from "@/features/onboarding";
import Swap from "@/v2/pages/swap";
import Token from "@/v2/pages/token/index";

export default function PageContainer() {
  const { form } = useShellContext();
  const navigate = useNavigate();
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
    (props: {
      screen: "home" | "on-ramp" | "history" | "explore" | "token";
    }) => {
      const { screen } = props;
      switch (screen) {
        case "home": {
          return (
            <AuthenticatedShell>
              <Home />
            </AuthenticatedShell>
          );
        }
        case "on-ramp": {
          return (
            <AuthenticatedShell>
              <OnRamp />
            </AuthenticatedShell>
          );
        }
        case "explore": {
          return (
            <AuthenticatedShell>
              <Explore />
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
        default: {
          // TODO: remove this(replace with null), this is for testing
          return <Token />;
        }
      }
    },
    []
  );

  return (
    <Routes>
      {/* TODO: add in splash screen to handle onboarding */}
      <Route path="/" index element={<Onboarding />} />
      <Route
        path="/app"
        index
        element={<RenderScreenWithShell screen="home" />}
      />
      <Route
        path="/app/oo"
        element={<RenderScreenWithShell screen="on-ramp" />}
      />
      <Route
        path="/app/history"
        element={<RenderScreenWithShell screen="history" />}
      />
      <Route
        path="/app/explore"
        element={<RenderScreenWithShell screen="explore" />}
      />
      <Route
        path="/app/token/:id"
        element={<RenderScreenWithShell screen="token" />}
      />
    </Routes>
  );
}
