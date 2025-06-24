import { WalletAddress } from "@/lib/entities";
import {
  isAddressValid,
  isEnsValid,
  isTgUsernameValid,
  isEmailValid,
  isExternalIdValid,
} from "@/utils/address-verifier";
import sphere from "@/lib/sphere";
import { useQuery } from "@tanstack/react-query";

interface SearchArgs {
  address: string;
  chain?: string;
}

async function findRecipient(args: SearchArgs) {
  const { address, chain } = args;
  const searchTerm = address?.trim();

  if (!searchTerm) return null;

  // Mock data for testing
  if (searchTerm?.includes("cool")) {
    return {
      address: "0xf5efFda92b3Ca6FD3BDc9F4957d69F755006328C",
      chain: "8453",
      type: "address",
    } as WalletAddress;
  }

  // 1. Check if it's a valid wallet address
  const is_address = isAddressValid(searchTerm, chain);

  // 2. Check if it's a valid ENS name
  const is_ens = isEnsValid(searchTerm);

  // 3. Check if it's a valid telegram username
  const tg_user_phone = await isTgUsernameValid(searchTerm);

  // 4. Check if it's a valid email
  const is_email = isEmailValid(searchTerm);

  // 5. Check if it's a valid external ID
  const is_external_id = isExternalIdValid(searchTerm);

  if (is_address) {
    return {
      address: searchTerm,
      chain: chain,
      type: "address",
    } satisfies WalletAddress;
  }

  // TODO: Implement ENS resolution when available
  // if (is_ens) {
  //   return {
  //     address: searchTerm,
  //     chain: chain,
  //     type: "name-service",
  //   } satisfies WalletAddress;
  // }

  // Handle Telegram username
  if (tg_user_phone) {
    return {
      address: tg_user_phone, // replace with phone number
      chain: chain,
      type: "telegram-username",
    } satisfies WalletAddress;
  }

  // Handle email search - call backend to find user
  if (is_email) {
    try {
      // Get all users and find by email
      const { email: emails } = await sphere.paymentLinks.getAllUsers();
      const matchingEmail = emails?.find(
        (_email) => _email.toLowerCase() === searchTerm.toLowerCase()
      );

      if (matchingEmail) {
        return {
          address: matchingEmail,
          chain: chain,
          type: "email",
          displayName: searchTerm.split("@")[0],
        } satisfies WalletAddress;
      }
    } catch (error) {
      console.log("Error searching by email:", error);
    }
  }

  // Handle external ID search - call backend to find user
  if (is_external_id) {
    try {
      // Get all users and find by external ID
      const { externalId: externalIds } =
        await sphere.paymentLinks.getAllUsers();
      const matchingExternalId = externalIds?.find((_id) =>
        _id.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (matchingExternalId) {
        return {
          address: matchingExternalId,
          chain: chain,
          type: "externalId",
          displayName: `User ${matchingExternalId}`,
        } satisfies WalletAddress;
      }
    } catch (error) {
      console.log("Error searching by external ID:", error);
    }
  }

  // TODO: Add more sophisticated backend search
  // This could include:
  // - Fuzzy matching for usernames
  // - Phone number search
  // - Display name search
  // - etc.

  return null;
}

export default function useSearchRecipient(args: SearchArgs) {
  const { address, chain } = args;
  const query = useQuery({
    queryKey: ["address", address, chain],
    queryFn: async () => {
      return findRecipient(args);
    },
    enabled: !!address?.trim(), // Only run query if address is not empty
  });

  return query;
}
