import { useEffect } from "react";
import { useShellContext } from "../shell-context";
import { Route, Routes, useNavigate } from "react-router";
import Home from "@/v2/pages/home";
import OnRamp from "@/v2/pages/onramp";
import History from "@/v2/pages/history";
import Explore from "@/v2/pages/explore";
import Token from "@/v2/pages/token";
import Deposit from "@/v2/pages/token/Deposit";
import Send from "@/v2/pages/token/Send";
import CompleteSendTransaction from "@/v2/pages/token/CompleteSendTransaction";

export default function PageContainer() {
  const { form } = useShellContext();
  const navigate = useNavigate();
  useEffect(() => {
    const subscription = form?.watch((values) => {
      if (values.tab) {
        if (values.tab == "home") {
          navigate("/");
        } else {
          navigate(`/${values.tab}`);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [form]);

  return (
    <Routes>
      {/* TODO: add in splash screen to handle onboarding */}
      <Route path="/" index element={<Home />} />
      <Route path="/oo" element={<OnRamp />} />
      <Route path="/history" element={<History />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/token/:id">
        <Route index element={<Token />} />
        <Route path="receive" element={<Deposit />} />
        <Route path="send" element={<Send />} />
        <Route
          path="send/address/:address"
          element={<CompleteSendTransaction />}
        />
      </Route>
    </Routes>
  );
}
