import { ReactNode, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoSettingsOutline, IoSettings, IoSparklesOutline, IoSparkles } from "react-icons/io5";
import { useShellContext } from "./shell-context";
import rift from "@/lib/rift";
import useAnalaytics from "@/hooks/use-analytics";
import { handleSuspension } from "@/utils/api-suspension-handler";
import { useOnboardingDemo } from "@/contexts/OnboardingDemoContext";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
}

export default function DesktopShell(props: Props) {
  const { children } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const { form } = useShellContext();
  const { logEvent } = useAnalaytics();
  const { checkAndStartDemo } = useOnboardingDemo();
  const hasCheckedDemo = useRef(false);

  useEffect(() => {
    const auth_token = localStorage.getItem("token");
    const address = localStorage.getItem("address");

    if (auth_token && address) {
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
    if (path.startsWith("/app/profile")) return "profile";
    if (path.startsWith("/app/invest")) return "invest";
    return "home";
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: "home" | "invest" | "profile") => {
    form?.setValue("tab", tab);
    if (tab === "home") {
      navigate("/app");
    } else {
      navigate(`/app/${tab}`);
    }
  };

  return (
    <div className="w-full h-full flex overflow-hidden bg-app-background">
      {/* Sidebar Navigation - Stripe-like */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src="/rift.png" alt="Rift" className="w-8 h-8" />
            <span className="text-lg font-semibold text-text-default">Rift</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => handleTabClick("home")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left",
              activeTab === "home"
                ? "bg-accent-primary/10 text-accent-primary font-medium"
                : "text-gray-600 hover:bg-accent-primary/5 hover:text-accent-primary"
            )}
          >
            {activeTab === "home" ? (
              <GoHomeFill className="w-5 h-5" />
            ) : (
              <GoHome className="w-5 h-5" />
            )}
            <span className="text-sm">Home</span>
          </button>

          <button
            id="tab-earn"
            onClick={() => handleTabClick("invest")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left",
              activeTab === "invest"
                ? "bg-accent-primary/10 text-accent-primary font-medium"
                : "text-gray-600 hover:bg-accent-primary/5 hover:text-accent-primary"
            )}
          >
            {activeTab === "invest" ? (
              <IoSparkles className="w-5 h-5" />
            ) : (
              <IoSparklesOutline className="w-5 h-5" />
            )}
            <span className="text-sm">Earn</span>
          </button>

          <button
            id="tab-settings"
            onClick={() => handleTabClick("profile")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left",
              activeTab === "profile"
                ? "bg-accent-primary/10 text-accent-primary font-medium"
                : "text-gray-600 hover:bg-accent-primary/5 hover:text-accent-primary"
            )}
          >
            {activeTab === "profile" ? (
              <IoSettings className="w-5 h-5" />
            ) : (
              <IoSettingsOutline className="w-5 h-5" />
            )}
            <span className="text-sm">Settings</span>
          </button>
        </nav>

        {/* Footer/Bottom Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400 text-center">
            Rift Wallet
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
      </main>
    </div>
  );
}
