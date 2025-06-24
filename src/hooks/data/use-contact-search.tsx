import { WalletAddress } from "@/lib/entities";
import {
  isAddressValid,
  isEmailValid,
  isExternalIdValid,
} from "@/utils/address-verifier";
import sphere from "@/lib/sphere";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface ContactSearchArgs {
  searchTerm: string;
  chain?: string;
}

interface ContactData {
  phoneNumbers: string[];
  emails: string[];
  externalIds: string[];
}

// Get all contacts from backend
async function getAllContacts(): Promise<ContactData> {
  try {
    const { phoneNumber, email, externalId } =
      await sphere.paymentLinks.getAllUsers();

    return {
      phoneNumbers: phoneNumber || [],
      emails: email || [],
      externalIds: externalId || [],
    };
  } catch (error) {
    console.log("Error fetching contacts:", error);
    return {
      phoneNumbers: [],
      emails: [],
      externalIds: [],
    };
  }
}

// Convert contact to WalletAddress format
function contactToWalletAddress(
  contact: string,
  type: WalletAddress["type"],
  chain?: string
): WalletAddress {
  let displayName = "";

  switch (type) {
    case "email":
      displayName = contact.split("@")[0];
      break;
    case "externalId":
      displayName = `User ${contact}`;
      break;
    case "telegram-username":
      displayName = `@${contact}`;
      break;
    default:
      displayName = contact;
  }

  return {
    address: contact,
    chain: chain,
    type: type,
    displayName: displayName,
  };
}

// Smart search function that filters contacts based on search term
function smartSearch(
  contacts: ContactData,
  searchTerm: string,
  chain?: string
): WalletAddress[] {
  const trimmedSearch = searchTerm.trim().toLowerCase();

  if (!trimmedSearch) return [];

  const results: WalletAddress[] = [];

  // Check if it's a valid address first
  if (isAddressValid(trimmedSearch, chain)) {
    results.push({
      address: trimmedSearch,
      chain: chain,
      type: "address",
    });
  }

  // Search in phone numbers
  const matchingPhones = contacts.phoneNumbers.filter((phone) =>
    phone.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingPhones.map((phone) =>
      contactToWalletAddress(phone, "telegram-username", chain)
    )
  );

  // Search in emails
  const matchingEmails = contacts.emails.filter((email) =>
    email.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingEmails.map((email) =>
      contactToWalletAddress(email, "email", chain)
    )
  );

  // Search in external IDs
  const matchingExternalIds = contacts.externalIds.filter((externalId) =>
    externalId.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingExternalIds.map((externalId) =>
      contactToWalletAddress(externalId, "externalId", chain)
    )
  );

  // Remove duplicates based on address + type
  const uniqueResults = results.filter(
    (contact, index, self) =>
      index ===
      self.findIndex(
        (c) => c.address === contact.address && c.type === contact.type
      )
  );

  return uniqueResults;
}

export default function useContactSearch(args: ContactSearchArgs) {
  const { searchTerm, chain } = args;

  // Fetch all contacts
  const contactsQuery = useQuery({
    queryKey: ["all-contacts"],
    queryFn: getAllContacts,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Perform smart search
  const searchResults = useMemo(() => {
    if (!contactsQuery.data || !searchTerm.trim()) return [];

    // Ensure data has the expected ContactData structure
    const contactData = contactsQuery.data;
    if (!contactData || typeof contactData !== "object") {
      return [];
    }

    return smartSearch(contactData, searchTerm, chain);
  }, [contactsQuery.data, searchTerm, chain]);

  return {
    results: searchResults,
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    refetch: contactsQuery.refetch,
  };
}
