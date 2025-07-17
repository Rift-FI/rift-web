import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowUpDown } from "lucide-react";
import SwapContextProvider, { useSwap } from "./swap-context";
import useAnalaytics from "@/hooks/use-analytics";
import TokenInput from "./components/token-input";
import SwapSummary from "./components/swap-summary";

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
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-[90vh] flex flex-col items-center gap-5 overflow-y-scroll pt-4 px-5"
    >
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
    </motion.div>
  );
}

export default function Swap() {
  const { logEvent } = useAnalaytics();

  useEffect(() => {
    logEvent("PAGE_VISIT_SWAP");
  }, [logEvent]);

  return (
    <SwapContextProvider>
      <SwapContent />
    </SwapContextProvider>
  );
}
