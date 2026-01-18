import { ReactNode, useEffect, useRef } from "react";
import BottomTabs from "../bottom-tabs";
import rift from "@/lib/rift";
import { useNavigate } from "react-router";
import useAnalaytics from "@/hooks/use-analytics";
import { handleSuspension } from "@/utils/api-suspension-handler";
import { useOnboardingDemo } from "@/contexts/OnboardingDemoContext";

interface Props {
  children: ReactNode;
}

export default function AuthenticatedShell(props: Props) {
  const { children } = props;
  const navigate = useNavigate();
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

  return (
    <div className="w-full h-full relative">
      {/* Main content area - scrollable, with padding for bottom tabs */}
      <div className="absolute inset-0 bottom-[72px] overflow-y-auto overflow-x-hidden">
        {children}
      </div>
      {/* Bottom tabs - fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <BottomTabs />
      </div>
    </div>
  );
}
