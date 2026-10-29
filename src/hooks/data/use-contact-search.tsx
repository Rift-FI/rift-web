import { WalletAddress } from "@/lib/entities";

/**
 * Recipient suggestions for the "send to a specific user" search.
 *
 * This used to download every user's phone / email / externalId via
 * `paymentLinks.getAllUsers()` and filter client-side. That SDK method was
 * removed (@rift-finance/wallet 1.4.26), and listing all users is now
 * owner-only and paginated on the backend (`/user/all`, `GET /v1/users`),
 * so a regular end-user session cannot (and should not) enumerate other
 * users. The hook keeps its shape so the UI keeps working, and degrades
 * to "no suggestions": the user types the full recipient identifier.
 */

interface ContactSearchArgs {
  searchTerm: string;
}

const NO_RESULTS: WalletAddress[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function useContactSearch(_args: ContactSearchArgs) {
  return {
    results: NO_RESULTS,
    isLoading: false,
    error: null as Error | null,
    refetch: async () => undefined,
  };
}
