import { ReactNode, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { LayoutGrid, QrCode, Settings } from "lucide-react";
import { useShellContext } from "./shell-context";
import rift from "@/lib/rift";
import useAnalytics from "@/hooks/use-analytics";
import { handleSuspension } from "@/utils/api-suspension-handler";
import { useOnboardingDemo } from "@/contexts/OnboardingDemoContext";
import { cn } from "@/lib/utils";
import V3EnrolmentBanner from "@/components/v3/v3-enrolment-banner";

interface Props {
  children: ReactNode;
}

export default function DesktopShell(props: Props) {
  const { children } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const { form } = useShellContext();
  const { logEvent } = useAnalytics();
  const { checkAndStartDemo } = useOnboardingDemo();
  const hasCheckedDemo = useRef(false);

  useEffect(() => {
    const auth_token = localStorage.getItem("token");
    // Token-only gate — address is hydrated by userQuery, not blocking.
    if (auth_token) {
      rift.setBearerToken(auth_token);
      logEvent("APP_LAUNCH");

      // Verify user is not suspended on app load
      verifyUserStatus();

      // Check and start demo for new users (only once)
      if (!hasCheckedDemo.current) {
        hasCheckedDemo.current = true;
        checkAndStartDemo();
      }
    } else {
      navigate("/auth");
    }
  }, []);

  // Verify user status to check for suspension
  const verifyUserStatus = async () => {
    try {
      await rift.auth.getUser();
    } catch (error: any) {
      // Check for account suspension
      if (error?.response?.status === 403 || error?.status === 403) {
        const errorData = error?.response?.data || error?.data || {};
        if (errorData?.message === "Account suspended") {
          handleSuspension();
        }
      }
    }
  };

  // Determine active tab from location
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/app" || path === "/app/") return "home";
    if (path.startsWith("/app/merchant")) return "merchant";
    if (path.startsWith("/app/profile")) return "profile";
    return "home";
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: "home" | "merchant" | "profile") => {
    form?.setValue("tab", tab);
    if (tab === "home") {
      navigate("/app");
    } else {
      navigate(`/app/${tab}`);
    }
  };

  const navItems: {
    tab: "home" | "merchant" | "profile";
    id?: string;
    label: string;
    Icon: typeof LayoutGrid;
  }[] = [
    { tab: "home", label: "Overview", Icon: LayoutGrid },
    { tab: "merchant", id: "tab-merchant", label: "Collections", Icon: QrCode },
    { tab: "profile", id: "tab-settings", label: "Settings", Icon: Settings },
  ];

  return (
    <div className="w-full h-full flex overflow-hidden bg-app-background">
      {/* Sidebar Navigation */}
      <aside className="w-[232px] flex-shrink-0 bg-white border-r border-border flex flex-col">
        {/* Logo/Header */}
        <div className="h-14 px-5 flex items-center border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/rift.png" alt="Rift" className="w-6 h-6" />
            <span
              className="text-[16px] font-semibold text-text-default tracking-[-0.01em]"
              style={{ fontFamily: 'var(--app-font-display)' }}
            >
              Rift
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav aria-label="Primary" className="flex-1 px-3 pt-4 space-y-px">
          <div className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Menu
          </div>
          {navItems.map(({ tab, id, label, Icon }) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                id={id}
                onClick={() => handleTabClick(tab)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative w-full flex items-center gap-2.5 h-9 px-2.5 rounded-md text-left cursor-pointer transition-colors duration-150",
                  active
                    ? "bg-surface-subtle text-text-default font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:rounded-full before:bg-accent-primary"
                    : "text-text-muted hover:bg-surface-subtle hover:text-text-default"
                )}
              >
                <Icon
                  className={cn("w-4 h-4", active ? "text-accent-primary" : "")}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="text-[13.5px]">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer/Bottom Section */}
        <div className="px-5 py-3.5 border-t border-border">
          <div className="text-[11px] text-text-muted">
            &copy; {new Date().getFullYear()} Rift
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-app-background">
        <V3EnrolmentBanner />
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
      </main>
    </div>
  );
}
