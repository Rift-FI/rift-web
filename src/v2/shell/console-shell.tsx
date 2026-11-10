import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import posthog from "posthog-js";
import { LifeBuoy, LogOut, Menu, UserRound, Moon, Search, Settings, ShieldCheck, Sun, Monitor, Wallet } from "lucide-react";
import rift from "@/lib/rift";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/apiBase";
import useAnalytics from "@/hooks/use-analytics";
import useUser from "@/hooks/data/use-user";
import { usePendingApprovals } from "@/hooks/data/use-approvals";
import { handleSuspension } from "@/utils/api-suspension-handler";
import { useOnboardingDemo } from "@/contexts/OnboardingDemoContext";
import NotificationEmailSetup from "@/components/ui/notification-email-setup";
import PasskeySetupGate from "@/components/passkey/passkey-setup-gate";
import PendingApprovalsBanner from "@/components/passkey/pending-approvals-banner";
import { consumePostLoginRedirect } from "@/v2/pages/approvals/redirect";
import { useTheme, type ThemePreference } from "@/v2/lib/theme";
import { SideSheet } from "@/v2/ui";
import { openSupportChat } from "@/features/iriis/iriis-support-button";
import { MOBILE_TABS, NAV_ITEMS, isActive } from "./nav";

export function isSandboxEnv() {
  return import.meta.env.MODE === "sandbox" || /sandbox|staging|localhost/i.test(getApiBase());
}

function EnvBadge() {
  const sandbox = isSandboxEnv();
  return (
    <span
      data-testid="env-badge"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11.5px] font-semibold",
        sandbox ? "border-warning/40 bg-tint-pending text-pending" : "border-success/30 bg-tint-success text-success"
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {sandbox ? "Sandbox" : "Live"}
    </span>
  );
}

function initials(name?: string) {
  const parts = (name || "").trim().split(/[\s@._-]+/).filter((p) => /^[a-z]/i.test(p));
  if (!parts.length) return "";
  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function useSignOut() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  return () => {
    logEvent("SIGN_OUT", { reason: "manual_logout" });
    posthog.reset();
    localStorage.clear();
    navigate("/auth");
  };
}

function AccountMenu() {
  const { data: user } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { theme, setTheme } = useTheme();
  const name = user?.displayName || user?.display_name || user?.email || user?.phoneNumber || "Account";
  const sub = user?.email || user?.phoneNumber || user?.externalId || "";

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

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const themes: { value: ThemePreference; label: string; icon: ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
    { value: "system", label: "System", icon: <Monitor className="h-3.5 w-3.5" /> },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 items-center gap-2 rounded-md pl-1 pr-1 hover:bg-surface-subtle sm:pr-2 cursor-pointer"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[11.5px] font-semibold text-accent-primary">
          {initials(name) || <UserRound className="h-4 w-4" aria-hidden="true" />}
        </span>
        <span className="hidden max-w-[160px] truncate text-[13px] font-medium text-ink xl:block">{name}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-[70] w-64 overflow-hidden rounded-lg border border-hairline bg-card shadow-lg">
          <div className="border-b border-hairline px-4 py-3">
            <p className="truncate text-[14px] font-semibold text-ink">{name}</p>
            {sub && sub !== name && <p className="truncate text-[12.5px] text-ink-3">{sub}</p>}
          </div>
          <div className="p-1">
            <MenuItem icon={<Settings className="h-4 w-4" />} onClick={() => go("/app/settings")}>
              Settings
            </MenuItem>
            <MenuItem icon={<ShieldCheck className="h-4 w-4" />} onClick={() => go("/app/settings/security/passkeys")}>
              Passkeys
            </MenuItem>
            <MenuItem icon={<Wallet className="h-4 w-4" />} onClick={() => go("/app/withdraw")}>
              Withdraw
            </MenuItem>
          </div>
          <div className="border-t border-hairline px-3 py-2.5">
            <p className="mb-1.5 px-1 text-[11.5px] font-medium text-ink-3">Theme</p>
            <div className="grid grid-cols-3 gap-1" role="group" aria-label="Theme">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={theme === t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex h-8 items-center justify-center gap-1 rounded-md text-[12px] font-medium cursor-pointer",
                    theme === t.value ? "bg-teal-50 text-accent-primary ring-1 ring-accent-primary/30" : "text-ink-3 hover:bg-surface-subtle"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-hairline p-1">
            <MenuItem icon={<LogOut className="h-4 w-4" />} onClick={signOut} danger>
              Sign out
            </MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, children, onClick, danger }: { icon: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-[13.5px] font-medium cursor-pointer",
        danger ? "text-danger hover:bg-tint-danger" : "text-ink-2 hover:bg-surface-subtle hover:text-ink"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get("q") || "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/app/payments${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className="relative hidden w-full max-w-[420px] md:block"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        aria-label="Search payments"
        placeholder="Search payments, references, addresses"
        className="h-9 w-full rounded-md border border-hairline bg-surface-subtle pl-9 pr-9 text-[13.5px] text-ink placeholder:text-ink-3 focus:border-accent-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-hairline bg-card px-1.5 text-[11px] font-medium text-ink-3">/</kbd>
    </form>
  );
}

function Brand() {
  return (
    <Link to="/app" className="flex items-center gap-2.5 rounded-md" aria-label="Rift home">
      <img src="/rift.png" alt="Rift" className="h-7 w-7 rounded-md" />
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Rift</span>
    </Link>
  );
}

function Sidebar({ approvals }: { approvals: number }) {
  const { pathname } = useLocation();
  return (
    <aside aria-label="Sidebar" className="hidden w-[240px] flex-shrink-0 flex-col border-r border-hairline bg-card lg:flex">
      <div className="flex h-14 items-center px-5">
        <Brand />
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3 pt-3">
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
                "group flex h-9 items-center gap-3 rounded-md px-3 text-[14px] transition-colors duration-150",
                active ? "bg-teal-50 font-semibold text-accent-primary" : "font-medium text-ink-2 hover:bg-surface-subtle hover:text-ink"
              )}
            >
              <Icon className="h-[17px] w-[17px] flex-shrink-0" strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
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
      <div className="border-t border-hairline px-5 py-4">
        <p className="text-[12px] leading-relaxed text-ink-3">Every payment is approved with your passkey.</p>
      </div>
    </aside>
  );
}

