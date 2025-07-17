import { useCallback, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiArrowLeft } from "react-icons/fi";
import { Controller, useForm } from "react-hook-form";
import { useSendContext } from "../../context";
import useChain from "@/hooks/data/use-chain";
import useToken from "@/hooks/data/use-token";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useTokenBalance from "@/hooks/data/use-token-balance";
import ActionButton from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { formatFloatNumber, formatNumberUsd } from "@/lib/utils";
import { isAddressValid } from "@/utils/address-verifier";

const search = z.object({
  address: z.string(),
  amount: z.string(),
});

type Search = z.infer<typeof search>;

export default function AddressAmount() {
  const { state, switchCurrentStep } = useSendContext();

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

  const { data: TOKEN_INFO } = useToken({
    id: token,
    chain: chain,
  });
  const { data: CHAIN_INFO } = useChain({ id: chain! });
  const { data: TOKEN_BALANCE } = useTokenBalance({
    token: token!,
    chain: chain,
  });
  const { convertedAmount } = useGeckoPrice({
    token: token,
    base: "usd",
    amount: parseFloat(amount ?? 0),
  });

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

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full"
    >
      <div className="flex flex-row items-center justify-start pt-4">
        <Button
          onClick={() => switchCurrentStep("select-token")}
          variant="ghost"
          className="w-9 h-9 rounded-full bg-accent cursor-pointer"
        >
          <FiArrowLeft className="text-4xl" />
        </Button>

        <div className="flex flex-row items-end max-w-fit absolute left-1/2 -translate-x-1/2 transform text-xl font-bold capitalize text-center">
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

      <div className="w-full mt-10">
        <Controller
          control={form.control}
          name="address"
          render={({ field }) => {
            return (
              <div className="w-full flex flex-row items-center rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border">
                <input
                  {...field}
                  className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1 font-semibold"
                  placeholder={`Enter the recipient's ${TOKEN_INFO?.name} address`}
                />
              </div>
            );
          }}
        />

        {address && !ADDRESS_IS_VALID && (
          <span className="text-sm text-danger font-semibold">
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
                  className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1 font-semibold"
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
                  className="w-fit h-fit gap-0 border-0 p-[0.125rem] px-[1rem] rounded-full bg-accent cursor-pointer text-sm font-semibold"
                >
                  Max
                </ActionButton>
              </div>
            );
          }}
        />
      </div>

      {amount && Number(amount) == 0 ? (
        <span className="inline-block mt-4 text-sm text-danger font-semibold">
          Amount cannot be zero (0)
        </span>
      ) : Number(amount) > TOKEN_BALANCE?.amount! ? (
        <span className="inline-block mt-4 text-sm text-danger font-semibold">
          Insufficient {TOKEN_INFO?.name} balance
        </span>
      ) : (
        <div className="mt-4 flex flex-row items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            ~{formatNumberUsd(formatFloatNumber(convertedAmount || 0))}
          </p>

          <p className="text-sm text-muted-foreground">
            Available {formatFloatNumber(TOKEN_BALANCE?.amount || 0)}&nbsp;
            {TOKEN_INFO?.name}
          </p>
        </div>
      )}
    </motion.div>
  );
}
