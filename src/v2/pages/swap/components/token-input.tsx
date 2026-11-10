/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import { useSwap } from "../swap-context";
import useToken from "@/hooks/data/use-token";
import useTokenBalance from "@/hooks/data/use-token-balance";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useChain from "@/hooks/data/use-chain";
import TokenSelect from "./token-select";
import { cn, formatFloatNumber, formatNumberUsd } from "@/lib/utils";

const tokenSchema = z.object({
  token: z.string(),
  amount: z.string(),
});

export type TokenSchema = z.infer<typeof tokenSchema>;

interface Props {
  position: "to" | "from";
}

export default function TokenInput(props: Props) {
  const { position } = props;
  const { state } = useSwap();
  const swapState = state.getValues();
  const TOKEN =
    position == "from" ? state.watch("from_token") : state.watch("to_token");
  const CHAIN =
    position == "from" ? state.watch("from_chain") : state.watch("to_chain");
  const AMOUNT =
    position == "from" ? state.watch("amount_in") : state.watch("amount_out");

  const tokenDetailsQuery = useToken({
    chain: CHAIN,
    id: TOKEN,
  });

  const chainQuery = useChain({
    id: CHAIN,
  });

  const balanceQuery = useTokenBalance({
    chain: CHAIN,
    token: TOKEN,
  });

  const { convertedAmount } = useGeckoPrice({
    amount: AMOUNT.length > 0 ? parseFloat(AMOUNT) : 0,
    base: "usd",
    token: TOKEN,
  });

  const IS_VALID_FROM_AMOUNT =
    parseFloat(AMOUNT ?? "0") !== 0 && position == "from"
      ? parseFloat(AMOUNT ?? "0") <=
        (balanceQuery?.data?.amount ?? parseFloat("0"))
      : true;

  useEffect(() => {
    if (position === "to") {
      // The "to" amount will be set by the LiFi quote
      state.setValue("amount_out", "0");
    }
  }, [swapState.amount_in, position]);

  return (
    <div className="w-full flex flex-col px-5 py-5 rounded-lg bg-surface-subtle gap-2">
      <div className="w-full flex flex-row items-center justify-between text-muted-foreground font-medium">
        {position == "from" ? <p>You Pay</p> : <p>You Receive</p>}
      </div>
      <div className="w-full flex flex-row items-center justify-between gap-5 ">
        <Controller
          control={state.control}
          name={position == "from" ? "amount_in" : "amount_out"}
          render={({ field }) => {
            return (
              <div>
                <input
                  {...field}
                  className={cn(
                    "w-full text-4xl font-medium placeholder:text-muted-foreground placeholder:text-4xl border-none outline-none",
                    IS_VALID_FROM_AMOUNT ? "text-white" : "text-danger"
                  )}
                  readOnly={position == "to" ? true : false}
                  type="number"
                  placeholder="0.0"
                />
              </div>
            );
          }}
        />
        <div>
          <TokenSelect
            position={position}
            renderTrigger={() => {
              return (
                <div className="px-2 py-1 rounded-full bg-surface-alt flex flex-row items-center gap-x-2 cursor-pointer">
                  <div className="w-6 h-6 relative">
                    <img
                      src={tokenDetailsQuery.data?.icon}
                      className="w-6 h-6 rounded-full"
                    />
                    {chainQuery?.data &&
                      !tokenDetailsQuery?.data?.is_native && (
                        <img
                          src={chainQuery?.data?.icon}
                          className="w-3 h-3 absolute bottom-0 right-0 rounded-full"
                        />
                      )}
                  </div>
                  <p className="font-medium text-lg">
                    {tokenDetailsQuery?.data?.name}
                  </p>
                  <ChevronDown />
                </div>
              );
            }}
          />
        </div>
      </div>
      <div className="w-full flex flex-row items-center justify-between text-muted-foreground text-sm font-medium">
        <span className="px-1">
          {formatNumberUsd(formatFloatNumber(convertedAmount))}
        </span>
        {balanceQuery?.isLoading ? (
          <div />
        ) : (
          <p>
            {balanceQuery?.data?.amount} {tokenDetailsQuery?.data?.name}
          </p>
        )}
      </div>
    </div>
  );
}
