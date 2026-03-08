import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useSendContext } from "../../context";
import useChain from "@/hooks/data/use-chain";
import useToken from "@/hooks/data/use-token";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useTokenBalance from "@/hooks/data/use-token-balance";
import useOwnedTokens from "@/hooks/data/use-owned-tokens";
import ActionButton from "@/components/ui/action-button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatFloatNumber, formatNumberUsd } from "@/lib/utils";
import { isAddressValid } from "@/utils/address-verifier";
import { WalletToken } from "@/lib/entities";
import useSupportedTokens from "@/hooks/data/use-supported-tokens";
import TokenRenderer from "../../components/token-renderer";

const search = z.object({
  address: z.string(),
  amount: z.string(),
});

type Search = z.infer<typeof search>;

export default function AddressAmount() {
  const { state, switchCurrentStep } = useSendContext();
  const [isTokenPickerOpen, setIsTokenPickerOpen] = useState(false);

  const form = useForm<Search>({
    resolver: zodResolver(search),
    defaultValues: {
      address: state?.getValues("recipient") ?? "",
      amount: state?.getValues("amount") ?? "",
    },
  });

  const address = form.watch("address");
  const amount = form?.watch("amount");
  const chain = state?.watch("chain");
  const token = state?.watch("token");
  const backendId = state?.watch("backendId");
  const ctxTokenName = state?.watch("tokenName");
  const ctxTokenIcon = state?.watch("tokenIcon");

  const { data: TOKEN_INFO } = useToken({
    id: token,
    chain: chain,
  });
  const { data: CHAIN_INFO } = useChain({ id: chain! });
  const { data: TOKEN_BALANCE } = useTokenBalance({
    token: token!,
    chain: chain,
    backendId: backendId,
  });
  const { convertedAmount } = useGeckoPrice({
    token: token,
    base: "usd",
    amount: parseFloat(amount ?? 0),
  });

  // For tokens without local definitions, use context values as fallback
  const displayName = TOKEN_INFO?.name ?? ctxTokenName ?? "Select Token";
  const displayIcon = TOKEN_INFO?.icon ?? ctxTokenIcon;

  // Fetch user's owned tokens for the picker
  const { data: ownedTokens } = useOwnedTokens();

  // Fetch all supported tokens/chains
  const { data: supportedTokens } = useSupportedTokens();

  const update_state_amount = useCallback(() => {
    if (Number(amount) > TOKEN_BALANCE?.amount!) {
      // insufficient balance
    } else {
      state?.setValue("amount", amount);
    }
  }, [amount, address]);

  const ADDRESS_IS_VALID = useMemo(() => {
    if (address && isAddressValid(address)) {
      state?.setValue("recipient", address);
      return true;
    }
    return false;
  }, [address]);

  useEffect(() => {
    update_state_amount();
  }, [amount]);

  const handleSelectToken = (selectedToken: WalletToken) => {
    state?.setValue("token", selectedToken.id);
    state?.setValue("chain", selectedToken.chain_id);
    state?.setValue("backendId", selectedToken.backend_id ?? "");
    state?.setValue("tokenName", selectedToken.name);
    state?.setValue("tokenIcon", selectedToken.icon);
    // Reset amount when switching tokens
    form.setValue("amount", "");
    state?.setValue("amount", "");
    setIsTokenPickerOpen(false);
  };

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full"
    >
      {/* Token Selector */}
      <button
        onClick={() => setIsTokenPickerOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-subtle/80 border border-border transition-colors"
      >
        {displayIcon && (
          <img
            src={displayIcon}
            alt={displayName}
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="text-sm font-semibold text-text-default">
          {displayName}
        </span>
        {CHAIN_INFO && (
          <span className="text-xs text-text-subtle">
            on {CHAIN_INFO.name}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-text-subtle ml-1" />
      </button>

      {/* Token Picker Drawer */}
      <Drawer
        open={isTokenPickerOpen}
        onClose={() => setIsTokenPickerOpen(false)}
        onOpenChange={(open) => {
          if (!open) setIsTokenPickerOpen(false);
        }}
      >
        <DrawerContent className="bg-surface">
          <DrawerHeader className="p-4">
            <DrawerTitle>Choose Token</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {ownedTokens && ownedTokens.length > 0 ? (
              ownedTokens.map((t) => (
                <TokenRenderer
                  key={`${t.backend_id ?? t.id}-${t.chain_id}`}
                  token={t}
                  onClick={handleSelectToken}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tokens found
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <div className="w-full mt-4">
        <Controller
          control={form.control}
          name="address"
          render={({ field }) => {
            return (
              <div className="w-full flex flex-row items-center rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border">
                <input
                  {...field}
                  className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1 font-medium"
                  placeholder="Enter address to send to"
                />
              </div>
            );
          }}
        />

        {address && !ADDRESS_IS_VALID && (
          <span className="text-sm text-danger font-medium">
            Invalid address
          </span>
        )}

        <Controller
          control={form.control}
          name="amount"
          render={({ field }) => {
            return (
              <div className="w-full flex flex-row items-center justify-between mt-6 rounded-[0.75rem] px-3 py-3 bg-app-background border-1 border-border">
                <input
                  {...field}
                  className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1 font-medium"
                  placeholder="Amount"
                  type="number"
                  inputMode="numeric"
                />

                <ActionButton
                  onClick={() =>
                    field.onChange(
                      formatFloatNumber(TOKEN_BALANCE?.amount || 0).toString()
                    )
                  }
                  variant="ghost"
                  className="w-fit h-fit gap-0 border-0 p-[0.125rem] px-[1rem] rounded-full bg-accent cursor-pointer text-sm font-medium"
                >
                  Max
                </ActionButton>
              </div>
            );
          }}
        />
      </div>

      {amount && Number(amount) == 0 ? (
        <span className="inline-block mt-4 text-sm text-danger font-medium">
          Amount cannot be zero (0)
        </span>
      ) : Number(amount) > TOKEN_BALANCE?.amount! ? (
        <span className="inline-block mt-4 text-sm text-danger font-medium">
          Insufficient {displayName} balance
        </span>
      ) : (
        <div className="mt-4 flex flex-row items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            ~{formatNumberUsd(formatFloatNumber(convertedAmount || 0))}
          </p>

          <p className="text-sm text-muted-foreground">
            Available {formatFloatNumber(TOKEN_BALANCE?.amount || 0)}&nbsp;
            {displayName}
          </p>
        </div>
      )}

      {/* Supported assets info */}
      {supportedTokens && supportedTokens.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-subtle mb-2">Supported assets</p>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set(supportedTokens.map((t) => t.name))].map((name) => (
              <span
                key={name}
                className="px-2 py-1 rounded-full bg-surface-subtle text-xs font-medium text-text-subtle"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="text-2xs text-text-subtle/60 mt-2">
            On {[...new Set(supportedTokens.map((t) => t.chain_name))].join(", ")}
          </p>
        </div>
      )}
    </motion.div>
  );
}
