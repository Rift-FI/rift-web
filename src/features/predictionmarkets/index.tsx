import { useMemo } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiArrowLeft } from "react-icons/fi";
import { useMarkets } from "@/hooks/prediction-markets/use-markets";
import { useBackButton } from "@/hooks/use-backbutton";
import { Button } from "@/components/ui/button";
import MarketPreview from "./components/MarketPreview";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  subjectfilter: z.enum(["all", "politics", "sports", "crypto"]),
});

type SEARCH_SCHEMA = z.infer<typeof searchSchema>;

export default function PredictionMarkets() {
  const navigate = useNavigate();
  const { data: ALL_MARKETS } = useMarkets();

  const search_form = useForm<SEARCH_SCHEMA>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      subjectfilter: "all",
    },
  });

  const SUBJECT = search_form.watch("subjectfilter");

  const onGoBack = () => {
    navigate("/app/explore");
  };

  const MARKETS = useMemo(() => {
    if (SUBJECT == "all") return ALL_MARKETS;

    const filtered_markets = ALL_MARKETS?.filter(
      (_market) => _market?.category?.toLocaleLowerCase() === SUBJECT
    );

    return filtered_markets ?? [];
  }, [SUBJECT]);

  useBackButton(onGoBack);

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto p-4 px-0"
    >
      <div className="flex flex-row items-center justify-between fixed top-0 left-0 right-0 p-2 bg-surface z-10">
        <Button
          onClick={onGoBack}
          variant="ghost"
          className="w-9 h-9 rounded-full cursor-pointer bg-accent/50"
        >
          <FiArrowLeft className="text-4xl text-text-subtle" />
        </Button>

        <span className="absolute left-1/2 -translate-x-1/2 transform text-sm font-semibold">
          Prediction Markets
        </span>
      </div>

      <div className="flex flex-row flex-nowrap items-center justify-start overflow-x-auto gap-2 mt-10 px-3">
        <Button
          onClick={() => search_form.setValue("subjectfilter", "all")}
          variant="ghost"
          size="sm"
          className={cn(
            "w-fit rounded-full cursor-pointer bg-accent/35",
            SUBJECT == "all" && "bg-accent"
          )}
        >
          All Markets ({ALL_MARKETS?.length ?? 0})
        </Button>

        <Button
          onClick={() => search_form.setValue("subjectfilter", "politics")}
          variant="ghost"
          size="sm"
          className={cn(
            "w-fit rounded-full cursor-pointer bg-accent/35",
            SUBJECT == "politics" && "bg-accent"
          )}
        >
          Politics (
          {ALL_MARKETS?.filter(
            (_market) => _market?.category?.toLowerCase() == "politics"
          )?.length ?? 0}
          )
        </Button>

        <Button
          onClick={() => search_form.setValue("subjectfilter", "sports")}
          variant="ghost"
          size="sm"
          className={cn(
            "w-fit rounded-full cursor-pointer bg-accent/35",
            SUBJECT == "sports" && "bg-accent"
          )}
        >
          Sports (
          {ALL_MARKETS?.filter(
            (_market) => _market?.category?.toLowerCase() == "sports"
          )?.length ?? 0}
          )
        </Button>

        <Button
          onClick={() => search_form.setValue("subjectfilter", "crypto")}
          variant="ghost"
          size="sm"
          className={cn(
            "w-fit rounded-full cursor-pointer bg-accent/35",
            SUBJECT == "crypto" && "bg-accent"
          )}
        >
          Crypto (
          {ALL_MARKETS?.filter(
            (_market) => _market?.category?.toLowerCase() == "crypto"
          )?.length ?? 0}
          )
        </Button>
      </div>

      <div className="w-full mt-2">
        {MARKETS?.map((_market, idx) => (
          <MarketPreview key={_market?.id + idx} marketId={_market?.id} />
        ))}
      </div>
    </motion.div>
  );
}
