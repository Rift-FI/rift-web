import { Controller } from "react-hook-form";
import { z } from "zod";
import { useSwap } from "../swap-context";
import TokenSelect from "./token-select";
import useToken from "@/hooks/data/use-token";
import useTokenBalance from "@/hooks/data/use-token-balance";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useChain from "@/hooks/data/use-chain";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import useSwapPairPricing from "@/hooks/data/use-swap-pair-pricing";
import { useEffect } from "react";

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

  const pricingQuery = useSwapPairPricing({
    from_chain: swapState.from_chain,
    to_chain: swapState.to_chain,
    from_token: swapState.from_token,
    to_token: swapState.to_token,
  });

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

  const { convertedAmount, geckoQuery } = useGeckoPrice({
    amount: AMOUNT.length > 0 ? parseFloat(AMOUNT) : 0,
    token: TOKEN,
  });

  const IS_VALID_FROM_AMOUNT =
    parseFloat(AMOUNT ?? "0") !== 0 && position == "from"
      ? parseFloat(AMOUNT ?? "0") <=
        (balanceQuery?.data?.amount ?? parseFloat("0"))
      : true;

  useEffect(() => {
    if (!pricingQuery?.isLoading && pricingQuery?.data && swapState.amount_in) {
      let inAmount = parseFloat(swapState.amount_in);
      inAmount = Number.isNaN(inAmount) ? 0 : inAmount;
      const outAmount = inAmount * (pricingQuery?.data?.price ?? 0);
      state.setValue("amount_out", `${outAmount}`);
    } else {
      state.setValue("amount_out", "0");
    }
  }, [pricingQuery?.isLoading, pricingQuery?.data, swapState.amount_in]);

  return (
    <div className="w-full flex flex-col px-5 py-5 rounded-lg bg-surface-subtle gap-2">
      <div className="w-full flex flex-row items-center justify-between text-muted-foreground font-semibold">
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
                    "w-full text-4xl font-semibold placeholder:text-muted-foreground placeholder:text-4xl border-none outline-none",
                    IS_VALID_FROM_AMOUNT ? "text-white" : "text-danger"
                  )}
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
                      src={tokenDetailsQuery?.data?.icon}
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
                  <p className="font-semibold text-lg">
                    {tokenDetailsQuery?.data?.name}
                  </p>
                  <ChevronDown />
                </div>
              );
            }}
          />
        </div>
      </div>
      <div className="w-full flex flex-row items-center justify-between text-muted-foreground text-sm font-semibold">
        <span className="px-1">
          {Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumSignificantDigits: 8,
          }).format(convertedAmount)}
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
