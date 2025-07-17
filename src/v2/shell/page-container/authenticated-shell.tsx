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

    if (!isNewVersion) {
      localStorage.clear();
      window.location.href = "/auth";
      return;
    }

    if (auth_token && address) {
      sphere.setBearerToken(auth_token);
      logEvent("APP_LAUNCH");
    } else {
      navigate("/auth");
    }
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col items-center relative">
      <div className="flex flex-col w-full flex-1 ">{children}</div>
      <BottomTabs />
    </div>
  );
}
