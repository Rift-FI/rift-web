import { motion } from "motion/react";
import useTokens from "@/hooks/data/use-tokens";
import { useBuyCrypto } from "../context";
import { WalletToken } from "@/lib/entities";
import { shortenString } from "@/lib/utils";

export default function CryptoPicker() {
  const { data: TOKENS } = useTokens({});

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full mb-10"
    >
      <p className="font-medium text-md text-text-subtle">Available Tokens</p>

      <div className="mt-3 space-y-2">
        {TOKENS?.filter((_token) => _token?.onramp_id)?.map((_asset, idx) => (
          <TokenCtr key={_asset?.id + idx} {..._asset} />
        ))}
      </div>
    </motion.div>
  );
}

const TokenCtr = (token: WalletToken) => {
  const { state, switchCurrentStep } = useBuyCrypto();

  return (
    <div
      onClick={() => {
        state?.setValue("purchaseToken", token?.onramp_id);
        state?.setValue("purchaseTokenId", token?.id);
        switchCurrentStep("CRYPTO-AMOUNT");
      }}
      className="bg-secondary p-2 rounded-xl cursor-pointer flex flex-row items-center justify-start gap-2"
    >
      <img src={token?.icon} alt="usdc" className="w-10 h-10" />
      <p className="flex flex-col text-md font-medium">
        {token?.name}
        <span className="text-sm text-gray-500">
          {token?.description.length > 18
            ? shortenString(token?.description, { trailing: 6 })
            : token?.description}
        </span>
      </p>
    </div>
  );
};
