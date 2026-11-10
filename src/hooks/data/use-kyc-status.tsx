import { useQuery } from "@tanstack/react-query";

interface KYCStatusResponse {
  success: boolean;
  kycVerified: boolean;
  status?: "verified" | "under_review" | "not_started";
  underReview?: boolean;
  jobId?: string | null;
}

async function fetchKYCStatus(): Promise<KYCStatusResponse> {
  const authToken = localStorage.getItem("token");
  const apiKey = import.meta.env.VITE_SDK_API_KEY;
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!authToken) {
    throw new Error("No authentication token found");
  }

  try {
    const fullUrl = `${apiUrl}/v1/kyc/status`;

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

    const text = await response.text();

    // Parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, kycVerified: false };
    }

    if (!response.ok) {
      return { success: false, kycVerified: false };
    }

    return data;
  } catch {
    throw new Error("Failed to fetch KYC status");
  }
}

export default function useKYCStatus() {
  // Only run query if user has an auth token
  const hasAuthToken = !!localStorage.getItem("token");

  const query = useQuery({
    queryKey: ["kyc-status"],
    queryFn: fetchKYCStatus,
    staleTime: 30 * 1000, // 30 seconds - check more frequently for status updates
    refetchInterval: (query) => {
      // Auto-refresh every 30s if under review, otherwise every 2 minutes
      const data = query.state.data;
      if (data?.underReview) {
        return 30 * 1000; // 30 seconds when under review
      }
      return 2 * 60 * 1000; // 2 minutes otherwise
    },
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when user comes back to app
    enabled: hasAuthToken, // Only fetch if authenticated
  });

  return {
    ...query,
    isKYCVerified: query.data?.kycVerified ?? false,
    isUnderReview: query.data?.underReview ?? false,
    status: query.data?.status ?? "not_started",
    jobId: query.data?.jobId ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
