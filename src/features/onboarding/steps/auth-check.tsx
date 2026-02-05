import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useFlow } from "../context";
import { usePlatformDetection } from "@/utils/platform";
import rift from "@/lib/rift";
import RiftLoader from "@/components/ui/rift-loader";

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

          // Get raw text first to handle non-JSON responses
          const text = await response.text();

          let data;
          try {
            data = JSON.parse(text);
          } catch {
            // If we can't parse the response, go to KYC to be safe
            navigate("/kyc");
            return;
          }

          if (data.kycVerified === true) {
            navigate("/app");
          } else if (data.underReview === true) {
            navigate("/app");
          } else {
            navigate("/kyc");
          }
        } catch {
          // On error, go to KYC to be safe
          navigate("/kyc");
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
        <RiftLoader message="Checking authentication..." />
        <p className="text-muted-foreground">Checking your account...</p>
      </div>
    );
  }

  return <Fragment />;
}
