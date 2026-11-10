import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import posthog from "posthog-js";
import { LifeBuoy, LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react";
import rift from "@/lib/rift";
import { cn } from "@/lib/utils";
import useAnalytics from "@/hooks/use-analytics";
import useUser from "@/hooks/data/use-user";
import { usePendingApprovals } from "@/hooks/data/use-approvals";
import { handleSuspension } from "@/utils/api-suspension-handler";
import { useOnboardingDemo } from "@/contexts/OnboardingDemoContext";
import NotificationEmailSetup from "@/components/ui/notification-email-setup";
import PasskeySetupGate from "@/components/passkey/passkey-setup-gate";
import PendingApprovalsBanner from "@/components/passkey/pending-approvals-banner";
import { DeviceGate } from "@/v2/pages/devices/approve-panel";
import { consumePostLoginRedirect } from "@/v2/pages/approvals/redirect";
import { openSupportChat } from "@/features/iriis/iriis-support-button";
import { useTheme, type ThemePreference } from "@/v2/lib/theme";
import { MOBILE_TABS, NAV_ITEMS, isActive } from "./nav";

function initials(name?: string) {
  const parts = (name || "").trim().split(/[\s@._-]+/).filter((p) => /^[a-z]/i.test(p));
  if (!parts.length) return "";
  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export function useSignOut() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  return () => {
    logEvent("SIGN_OUT", { reason: "manual_logout" });
    posthog.reset();
    localStorage.clear();
    navigate("/auth");
  };
}

/** Avatar button + menu: theme, help, sign out. */
function AccountMenu({ placement = "down" }: { placement?: "down" | "up" }) {
  const { data: user } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signOut = useSignOut();
  const { theme, setTheme } = useTheme();
  const name = user?.displayName || user?.display_name || user?.email || user?.phoneNumber || "Account";
  const sub = user?.email || user?.phoneNumber || "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const themes: { value: ThemePreference; label: string; icon: ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
    { value: "system", label: "Auto", icon: <Monitor className="h-3.5 w-3.5" /> },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex w-full items-center gap-2.5 rounded-full p-1 hover:bg-surface-subtle lg:rounded-md lg:px-2 lg:py-1.5 cursor-pointer"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-[12px] font-semibold text-accent-primary">
          {initials(name) || <UserRound className="h-4 w-4" aria-hidden="true" />}
        </span>
        <span className="hidden min-w-0 truncate text-left text-[13.5px] font-medium text-ink lg:block">{name}</span>
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-[70] w-60 overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-hairline",
            placement === "up" ? "bottom-12 left-0" : "right-0 top-11"
          )}
        >
          <div className="px-4 py-3">
            <p className="truncate text-[14px] font-semibold text-ink">{name}</p>
            {sub && sub !== name && <p className="truncate text-[12.5px] text-ink-3">{sub}</p>}
          </div>
          <div className="px-3 pb-3">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-subtle p-1" role="group" aria-label="Theme">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={theme === t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex h-8 items-center justify-center gap-1 rounded-md text-[12px] font-medium cursor-pointer",
                    theme === t.value ? "bg-card text-ink shadow-xs" : "text-ink-3 hover:text-ink"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-hairline p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                openSupportChat();
              }}
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-[13.5px] font-medium text-ink-2 hover:bg-surface-subtle cursor-pointer"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Help
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-[13.5px] font-medium text-danger hover:bg-tint-danger cursor-pointer"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Brand() {
  return (
    <Link to="/app" className="flex items-center gap-2.5 rounded-md" aria-label="Rift home">
      <img src="/rift.png" alt="Rift" className="h-7 w-7 rounded-md" />
      <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink">Rift</span>
    </Link>
  );
}

function Sidebar({ approvals }: { approvals: number }) {
  const { pathname } = useLocation();
  return (
    <aside aria-label="Sidebar" className="hidden w-[232px] flex-shrink-0 flex-col bg-canvas lg:flex">
      <div className="flex h-16 items-center px-6">
        <Brand />
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              id={`nav-${item.id}`}
              data-testid={`nav-${item.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-[14.5px] transition-colors duration-150",
                active ? "bg-card font-semibold text-ink shadow-xs ring-1 ring-hairline" : "font-medium text-ink-3 hover:text-ink"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active && "text-accent-primary")} strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.id === "approvals" && approvals > 0 && (
                <span className="min-w-5 rounded-full bg-accent-solid px-1.5 text-center text-[11px] font-semibold leading-5 text-white" aria-label={`${approvals} pending`}>
                  {approvals}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-4">
        <AccountMenu placement="up" />
      </div>
    </aside>
  );
}

function MobileTabs() {
  const { pathname } = useLocation();
  const tabs = NAV_ITEMS.filter((n) => MOBILE_TABS.includes(n.id));
  return (
    <nav
      aria-label="Primary"
      data-testid="mobile-tabs"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid h-16 grid-cols-4">
        {tabs.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              id={`tab-${item.id}`}
              data-testid={`tab-${item.id}`}
              aria-current={active ? "page" : undefined}
              className={cn("flex flex-col items-center justify-center gap-1 text-[11px]", active ? "font-semibold text-accent-primary" : "font-medium text-ink-3")}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Signed-in app chrome: a quiet sidebar on desktop, a top bar + tab bar on
 * mobile, plus the security gates every signed-in screen needs.
 */
export default function ConsoleShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logEvent } = useAnalytics();
  const { checkAndStartDemo } = useOnboardingDemo();
  const hasCheckedDemo = useRef(false);
  const { data: user } = useUser();
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const emailCheckDone = useRef(false);
  const { data: approvalsData } = usePendingApprovals();
  const approvals = approvalsData?.length ?? 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth_token = localStorage.getItem("token");
    // Only the token gates access — the address is hydrated by userQuery.
    if (auth_token) {
      rift.setBearerToken(auth_token);
      logEvent("APP_LAUNCH");

      // Came from an /approve/:id link before logging in — go back there.
      const resume = consumePostLoginRedirect();
      if (resume) {
        navigate(resume, { replace: true });
        return;
      }

      verifyUserStatus();

      if (!hasCheckedDemo.current) {
        hasCheckedDemo.current = true;
        checkAndStartDemo();
      }
    } else {
      navigate("/auth");
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  // Users who signed up with phone / externalId need a notification email.
  useEffect(() => {
    if (user && !emailCheckDone.current) {
      emailCheckDone.current = true;
      const hasEmail = user.notificationEmail || user.notification_email || user.email;
      if (!hasEmail) setShowEmailSetup(true);
    }
  }, [user]);

  const verifyUserStatus = async () => {
    try {
      await rift.auth.getUser();
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.status === 403) {
        const errorData = error?.response?.data || error?.data || {};
        if (errorData?.message === "Account suspended") handleSuspension();
      }
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-canvas text-ink" data-testid="console-shell">
      <Sidebar approvals={approvals} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-40 flex h-14 flex-shrink-0 items-center justify-between bg-canvas px-4 sm:px-6 lg:hidden">
          <Brand />
          <AccountMenu />
        </header>
        <PasskeySetupGate />
        <PendingApprovalsBanner />
        <DeviceGate />
        <main ref={scrollRef} id="main" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>
      <MobileTabs />
      <NotificationEmailSetup isOpen={showEmailSetup} onComplete={() => setShowEmailSetup(false)} />
    </div>
  );
}
