import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import useContactSearch from "@/hooks/data/use-contact-search";
import { useFlow } from "./flow-context";
import { CgSpinner } from "react-icons/cg";
import AddressRenderer from "../components/address-renderer";
import { WalletAddress } from "@/lib/entities";
import { useEffect, useRef } from "react";

const search = z.object({
  searchInput: z.string(),
});

type Search = z.infer<typeof search>;

export default function AddressSearch() {
  const flowState = useFlow();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm<Search>({
    resolver: zodResolver(search),
    defaultValues: {
      searchInput: "",
    },
  });

  const address = form.watch("searchInput");
  const chain = flowState.state?.watch("chain");
  const token = flowState.state?.watch("token");
  const SEARCH_EMPTY = (address?.trim()?.length ?? 0) == 0;

  // Use the new smart contact search
  const { results, isLoading } = useContactSearch({
    searchTerm: address,
    chain: chain,
  });

  useEffect(() => {
    if (token) {
      inputRef?.current?.blur();
    }
  }, [token]);

  function handleClick(address: WalletAddress) {
    flowState.state?.setValue("recipient", address.address);

    // Map WalletAddress type to flow context contactType
    const contactTypeMapping: Record<WalletAddress["type"], string> = {
      address: "address",
      email: "email",
      externalId: "externalId",
      "telegram-username": "telegram",
      "name-service": "address", // Treat ENS names as addresses
    };

    flowState.state?.setValue(
      "contactType",
      contactTypeMapping[address.type] as any
    );
    flowState.goToNext();
  }

  return (
    <div className="w-full flex flex-col items-center gap-4 px-5">
      <div className="space-y-4 w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Send to Contact</h2>
          <p className="text-muted-foreground">
            Enter an address, ENS name, username, email, or external ID
          </p>
        </div>

        <Controller
          control={form.control}
          name="searchInput"
          render={({ field }) => {
            return (
              <div className="flex flex-row items-center w-full gap-x-2 bg-secondary rounded-lg px-3 py-3">
                <input
                  {...field}
                  ref={inputRef}
                  className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1"
                  placeholder="Address, ENS, username, email, or external ID"
                />
              </div>
            );
          }}
        />
      </div>

      <div className="flex flex-col w-full h-full">
        {SEARCH_EMPTY ? (
          <PreviousAddresses />
        ) : (
          <AddressSearchResults
            results={results}
            isLoading={isLoading}
            onContactClick={handleClick}
            searchTerm={address}
          />
        )}
      </div>
    </div>
  );
}

interface PreviousAddressesProps {}

function PreviousAddresses() {
  return (
    <div className="w-full flex flex-col items-center h-full">
      <p>No previous transactions</p>
    </div>
  );
}

interface AddressSearchResultsProps {
  results: WalletAddress[];
  isLoading: boolean;
  onContactClick: (address: WalletAddress) => void;
  searchTerm: string;
}

function AddressSearchResults(props: AddressSearchResultsProps) {
  const { results, isLoading, onContactClick, searchTerm } = props;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 items-center w-full h-full">
        <CgSpinner className="animate-spin text-accent-primary" />
        <p className="text-sm text-muted-foreground">Searching contacts...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-x-3 w-full h-full">
        <p className="font-semibold text-white">No contacts found</p>
        <p className="text-sm text-muted-foreground">
          No contacts matching "{searchTerm}"
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-2">
      <p className="text-sm text-muted-foreground px-1">
        {results.length} contact{results.length > 1 ? "s" : ""} found
      </p>

      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {results.map((contact, index) => (
          <AddressRenderer
            key={`${contact.address}-${contact.type}-${index}`}
            address={contact}
            onClick={onContactClick}
          />
        ))}
      </div>
    </div>
  );
}
