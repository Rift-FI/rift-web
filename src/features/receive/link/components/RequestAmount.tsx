import { useCallback } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePaymentRequest } from "../context";
import { useBackButton } from "@/hooks/use-backbutton";
import useToken from "@/hooks/data/use-token";
import useChain from "@/hooks/data/use-chain";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import { Button } from "@/components/ui/button";
import { formatNumberUsd, shortenString } from "@/lib/utils";

const amountSchema = z.object({
  amount: z.string(),
});

type AMOUNT_SCHEMA = z.infer<typeof amountSchema>;

export default function RequestAmount() {
  const { switchPaymentRequestStep, state } = usePaymentRequest();

  const reqTokenId = state?.getValues("requestToken");
  const reqTokenChainId = state?.getValues("requestTokenChain");

  const { data: TOKEN_INFO } = useToken({
    id: reqTokenId,
    chain: reqTokenChainId,
  });
  const { data: CHAIN_INFO } = useChain({ id: reqTokenChainId! });

  const goBack = () => {
    switchPaymentRequestStep("token-select");
  };

  const form = useForm<AMOUNT_SCHEMA>({
    resolver: zodResolver(amountSchema),
    defaultValues: {
      amount: "0",
    },
  });

  const AMOUNT = form.watch("amount");

  const handle_gecko_conversion = useCallback(() => {
    const { convertedAmount } = useGeckoPrice({
      base: "usd",
      token: TOKEN_INFO?.id,
      amount: parseFloat(AMOUNT),
    });
    return { convertedAmount };
  }, [AMOUNT]);

  useBackButton(goBack);

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col space-y-4"
    >
      <div className="bg-surface z-10">
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
          <div className="w-full py-3">
            <input
              className="flex border-none outline-none w-full text-foreground bg-transparent placeholder:text-muted-foreground flex-1 text-center text-3xl font-medium"
              placeholder={`1 ${TOKEN_INFO?.name}`}
              autoFocus
              inputMode="numeric"
              onChange={(e) => {
                field.onChange(e.target.value);
                state?.setValue("requestAmount", e.target.value);
              }}
            />

            <p className="text-center font-medium">
              {formatNumberUsd(handle_gecko_conversion().convertedAmount || 0)}
            </p>
          </div>
        )}
      />
    </motion.div>
  );
}
