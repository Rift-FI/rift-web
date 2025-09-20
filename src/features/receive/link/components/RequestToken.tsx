import { useMemo } from "react";
import { motion } from "motion/react";
import { SearchIcon } from "lucide-react";
import { WalletToken } from "@rift-finance/wallet";
import { usePaymentRequest } from "../context";
import TokenRenderer from "@/features/send/components/token-renderer";
import useTokens from "@/hooks/data/use-tokens";

export default function RequestToken() {
  const { switchPaymentRequestStep, state } = usePaymentRequest();
  const { data: ALL_TOKENS, isPending: ALL_TOKENS_PENDING } = useTokens({});
  const searchFilter = state?.watch("searchfilter");

  const TOKENS = useMemo(() => {
    if (!searchFilter || (searchFilter?.trim().length ?? 0) == 0)
      return ALL_TOKENS!;

    const filtered = ALL_TOKENS?.filter(
      (token: WalletToken) =>
        token.name
          .toLocaleLowerCase()
          .includes(searchFilter.trim().toLocaleLowerCase()) ||
        token
          ?.description!.toLocaleLowerCase()
          .includes(searchFilter.trim().toLocaleLowerCase())
    );
    return filtered ?? [];
  }, [searchFilter, ALL_TOKENS_PENDING, ALL_TOKENS?.length]);

  const handleTokenClick = (token: WalletToken) => {
    state?.setValue("requestToken", token.id);
    state?.setValue("requestTokenChain", token.chain_id);
    switchPaymentRequestStep("amount-input");
  };

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-4"
    >
      <div className="w-full flex flex-row items-center gap-x-2 rounded-[0.75rem] px-3 py-3 bg-app-background border-1 border-border">
        <SearchIcon className="text-muted-foreground" size={18} />
        <input
          className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1 font-medium"
          placeholder="Search..."
          onChange={(e) => state?.setValue("searchfilter", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {TOKENS?.length > 0 ? (
          TOKENS?.map((token) => (
            <TokenRenderer
              token={token}
              key={`${token.backend_id}-${token.id}-${token.chain_id}`}
              onClick={handleTokenClick}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No tokens found matching "{searchFilter}"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
