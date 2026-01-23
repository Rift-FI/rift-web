import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useFlow } from "../context";
import { usePlatformDetection } from "@/utils/platform";
import rift from "@/lib/rift";
import { CgSpinner } from "react-icons/cg";

export default function AuthCheck() {
  const flow = useFlow();
  const navigate = useNavigate();
  const { isTelegram } = usePlatformDetection();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkAuthAndKYC = async () => {
      const auth_token = localStorage.getItem("token");
      const address = localStorage.getItem("address");

      if (auth_token && address) {
        rift.setBearerToken(auth_token);

        // Check KYC status before navigating
        setChecking(true);
        try {
          const apiUrl = import.meta.env.VITE_API_URL;
          const apiKey = import.meta.env.VITE_SDK_API_KEY;

          const response = await fetch(`${apiUrl}/api/kyc/verified`, {
            method: "GET",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth_token}`,
              "x-api-key": apiKey,
            },
          });

          // Check if response is OK
          if (!response.ok) {
            // If 401/403, might be auth issue - go to app and let guards handle it
            if (response.status === 401 || response.status === 403) {
              navigate("/app");
              return;
            }
            // Other errors - go to app and let guards handle it
            navigate("/app");
            return;
          }

          // Get raw text first to handle non-JSON responses
          const text = await response.text();

          let data;
          try {
            data = JSON.parse(text);
          } catch {
            // If we can't parse, might be HTML or other error - go to app
            navigate("/app");
            return;
          }

          // Check if response has success field
          if (data.success === false) {
            // Backend returned error - go to KYC
            navigate("/kyc");
            return;
          }

          if (data.kycVerified === true) {
            navigate("/app");
          } else if (data.underReview === true) {
            navigate("/app");
          } else {
            // Not verified and not under review - go to KYC
            navigate("/kyc");
          }
        } catch {
          // On error, go to app and let guards handle it
          navigate("/app");
        }
      return;
    } else {
      flow.goToNext("start");
    }
    };

    checkAuthAndKYC();
  }, [isTelegram]);

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-app-background">
        <CgSpinner className="text-accent-primary w-10 h-10 animate-spin mb-4" />
        <p className="text-muted-foreground">Checking your account...</p>
      </div>
    );
  }

  return <Fragment />;
}
