import { useCallback } from "react";
import { useSuspension } from "@/contexts/SuspensionContext";
import { checkForSuspension } from "@/utils/api-suspension-handler";

/**
 * Hook that provides a fetch function with automatic suspension detection
 *
 * Usage:
 * ```tsx
 * const { suspensionFetch } = useSuspensionFetch();
 *
 * const response = await suspensionFetch(url, options);
 * if (!response.ok) {
 *   // Handle other errors - suspension is already handled
 * }
 * ```
 */
export function useSuspensionFetch() {
  const { setSuspended } = useSuspension();

  const suspensionFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await fetch(input, init);

      // Check for suspension on 403 responses
      if (response.status === 403) {
        try {
          // Clone response so we can read it twice
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();

          const suspensionCheck = checkForSuspension(response.status, data);
          if (suspensionCheck.isSuspended) {
            setSuspended({
              suspendedAt: suspensionCheck.suspendedAt,
              message: suspensionCheck.message,
            });
          }
        } catch {
          // If we can't parse JSON, just continue
        }
      }

      return response;
    },
    [setSuspended]
  );

  return { suspensionFetch };
}

/**
 * Utility to check response for suspension and handle it
 * Use this when you already have the response and data
 *
 * Usage in a useQuery:
 * ```tsx
 * const { checkAndHandleSuspension } = useSuspensionCheck();
 *
 * const response = await fetch(url);
 * const data = await response.json();
 *
 * if (!response.ok) {
 *   if (checkAndHandleSuspension(response.status, data)) {
 *     return null; // Suspension handled, stop processing
 *   }
 *   throw new Error("Request failed");
 * }
 * ```
 */
export function useSuspensionCheck() {
  const { checkSuspensionResponse } = useSuspension();

  const checkAndHandleSuspension = useCallback(
    (status: number, data: any): boolean => {
      return checkSuspensionResponse(status, data);
    },
    [checkSuspensionResponse]
  );

  return { checkAndHandleSuspension };
}
