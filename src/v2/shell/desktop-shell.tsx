import { ReactNode, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoSettingsOutline, IoSettings } from "react-icons/io5";
import { MdQrCode2, MdOutlineQrCode2 } from "react-icons/md";
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

  return (
    <div className="w-full h-full flex overflow-hidden bg-app-background">
      {/* Sidebar Navigation */}
      <aside className="w-[260px] flex-shrink-0 bg-white/80 backdrop-blur-sm border-r border-surface/80 flex flex-col">
        {/* Logo/Header */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 flex items-center justify-center">
              <img src="/rift.png" alt="Rift" className="w-7 h-7" />
            </div>
            <span
              className="text-[19px] font-semibold text-text-default tracking-[-0.02em]"
              style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
            >
              Rift
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-0.5">
          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle/60">
            Menu
          </div>
          <button
            onClick={() => handleTabClick("home")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer",
              activeTab === "home"
                ? "bg-accent-primary/12 text-accent-primary font-semibold shadow-[inset_0_0_0_1px_rgba(46,140,150,0.15)]"
                : "text-text-default/75 hover:bg-surface/80 hover:text-text-default"
            )}
          >
            {activeTab === "home" ? (
              <GoHomeFill className="w-[18px] h-[18px]" />
            ) : (
              <GoHome className="w-[18px] h-[18px]" />
            )}
            <span className="text-[14px]">Home</span>
          </button>

          <button
            id="tab-merchant"
            onClick={() => handleTabClick("merchant")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer",
              activeTab === "merchant"
                ? "bg-accent-primary/12 text-accent-primary font-semibold shadow-[inset_0_0_0_1px_rgba(46,140,150,0.15)]"
                : "text-text-default/75 hover:bg-surface/80 hover:text-text-default"
            )}
          >
            {activeTab === "merchant" ? (
              <MdQrCode2 className="w-[18px] h-[18px]" />
            ) : (
              <MdOutlineQrCode2 className="w-[18px] h-[18px]" />
            )}
            <span className="text-[14px]">Merchant</span>
          </button>

          <button
            id="tab-settings"
            onClick={() => handleTabClick("profile")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer",
              activeTab === "profile"
                ? "bg-accent-primary/12 text-accent-primary font-semibold shadow-[inset_0_0_0_1px_rgba(46,140,150,0.15)]"
                : "text-text-default/75 hover:bg-surface/80 hover:text-text-default"
            )}
          >
            {activeTab === "profile" ? (
              <IoSettings className="w-[18px] h-[18px]" />
            ) : (
              <IoSettingsOutline className="w-[18px] h-[18px]" />
            )}
            <span className="text-[14px]">Settings</span>
          </button>
        </nav>

        {/* Footer/Bottom Section */}
        <div className="px-5 py-4 border-t border-surface/80">
          <div className="text-[11px] text-text-subtle/60 tracking-wide">
            &copy; {new Date().getFullYear()} Rift Wallet
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-app-background">
        <V3EnrolmentBanner />
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
      </main>
    </div>
  );
}
