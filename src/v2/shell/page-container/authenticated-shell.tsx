import { ReactNode, useEffect } from "react";
import BottomTabs from "../bottom-tabs";
import rift from "@/lib/rift";
import { useNavigate } from "react-router";
import useAnalaytics from "@/hooks/use-analytics";
import { handleSuspension } from "@/utils/api-suspension-handler";

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

    if (auth_token && address) {
      rift.setBearerToken(auth_token);
      logEvent("APP_LAUNCH");

      // Verify user is not suspended on app load
      verifyUserStatus();
    } else {
      navigate("/auth");
    }
  }, []);

  // Verify user status to check for suspension
  const verifyUserStatus = async () => {
    try {
      await rift.auth.getUser();
    } catch (error: any) {
      console.error("Error verifying user status:", error);

      // Check for account suspension
      if (error?.response?.status === 403 || error?.status === 403) {
        const errorData = error?.response?.data || error?.data || {};
        if (errorData?.message === "Account suspended") {
          console.log("🚫 [AuthShell] Account suspended, redirecting...");
          handleSuspension();
        }
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center relative">
      <div className="flex flex-col w-full flex-1 ">{children}</div>
      <BottomTabs />
    </div>
  );
}
