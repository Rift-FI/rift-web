import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import TokenInput from "./components/token-input";
import SwapContextProvider, { useSwap } from "./swap-context";
import { useState, useEffect } from "react";
import SwapSummary from "./components/swap-summary";
import { analyticsLog } from "@/analytics/events";
import { usePlatformDetection } from "@/utils/platform";

function SwapContent() {
  const { state } = useSwap();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fromFirst, setFromFirst] = useState(false);

  function handleSwap() {
    const stored = state.getValues();
    state.setValue("from_token", stored.to_token);
    state.setValue("to_token", stored.from_token);
    state.setValue("from_chain", stored.to_chain);
    state.setValue("to_chain", stored.from_chain);
    state.setValue("amount_in", stored.amount_out);
    state.setValue("amount_out", stored.amount_in);
    setFromFirst((f) => !f);
  }
  return (
    <div className="w-full h-[90vh] flex flex-col items-center gap-5 overflow-y-scroll px-5">
      <div className="flex flex-row items-center justify-between py-5 w-full ">
        <div />
        <div>
          <p className="font-semibold text-white text-xl">Swap Tokens</p>
        </div>
        <div>
          {/* TODO: work on config page drawer */}
          <div className="flex flex-col items-center justify-center cursor-pointer active:scale-95 ">
            <SlidersHorizontal />
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col ">
        <TokenInput position="from" />
        <div className="w-full py-1 relative" onClick={handleSwap}>
          <div className="flex flex-row items-center justify-center cursor-pointer absolute left-[50%] top-[50%] -translate-x-3.5 -translate-y-3.5 bg-accent-secondary p-2 rounded-full active:animate-rotate-180">
            <ArrowUpDown size={20} />
          </div>
        </div>
        <TokenInput position="to" />
      </div>

      <SwapSummary />
    </div>
  );
}

export default function Swap() {
  const { telegramUser } = usePlatformDetection();

  useEffect(() => {
    // Track page visit
    const telegramId = telegramUser?.id?.toString() || "UNKNOWN USER";
    analyticsLog("PAGE_VISIT", { telegram_id: telegramId });
  }, [telegramUser]);

  return (
    <SwapContextProvider>
      <SwapContent />
    </SwapContextProvider>
  );
}
