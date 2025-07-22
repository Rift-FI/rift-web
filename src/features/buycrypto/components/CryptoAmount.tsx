import { ChangeEvent } from "react";
import { motion } from "motion/react";
import { useBuyCrypto } from "../context";
import { useBackButton } from "@/hooks/use-backbutton";
import useOnRamp from "@/hooks/wallet/use-on-ramp";
import useToken from "@/hooks/data/use-token";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import { MdKeyboardArrowLeft } from "react-icons/md";

export default function CryptoAmount() {
  const { state, switchCurrentStep } = useBuyCrypto();

  const selectedTokenId = state?.watch("purchaseTokenId");
  const cryptoAmount = Number(state?.watch("cryptoAmount"));

  const { USD_EXCHANGE_RATE } = useOnRamp();
  const { geckoQuery } = useGeckoPrice({ base: "usd", token: selectedTokenId });
  const { data: SELECTED_TOKEN } = useToken({ id: selectedTokenId });

  const handleKesAmount = (cryptoQty: number) => {
    const calcAmount =
      cryptoQty * Number(geckoQuery.data || 0) * USD_EXCHANGE_RATE;
    return calcAmount.toFixed(2);
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const cryptoQty = Number(e.target.value);
    state?.setValue("cryptoAmount", String(cryptoQty));
    state?.setValue("kesAmount", handleKesAmount(cryptoQty));
  };

  const goBack = () => {
    switchCurrentStep("CHOOSE-TOKEN");
  };

  useBackButton(goBack);

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full mb-10"
    >
      <button
        onClick={goBack}
        className="w-8 h-8 flex flex-row items-center justify-center mb-2 rounded-full bg-secondary cursor-pointer"
      >
        <MdKeyboardArrowLeft className="text-2xl text-text-default" />
      </button>

      <p className="text-center text-md font-medium text-md text-text-subtle mt-4">
        Buy <br />
        <span className="text-xl text-text-default font-medium">
          {SELECTED_TOKEN?.name}
        </span>
      </p>

      <div className="w-full flex flex-row items-center justify-center mt-4">
        <img
          className="w-12 h-12"
          src={SELECTED_TOKEN?.icon}
          alt={SELECTED_TOKEN?.name}
        />
      </div>

      <p className="text-sm font-medium mt-6">
        How much <span className="font-medium">{SELECTED_TOKEN?.name}</span>{" "}
        would you like to buy ?
      </p>

      <div className="w-full flex flex-row items-center rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-1">
        <input
          type="text"
          value={state?.getValues("cryptoAmount")}
          inputMode="numeric"
          className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1 font-medium"
          placeholder={`10 ${SELECTED_TOKEN?.name}`}
          onChange={handleAmountChange}
        />
      </div>

      <div className="mt-4 bg-secondary p-3 rounded-md">
        <p className="flex flex-row justify-between border-b border-surface-subtle pb-3">
          <span className="text-sm">1 {SELECTED_TOKEN?.name}</span>

          <span className="font-medium">≈ {handleKesAmount(1)} KES</span>
        </p>
        <p className="flex flex-row justify-between border-b border-surface-subtle pb-3 mt-3">
          <span className="text-sm">You'll pay</span>
          <span className="font-medium">
            {handleKesAmount(cryptoAmount || 0)} KES
          </span>
        </p>
        <p className="flex flex-row justify-between mt-3">
          <span className="text-sm">You'll receive</span>
          <span className="font-medium">
            {cryptoAmount || 0} {SELECTED_TOKEN?.name}
          </span>
        </p>
      </div>
    </motion.div>
  );
}
