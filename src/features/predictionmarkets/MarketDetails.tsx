import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { useMarket } from "@/hooks/prediction-markets/use-markets";
import { Button } from "@/components/ui/button";
import { dateDistance } from "@/lib/utils";

export default function PredictionMarketDetails() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const { data: MARKET_IFNO, isLoading: MARKET_LOADING } = useMarket(id);

  const onGoBack = () => {
    navigate(-1);
  };

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto p-4 pt-0"
    >
      <Button
        onClick={onGoBack}
        variant="ghost"
        className="w-9 h-9 fixed top-4 left-4 z-10 rounded-full cursor-pointer bg-accent"
      >
        <FiArrowLeft className="text-4xl text-text-subtle" />
      </Button>

      <div className="mt-14 -mx-4 px-4 pb-2 border-b-1 border-border">
        <p className="text-sm">{MARKET_IFNO?.question}</p>
        <p className="text-xs mt-1">{MARKET_IFNO?.description}</p>

        <p className="space-x-1">
          <span className="w-fit px-2 rounded-full bg-text-subtle/10 font-medium text-xs text-text-subtle">
            {MARKET_IFNO?.category}
          </span>

          <span className="ml-2 text-xs text-text-subtle">
            {dateDistance(MARKET_IFNO?.createdAt ?? "")}
          </span>

          <span className="ml-2 text-xs text-text-subtle">
            Ends {dateDistance(MARKET_IFNO?.endTime ?? "")}
          </span>
        </p>
      </div>

      <div className="mt-1"></div>
    </motion.div>
  );
}
