import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { WalletAddress } from "@/lib/entities";
import rift from "@/lib/rift";

interface ContactSearchArgs {
  searchTerm: string;
}

interface ContactData {
  phoneNumbers: string[];
  emails: string[];
  externalIds: string[];
}

async function getAllContacts(): Promise<ContactData> {
  try {
    const { phoneNumber, email, externalId } =
      await rift.paymentLinks.getAllUsers();

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
  type: WalletAddress["type"]
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
    type: type,
    displayName: displayName,
  };
}

function smartSearch(
  contacts: ContactData,
  searchTerm: string
): WalletAddress[] {
  const trimmedSearch = searchTerm.trim().toLowerCase();

  if (!trimmedSearch) return [];

  const results: WalletAddress[] = [];

  const matchingPhones = contacts.phoneNumbers.filter((phone) =>
    phone.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingPhones.map((phone) =>
      contactToWalletAddress(phone, "telegram-username")
    )
  );

  const matchingEmails = contacts.emails.filter((email) =>
    email.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingEmails.map((email) => contactToWalletAddress(email, "email"))
  );

  const matchingExternalIds = contacts.externalIds.filter((externalId) =>
    externalId.toLowerCase().includes(trimmedSearch)
  );
  results.push(
    ...matchingExternalIds.map((externalId) =>
      contactToWalletAddress(externalId, "externalId")
    )
  );

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
  const { searchTerm } = args;

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

    return smartSearch(contactData, searchTerm);
  }, [contactsQuery.data, searchTerm]);

  return {
    results: searchResults,
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    refetch: contactsQuery.refetch,
  };
}
