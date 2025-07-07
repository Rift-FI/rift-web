import { ReactNode, useEffect } from "react";
import BottomTabs from "../bottom-tabs";
import sphere from "@/lib/sphere";
import { useNavigate } from "react-router";
import useAnalaytics from "@/hooks/use-analytics";

interface Props {
  children: ReactNode;
}
export default function AuthenticatedShell(props: Props) {
  const { children } = props;
  const navigate = useNavigate();
  const { logEvent } = useAnalaytics();

  useEffect(() => {
    const auth_token = localStorage.getItem("token");
    const address = localStorage.getItem("address");
    const isNewVersion = localStorage.getItem("isNewVersion");

    // Force migration check - logout users who haven't migrated
    if (!isNewVersion) {
      console.log("🔄 User hasn't migrated to v2, forcing logout...");
      // Clear all localStorage to force logout
      localStorage.clear();
      // Redirect to auth (which will show migration dialog)
      window.location.href = "/auth";
      return;
    }

    if (auth_token && address) {
      sphere.setBearerToken(auth_token);

      // Track app launch for authenticated users
      logEvent("APP_LAUNCH");
    } else {
      navigate("/auth");
    }
  }, [logEvent, navigate]);

  return (
    <div className="w-screen h-screen flex flex-col items-center relative">
      <div className="flex flex-col w-full flex-1 ">{children}</div>
      <div className="flex flex-row items-center justify-center px-5 bg-app-background border-t-1 border-border backdrop-blur-1xl w-full shadow-2xl shadow-surface-subtle fixed bottom-0 pb-5">
        <BottomTabs />
      </div>
    </div>
  );
}
