import { useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoClock } from "react-icons/go";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { useSendContext } from "../../context";
import useToken from "@/hooks/data/use-token";
import useChain from "@/hooks/data/use-chain";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { useBackButton } from "@/hooks/use-backbutton";
import { Button } from "@/components/ui/button";
import useAccountDeployed from "@/hooks/wallet/use-account-deployed";
import {
  cn,
  formatFloatNumber,
  formatNumberUsd,
  shortenString,
} from "@/lib/utils";
import ActionButton from "@/components/ui/action-button";

const amountSchema = z.object({
  amount: z.string(),
  duration: z.enum(["30m", "1h", "2h", "1d"]),
});

type AMOUNT_SCHEMA = z.infer<typeof amountSchema>;

// Reserve 1% of balance to cover gas + rounding so a "Max" send doesn't fail
// at the chain level.
const MAX_SEND_FRACTION = 0.99;
const computeMaxSendable = (balance: number) => {
  if (!balance || balance <= 0) return 0;
  return Math.floor(balance * MAX_SEND_FRACTION * 1_000_000) / 1_000_000;
};

// Minimum transaction value across the app: $3 USD.
const MIN_USD_TXN = 3;
const STABLECOIN_IDS = new Set(["usd-coin", "tether"]);

export default function SendAmount() {
  const { state, switchCurrentStep } = useSendContext();

  const SEND_TOKEN_ID = state?.getValues("token");
  const SEND_TOKEN_CHAIN_ID = state?.getValues("chain");

  const { data: TOKEN_INFO } = useToken({
    id: SEND_TOKEN_ID,
    chain: SEND_TOKEN_CHAIN_ID,
  });
  const { data: CHAIN_INFO } = useChain({ id: SEND_TOKEN_CHAIN_ID! });
  const { data: TOKEN_BALANCE } = useTokenBalance({
    token: SEND_TOKEN_ID!,
    chain: SEND_TOKEN_CHAIN_ID!,
  });
  const { convertedAmount: TOKEN_USD_BALANCE } = useGeckoPrice({
    base: "usd",
    amount: TOKEN_BALANCE?.amount,
    token: TOKEN_INFO?.id,
  });

  const goBack = () => {
    switchCurrentStep("select-token");
  };

  const form = useForm<AMOUNT_SCHEMA>({
    resolver: zodResolver(amountSchema),
    defaultValues: {
      amount: "0",
      duration: "30m",
    },
  });

  const AMOUNT = form.watch("amount");
  const DURATION = form.watch("duration");

  const handle_gecko_conversion = useCallback(() => {
    const { convertedAmount } = useGeckoPrice({
      base: "usd",
      token: TOKEN_INFO?.id,
      amount: parseFloat(AMOUNT),
    });
    return { convertedAmount };
  }, [AMOUNT]);

  const maxSendable = computeMaxSendable(TOKEN_BALANCE?.amount || 0);
  const exceedsMax = Number(AMOUNT) > maxSendable + 1e-9;

  // Only enforce the $3 minimum on the user's first transfer on this chain.
  const { isDeployed, chainLabel } = useAccountDeployed(SEND_TOKEN_CHAIN_ID);
  const requiresFirstTimeMin = isDeployed !== true;

  const tokenIsStable = STABLECOIN_IDS.has((SEND_TOKEN_ID || "").toLowerCase());
  const enteredAmount = Number(AMOUNT || 0);
  const usdValue = tokenIsStable
    ? enteredAmount
    : handle_gecko_conversion().convertedAmount || 0;
  const belowMinUsd =
    requiresFirstTimeMin &&
    enteredAmount > 0 &&
    usdValue > 0 &&
    usdValue < MIN_USD_TXN;

  const update_state_amount = useCallback(() => {
    if (exceedsMax || belowMinUsd) {
      // amount is invalid — leave context unset
    } else {
      state?.setValue("amount", AMOUNT);
    }
  }, [AMOUNT, exceedsMax, belowMinUsd]);

  useEffect(() => {
    update_state_amount();
  }, [AMOUNT]);

  useBackButton(goBack);

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="overflow-y-auto"
    >
      <div>
        <Button
          onClick={goBack}
          variant="ghost"
          className="w-9 h-9 rounded-full cursor-pointer bg-accent"
        >
          <FiArrowLeft className="text-4xl" />
        </Button>

        <span className="absolute left-1/2 -translate-x-1/2 transform text-xl font-medium capitalize text-center">
          {TOKEN_INFO?.id!?.length > 18
            ? shortenString(TOKEN_INFO?.id!, { leading: 8, shorten: true })
            : TOKEN_INFO?.id}
        </span>
      </div>

      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-row items-end max-w-fit">
          <img
            src={TOKEN_INFO?.icon}
            alt={TOKEN_INFO?.name}
            className="w-14 h-14 rounded-full"
          />
          <img
            src={CHAIN_INFO?.icon}
            alt={CHAIN_INFO?.name}
            className="w-6 h-6 -translate-x-4 translate-y-1 rounded-full"
          />
        </div>
      </div>

      <Controller
        control={form.control}
        name="amount"
        render={({ field }) => (
          <div className="w-full py-3 pb-0">
            <input
              {...field}
              className="flex border-none outline-none w-full text-foreground bg-transparent placeholder:text-muted-foreground flex-1 text-center text-3xl font-medium"
              placeholder={`1 ${TOKEN_INFO?.name}`}
              autoFocus
              inputMode="numeric"
            />

            <p className="text-center text-sm">
              {formatNumberUsd(
                formatFloatNumber(
                  handle_gecko_conversion().convertedAmount || 0
                )
              )}
              &nbsp;
              <span
                className={cn(
                  "font-medium text-[1.125rem]",
                  exceedsMax && "text-danger"
                )}
              >
                / {formatNumberUsd(formatFloatNumber(TOKEN_USD_BALANCE || 0))}
              </span>
            </p>
            {belowMinUsd && (
              <p className="text-center text-[12px] text-danger font-medium mt-1 px-4">
                First send from {chainLabel || "this network"} needs at least $
                {MIN_USD_TXN} to set up your wallet there. Receiving doesn't
                count. After this, any amount works.
              </p>
            )}
          </div>
        )}
      />

      <div className="w-full mt-2 flex flex-col items-center justify-center gap-1">
        <ActionButton
          onClick={() => form.setValue("amount", maxSendable.toString())}
          variant="ghost"
          className="w-fit h-fit gap-0 border-0 p-[0.125rem] px-[1rem] rounded-full bg-accent cursor-pointer text-sm font-medium"
        >
          Max
        </ActionButton>
        {(TOKEN_BALANCE?.amount || 0) > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Max sendable {formatFloatNumber(maxSendable)} {TOKEN_INFO?.name} (1% reserve)
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 flex flex-col border-t-2 border-app-background">
        <span className="font-medium">Link Access Time</span>
        <span className="text-sm font-light">
          Set a duration when the link will be valid
        </span>
      </div>

      <div className="flex flex-row flex-wrap gap-2 items-start justify-between mt-4">
        <DurationPicker
          time="30 Min"
          isActive={DURATION == "30m"}
          onclick={() => {
            form.setValue("duration", "30m");
            state?.setValue("linkduration", "30m");
          }}
        />
        <DurationPicker
          time="1 Hour"
          isActive={DURATION == "1h"}
          onclick={() => {
            form.setValue("duration", "1h");
            state?.setValue("linkduration", "1h");
          }}
        />
        <DurationPicker
          time="2 Hours"
          isActive={DURATION == "2h"}
          onclick={() => {
            form.setValue("duration", "2h");
            state?.setValue("linkduration", "2h");
          }}
        />
        <DurationPicker
          time="1 Day"
          isActive={DURATION == "1d"}
          onclick={() => {
            form.setValue("duration", "1d");
            state?.setValue("linkduration", "24h");
          }}
        />
      </div>
    </motion.div>
  );
}

const DurationPicker = ({
  time,
  isActive,
  onclick,
}: {
  time: string;
  isActive: boolean;
  onclick: () => void;
}) => {
  return (
    <div
      onClick={onclick}
      className={cn(
        "w-[48%] h-[5rem] flex flex-col items-start justify-between p-2 bg-accent/50 border-1 border-border rounded-md cursor-pointer",
        isActive && "border-accent-foreground/5 bg-accent/80"
      )}
    >
      <GoClock className="text-accent-primary" />

      <div className="w-full flex flex-row items-center justify-between">
        <span
          className={cn(
            "font-medium text-text-subtle",
            isActive && "text-text-default"
          )}
        >
          {time}
        </span>
        <IoIosCheckmarkCircle
          className={cn("text-muted w-5 h-5", isActive && "text-success")}
        />
      </div>
    </div>
  );
};
