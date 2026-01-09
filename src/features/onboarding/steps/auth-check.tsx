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

      console.log("🔍 [AuthCheck] Token exists:", !!auth_token, "Address exists:", !!address);

      if (auth_token && address) {
        rift.setBearerToken(auth_token);

        // Check KYC status before navigating
        setChecking(true);
        try {
          const apiUrl = import.meta.env.VITE_API_URL;
          const apiKey = import.meta.env.VITE_SDK_API_KEY;

          console.log("🔍 [AuthCheck] Checking KYC at:", `${apiUrl}/api/kyc/verified`);

          const response = await fetch(`${apiUrl}/api/kyc/verified`, {
            method: "GET",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth_token}`,
              "x-api-key": apiKey,
            },
          });

          console.log("🔍 [AuthCheck] KYC response status:", response.status);

          // Get raw text first to handle non-JSON responses
          const text = await response.text();
          console.log("🔍 [AuthCheck] KYC raw response:", text.substring(0, 200));

          let data;
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error("❌ [AuthCheck] KYC response is not JSON:", parseError);
            // If we can't parse the response, go to KYC to be safe
            navigate("/kyc");
            return;
          }

          console.log("🔍 [AuthCheck] KYC status:", data);

          if (data.kycVerified === true) {
            console.log("✅ [AuthCheck] User is KYC verified, going to /app");
            navigate("/app");
          } else if (data.underReview === true) {
            console.log("⏳ [AuthCheck] User KYC is under review, going to /app");
            navigate("/app");
          } else {
            console.log("⚠️ [AuthCheck] User not KYC verified, going to /kyc");
            navigate("/kyc");
          }
        } catch (error) {
          console.error("❌ [AuthCheck] KYC check failed:", error);
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
        <CgSpinner className="text-accent-primary w-10 h-10 animate-spin mb-4" />
        <p className="text-muted-foreground">Checking your account...</p>
      </div>
    );
  }

  return <Fragment />;
}
