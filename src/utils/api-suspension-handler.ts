/**
 * API Suspension Handler
 * 
 * Utility to check for account suspension in API responses.
 * When a 403 with "Account suspended" is detected, it triggers
 * a redirect to the suspension page.
 */

interface SuspensionResponse {
  message: string;
  error?: string;
  suspendedAt?: string;
  reason?: string; // Note: reason should NOT be displayed to user
}

interface SuspensionCheckResult {
  isSuspended: boolean;
  suspendedAt?: string;
  message?: string;
}

/**
 * Check if an API response indicates account suspension
 */
export function checkForSuspension(
  status: number,
  data: any
): SuspensionCheckResult {
  if (status === 403 && data?.message === "Account suspended") {
    return {
      isSuspended: true,
      suspendedAt: data.suspendedAt,
      message: data.error || "Your account has been suspended and cannot access this service.",
    };
  }
  return { isSuspended: false };
}

/**
 * Handle suspension by clearing auth and redirecting
 * This is a standalone function for cases where context is not available
 */
export function handleSuspension(): void {
  console.log("🚫 [Suspension] Account suspended - clearing auth and redirecting");
  
  // Clear auth tokens
  localStorage.removeItem("token");
  localStorage.removeItem("address");
  
  // Redirect to suspended page
  window.location.href = "/suspended";
}

/**
 * Wrapper for fetch that automatically checks for suspension
 * Use this for API calls that might return suspension errors
 */
export async function suspensionAwareFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  
  // Check for suspension on 403 responses
  if (response.status === 403) {
    try {
      // Clone response so we can read it twice
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      
      const suspensionCheck = checkForSuspension(response.status, data);
      if (suspensionCheck.isSuspended) {
        handleSuspension();
        // Return response anyway, but the page will redirect
        return response;
      }
    } catch {
      // If we can't parse JSON, just return the original response
    }
  }
  
  return response;
}

/**
 * Create a fetch handler that uses the suspension context
 * for more controlled suspension handling
 */
export function createSuspensionAwareFetch(
  onSuspension: (info: { suspendedAt?: string; message?: string }) => void
) {
  return async function(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const response = await fetch(input, init);
    
    if (response.status === 403) {
      try {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        
        const suspensionCheck = checkForSuspension(response.status, data);
        if (suspensionCheck.isSuspended) {
          onSuspension({
            suspendedAt: suspensionCheck.suspendedAt,
            message: suspensionCheck.message,
          });
        }
      } catch {
        // If we can't parse JSON, just continue
      }
    }
    
    return response;
  };
}

