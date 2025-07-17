import { Fragment, useEffect } from "react";
import { useNavigate } from "react-router";
import { useFlow } from "../context";
import { usePlatformDetection } from "@/utils/platform";
import sphere from "@/lib/sphere";

export default function AuthCheck() {
  const flow = useFlow();
  const navigate = useNavigate();
  const { isTelegram } = usePlatformDetection();

  useEffect(() => {
    const auth_token = localStorage.getItem("token");
    const address = localStorage.getItem("address");

    if (auth_token && address) {
      sphere.setBearerToken(auth_token);
      navigate("/app");
      return;
    } else {
      flow.goToNext("start");
    }
  }, [isTelegram]);

  return <Fragment />;
}