function MobileTabs({ approvals, onMore }: { approvals: number; onMore: () => void }) {
  const { pathname } = useLocation();
  const tabs = NAV_ITEMS.filter((n) => MOBILE_TABS.includes(n.id));
  const moreActive = !tabs.some((t) => isActive(t, pathname));
  return (
    <nav
      aria-label="Primary"
      data-testid="mobile-tabs"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
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
        <button
          type="button"
          onClick={onMore}
          id="tab-more"
          data-testid="tab-more"
          aria-current={moreActive ? "page" : undefined}
          className={cn("relative flex flex-col items-center justify-center gap-1 text-[11px] cursor-pointer", moreActive ? "font-semibold text-accent-primary" : "font-medium text-ink-3")}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          More
          {approvals > 0 && <span className="absolute right-[calc(50%-16px)] top-2.5 h-2 w-2 rounded-full bg-accent-solid" aria-label={`${approvals} pending approvals`} />}
        </button>
      </div>
    </nav>
  );
}

function MoreSheet({ open, onClose, approvals }: { open: boolean; onClose: () => void; approvals: number }) {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const items = NAV_ITEMS.filter((n) => !MOBILE_TABS.includes(n.id));
  return (
    <SideSheet open={open} onClose={onClose} title="More">
      <ul className="-mx-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(item.to);
                }}
                className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] font-medium text-ink hover:bg-surface-subtle cursor-pointer"
              >
                <Icon className="h-5 w-5 text-ink-3" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.id === "approvals" && approvals > 0 && (
                  <span className="rounded-full bg-accent-solid px-2 text-[12px] font-semibold leading-5 text-white">{approvals}</span>
                )}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/app/withdraw");
            }}
            className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] font-medium text-ink hover:bg-surface-subtle cursor-pointer"
          >
            <Wallet className="h-5 w-5 text-ink-3" aria-hidden="true" />
            Withdraw
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              onClose();
              openSupportChat();
            }}
            className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] font-medium text-ink hover:bg-surface-subtle cursor-pointer"
          >
            <LifeBuoy className="h-5 w-5 text-ink-3" aria-hidden="true" />
            Help &amp; support
          </button>
        </li>
        <li className="border-t border-hairline pt-1">
          <button
            type="button"
            onClick={signOut}
            className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] font-medium text-danger hover:bg-tint-danger cursor-pointer"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sign out
          </button>
        </li>
      </ul>
    </SideSheet>
  );
}

/**
 * Authenticated console chrome: sidebar (desktop), top bar, mobile tab
 * bar, plus the security gates every signed-in screen needs (passkey
 * setup gate, approvals nudge, notification-email prompt).
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
  const [moreOpen, setMoreOpen] = useState(false);
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

  // Scroll back to the top on route change (the scroll container is ours).
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
        <header className="z-40 flex h-14 flex-shrink-0 items-center gap-3 border-b border-hairline bg-card px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <SearchBox />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <EnvBadge />
            <AccountMenu />
          </div>
        </header>
        <PasskeySetupGate />
        <PendingApprovalsBanner />
        <main ref={scrollRef} id="main" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>
      <MobileTabs approvals={approvals} onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} approvals={approvals} />
      <NotificationEmailSetup isOpen={showEmailSetup} onComplete={() => setShowEmailSetup(false)} />
    </div>
  );
}
