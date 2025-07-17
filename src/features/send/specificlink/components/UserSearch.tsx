import { motion } from "motion/react";
import { useSendContext } from "../../context";
import { SearchIcon } from "lucide-react";
import useContactSearch from "@/hooks/data/use-contact-search";
import AddressRenderer from "./Address";
import { WalletAddress } from "@/lib/entities";

export default function UserSearch() {
  const { state, switchCurrentStep } = useSendContext();

  const RECIPIENT_FILTER = state?.watch("searchfilter");

  const { results } = useContactSearch({ searchTerm: RECIPIENT_FILTER ?? "" });

  const onNext = (_contact: WalletAddress) => {
    state?.setValue("recipient", _contact.address);
    state?.setValue("contactmethod", _contact.type);
    state?.setValue("searchfilter", "");
    state?.setValue("active", "select-token");
  };

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-4"
    >
      <div className="flex flex-col">
        <span className="font-semibold">Find a recipient</span>
        <span className="text-sm">
          Use their phone number, email address or telegram username
        </span>
      </div>
      <div className="w-full flex flex-row items-center gap-x-2 rounded-[0.75rem] px-3 py-3 bg-app-background border-1 border-border">
        <SearchIcon className="text-muted-foreground" size={18} />
        <input
          className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1 font-semibold"
          placeholder="Search..."
          onChange={(e) => state?.setValue("searchfilter", e.target.value)}
        />
      </div>

      <div className="mt-1 flex flex-col space-y-3">
        {results?.map((_contact) => (
          <AddressRenderer address={_contact} onClick={onNext} />
        ))}
      </div>
    </motion.div>
  );
}
