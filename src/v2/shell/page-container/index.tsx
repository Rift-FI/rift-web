import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { usePWAShortcuts } from "@/hooks/use-pwa-shortcuts";
import ConsoleShell from "../console-shell";
import Onboarding from "@/features/onboarding";
import Splash from "@/v2/pages/splash";
import Home from "@/v2/pages/home";
import Payments from "@/v2/pages/payments";
import Send from "@/v2/pages/send";
import Receive from "@/v2/pages/receive";
import PaymentLinks from "@/v2/pages/payment-links";
import Settings from "@/v2/pages/profile";
import Passkeys from "@/v2/pages/profile/passkeys";
import Approvals from "@/v2/pages/approvals";
import ApprovePage from "@/v2/pages/approvals/approve";
import Convert from "@/v2/pages/bridge";
import Advanced from "@/v2/pages/advanced";
import Assets from "@/v2/pages/assets";
import Swap from "@/v2/pages/swap";
import WalletConnect from "@/v2/pages/walletconnect";
import Request from "@/features/request";
import Withdraw from "@/features/withdraw";
import SuspendedPage from "@/v2/pages/suspended";
import ResetPassword from "@/features/recovery/reset-password";
import RecoverAccount from "@/features/recovery/recover-account";


/** Keep the query string when redirecting old URLs. */
function Redirect({ to }: { to: string }) {
  const { search } = useLocation();
  const [path, query] = to.split("?");
  const merged = new URLSearchParams(search);
  new URLSearchParams(query || "").forEach((v, k) => merged.set(k, v));
  const qs = merged.toString();
  return <Navigate to={`${path}${qs ? `?${qs}` : ""}`} replace />;
}

export default function PageContainer() {
  usePWAShortcuts();

  return (
    <Routes>
      <Route path="/" index element={<Splash />} />
      <Route path="/auth" element={<Onboarding />} />
      <Route path="/suspended" element={<SuspendedPage />} />
      <Route path="/approve/:id" element={<ApprovePage />} />

      {/* Console — one persistent shell for every signed-in screen */}
      <Route
        element={
          <ConsoleShell>
            <Outlet />
          </ConsoleShell>
        }
      >
      <Route path="/app" element={<Home />} />
      <Route path="/app/payments" element={<Payments />} />
      <Route path="/app/send" element={<Send />} />
      <Route path="/app/withdraw" element={<Withdraw />} />
      <Route path="/app/convert" element={<Convert />} />
      <Route path="/app/receive" element={<Receive />} />
      <Route path="/app/request" element={<Request />} />
      <Route path="/app/payment-links" element={<PaymentLinks />} />
      <Route path="/app/approvals" element={<Approvals />} />
      <Route path="/app/settings" element={<Settings />} />
      <Route path="/app/settings/security/passkeys" element={<Passkeys />} />
      <Route path="/app/advanced" element={<Advanced />} />
      <Route path="/app/advanced/assets" element={<Assets />} />
      <Route path="/app/advanced/swap" element={<Swap />} />
      <Route path="/app/advanced/walletconnect" element={<WalletConnect />} />
      </Route>

      {/* Old URLs (bookmarks, PWA shortcuts, notifications) */}
      <Route path="/app/pay" element={<Redirect to="/app/send?method=mobile" />} />
      <Route path="/app/send/address" element={<Redirect to="/app/send?method=wallet" />} />
      <Route path="/app/receive/address" element={<Redirect to="/app/receive" />} />
      <Route path="/app/merchant" element={<Redirect to="/app/payment-links" />} />
      <Route path="/app/wallet" element={<Redirect to="/app/payments" />} />
      <Route path="/app/history" element={<Redirect to="/app/payments" />} />
      <Route path="/app/walletconnect" element={<Redirect to="/app/advanced/walletconnect" />} />
      <Route path="/app/settings/connected-apps" element={<Redirect to="/app/advanced/walletconnect" />} />
      <Route path="/app/assets" element={<Redirect to="/app/advanced/assets" />} />
      <Route path="/app/swap" element={<Redirect to="/app/advanced/swap" />} />
      <Route path="/app/profile" element={<Redirect to="/app/settings" />} />
      <Route path="/app/profile/security/passkeys" element={<Redirect to="/app/settings/security/passkeys" />} />
      <Route path="/app/profile/wallet-methods" element={<Redirect to="/app/settings/security/passkeys" />} />

      {/* Recovery deep link routes (unauthenticated) */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/recover-account" element={<RecoverAccount />} />
      {/* Catch-all route - redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
