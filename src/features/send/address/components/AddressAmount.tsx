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
import TokenRenderer from "../../components/token-renderer";
import useAccountDeployed from "@/hooks/wallet/use-account-deployed";

const search = z.object({
  address: z.string(),
  amount: z.string(),
});

type Search = z.infer<typeof search>;

// Reserve 1% of balance to cover gas + rounding so a "Max" send doesn't fail
// at the chain level (e.g. 1.00 USDC where the wallet actually holds 0.999998).
const MAX_SEND_FRACTION = 0.99;
const computeMaxSendable = (balance: number) => {
  if (!balance || balance <= 0) return 0;
  // Floor to 6 decimals — typical stablecoin precision, avoids float artefacts.
  return Math.floor(balance * MAX_SEND_FRACTION * 1_000_000) / 1_000_000;
};

// Minimum transaction value across the app: $3 USD.
const MIN_USD_TXN = 3;
// Stablecoins where 1 token ≈ 1 USD — used so we can enforce the minimum
// instantly without waiting for a Coingecko price round-trip.
const STABLECOIN_IDS = new Set(["usd-coin", "tether"]);

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

  const maxSendable = computeMaxSendable(TOKEN_BALANCE?.amount || 0);
  const exceedsMax = Number(amount) > maxSendable + 1e-9;

  // First-time on-chain transfer covers smart-account deployment, so we only
  // enforce the $3 minimum when the user's account isn't deployed yet on this
  // chain. After deployment, any non-zero amount is allowed.
  const { isDeployed, chainLabel } = useAccountDeployed(chain);
  const requiresFirstTimeMin = isDeployed !== true;

  // USD value of the entered amount. For stables we know it's 1:1; for other
  // tokens we lean on the gecko-converted price.
  const tokenIsStable = STABLECOIN_IDS.has((token || "").toLowerCase());
  const enteredAmount = Number(amount || 0);
  const effectiveUsd = tokenIsStable ? enteredAmount : (convertedAmount || 0);
  const belowMinUsd =
    requiresFirstTimeMin &&
    enteredAmount > 0 &&
    effectiveUsd > 0 &&
    effectiveUsd < MIN_USD_TXN;

  const update_state_amount = useCallback(() => {
    if (exceedsMax || belowMinUsd) {
      // amount is invalid — leave context unset so the parent button stays disabled
    } else {
      state?.setValue("amount", amount);
    }
  }, [amount, address, exceedsMax, belowMinUsd]);

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
            {ownedTokens && ownedTokens.filter((t) => (t as any).sendable !== false).length > 0 ? (
              ownedTokens.filter((t) => (t as any).sendable !== false).map((t) => (
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
                  onClick={() => field.onChange(maxSendable.toString())}
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
      ) : belowMinUsd ? (
        <span className="inline-block mt-4 text-sm text-danger font-medium">
          First send from {chainLabel || "this network"} needs at least $
          {MIN_USD_TXN}
          {tokenIsStable ? ` (≈ ${MIN_USD_TXN.toFixed(2)} ${displayName})` : ""}
          {" "}to set up your wallet there. Receiving doesn't count. After this,
          any amount works.
        </span>
      ) : exceedsMax ? (
        <span className="inline-block mt-4 text-sm text-danger font-medium">
          Max sendable is {formatFloatNumber(maxSendable)} {displayName} (1%
          reserved for gas / rounding).
        </span>
      ) : (
        <div className="mt-4 flex flex-row items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            ~{formatNumberUsd(formatFloatNumber(convertedAmount || 0))}
          </p>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              Available {formatFloatNumber(TOKEN_BALANCE?.amount || 0)}&nbsp;
              {displayName}
            </p>
            {(TOKEN_BALANCE?.amount || 0) > 0 && (
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                Max sendable {formatFloatNumber(maxSendable)} (1% reserve)
              </p>
            )}
          </div>
        </div>
      )}

    </motion.div>
  );
}
