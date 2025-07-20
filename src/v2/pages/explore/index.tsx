import { Fragment } from "react";
import { motion } from "motion/react";
import { useMarkets } from "@/hooks/prediction-markets/use-markets";
import ChatBot from "../home/components/ChatBot";
import MarketPreview from "./components/MarketPreview";

export default function Explore() {
  const { data: MARKETS, isLoading: MARKETS_LOADING } = useMarkets();

  return (
    <Fragment>
      <motion.div
        initial={{ x: -4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full h-full overflow-y-auto mb-18 p-4"
      >
        <div className="flex flex-row items-center justify-between">
          <p className="text-sm font-semibold">Prediction Markets</p>
          <span className="text-accent-primary text-sm font-medium">
            See More
          </span>
        </div>

        <div className="w-full bg-accent pb-2 mt-2 rounded-lg">
          {MARKETS?.slice(0, 4)?.map((_market, idx) => (
            <MarketPreview
              key={_market?.id + idx}
              marketId={_market?.id}
              isLast={idx == MARKETS?.length - 1}
            />
          ))}
        </div>
      </motion.div>

      <ChatBot />
    </Fragment>
  );
}
