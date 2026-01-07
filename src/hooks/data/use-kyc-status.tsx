import { useQuery } from "@tanstack/react-query";

interface KYCStatusResponse {
  success: boolean;
  kycVerified: boolean;
}

async function fetchKYCStatus(): Promise<KYCStatusResponse> {
  const authToken = localStorage.getItem("token");
  const apiKey = import.meta.env.VITE_SDK_API_KEY;
  const apiUrl =import.meta.env.VITE_API_URL;

  console.log("🔍 [KYC Status] Fetching KYC status...");
  console.log("🔍 [KYC Status] API URL:", apiUrl);
  console.log("🔍 [KYC Status] Auth token exists:", !!authToken);
  console.log("🔍 [KYC Status] API key exists:", !!apiKey);

  if (!authToken) {
    console.error("🔍 [KYC Status] No auth token found!");
    throw new Error("No authentication token found");
  }

  try {
    const fullUrl = `${apiUrl}/api/kyc/verified`;
    console.log("🔍 [KYC Status] Full URL:", fullUrl);
    
    const response = await fetch(fullUrl, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        "x-api-key": apiKey,
      },
    });

    console.log("🔍 [KYC Status] Response status:", response.status);
    console.log("🔍 [KYC Status] Response headers:", Object.fromEntries(response.headers.entries()));
    
    // Log raw text first to debug HTML responses
    const text = await response.text();
    console.log("🔍 [KYC Status] Raw response (first 200 chars):", text.substring(0, 200));
    
    // Parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("🔍 [KYC Status] JSON parse error - response is not JSON:", parseError);
      console.error("🔍 [KYC Status] Full response text:", text);
      return { success: false, kycVerified: false };
    }

    if (!response.ok) {
      // If endpoint fails, assume not verified for safety
      console.error("🔍 [KYC Status] Failed to fetch KYC status:", response.status);
      return { success: false, kycVerified: false };
    }

    console.log("🔍 [KYC Status] Response data:", data);
    return data;
  } catch (error) {
    console.error("🔍 [KYC Status] Fetch error:", error);
    throw error;
  }
}

export default function useKYCStatus() {
  // Only run query if user has an auth token
  const hasAuthToken = !!localStorage.getItem("token");

  const query = useQuery({
    queryKey: ["kyc-status"],
    queryFn: fetchKYCStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes - KYC status doesn't change often
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when user comes back to app
    enabled: hasAuthToken, // Only fetch if authenticated
  });

  console.log("🔍 [KYC Status Hook] hasAuthToken:", hasAuthToken, "queryStatus:", query.status);

  return {
    ...query,
    isKYCVerified: query.data?.kycVerified ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
