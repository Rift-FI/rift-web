import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { WalletAddress } from "@/lib/entities";
import { isAddressValid } from "@/utils/address-verifier";
import sphere from "@/lib/sphere";

interface ContactSearchArgs {
  searchQuery?: "address" | "contact";
  searchTerm: string;
  chain?: string;
}

interface ContactData {
  phoneNumbers: string[];
  emails: string[];
  externalIds: string[];
}

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

function smartSearch(
  contacts: ContactData,
  searchTerm: string,
  chain?: string,
  searchQuery?: "address" | "contact"
): WalletAddress[] {
  const trimmedSearch = searchTerm.trim().toLowerCase();

  if (!trimmedSearch) return [];

  const results: WalletAddress[] = [];

  if (isAddressValid(trimmedSearch, chain)) {
    results.push({
      address: trimmedSearch,
      chain: chain,
      type: "address",
    });
  }

  const matchingPhones = contacts.phoneNumbers.filter((phone) =>
    phone.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingPhones.map((phone) =>
      contactToWalletAddress(phone, "telegram-username", chain)
    )
  );

  const matchingEmails = contacts.emails.filter((email) =>
    email.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingEmails.map((email) =>
      contactToWalletAddress(email, "email", chain)
    )
  );

  const matchingExternalIds = contacts.externalIds.filter((externalId) =>
    externalId.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingExternalIds.map((externalId) =>
      contactToWalletAddress(externalId, "externalId", chain)
    )
  );

  const uniqueResults = results.filter(
    (contact, index, self) =>
      index ===
      self.findIndex(
        (c) => c.address === contact.address && c.type === contact.type
      )
  );

  if (searchQuery == "address") {
    return results.filter((_c) => _c.address);
  }
  return uniqueResults;
}

export default function useContactSearch(args: ContactSearchArgs) {
  const { searchTerm, chain, searchQuery } = args;

  const contactsQuery = useQuery({
    queryKey: ["all-contacts"],
    queryFn: getAllContacts,
  });

  const searchResults = useMemo(() => {
    if (!contactsQuery.data || !searchTerm.trim()) return [];

    const contactData = contactsQuery.data;
    if (!contactData || typeof contactData !== "object") {
      return [];
    }

    return smartSearch(contactData, searchTerm, chain, searchQuery);
  }, [contactsQuery.data, searchTerm, chain]);

  return {
    results: searchResults,
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    refetch: contactsQuery.refetch,
  };
}
