import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { useMarket } from "@/hooks/prediction-markets/use-markets";
import { useP2PListings } from "@/hooks/prediction-markets/use-p-to-p";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useBackButton } from "@/hooks/use-backbutton";
import { Button } from "@/components/ui/button";
import {
  cn,
  dateDistance,
  formatFloatNumber,
  shortenString,
} from "@/lib/utils";
import Title from "../token/components/Title";
import TokenRow from "../token/components/TokenRow";
import ActionButton from "@/components/ui/action-button";
import BuyMarket from "./components/BuyMarket";

export default function PredictionMarketDetails() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const { data: MARKET_IFNO, isLoading: MARKET_LOADING } = useMarket(id);
  const { data: PTOP_LISTINGS } = useP2PListings(id);
  const buy_yes_market_disclosure = useDisclosure();
  const buy_no_market_disclosure = useDisclosure();

  const onGoBack = () => {
    navigate(-1);
  };

  useBackButton(onGoBack);

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto p-4 pt-0 mb-12"
    >
      <Button
        onClick={onGoBack}
        variant="ghost"
        className="w-9 h-9 fixed top-4 left-4 z-10 rounded-full cursor-pointer bg-accent"
      >
        <FiArrowLeft className="text-4xl text-text-subtle" />
      </Button>

      <div className="mt-18 -mx-4 px-4 pb-2">
        <p className="text-sm">{MARKET_IFNO?.question}</p>
        <p className="text-xs mt-1">{MARKET_IFNO?.description}</p>
      </div>

      <Title title="Market Statistics" ctrClassName="mt-2 mx-0" />

      <div className="flex flex-col rounded-2xl bg-accent">
        <div className="border-b-1 border-app-background">
          <TokenRow
            title="Total Staked"
            value={
              formatFloatNumber(
                MARKET_IFNO?.metrics?.totalStake || 0
              ).toString() + " rETH"
            }
          />
        </div>
        <div className="border-b-1 border-app-background">
          <TokenRow
            title="Participants"
            value={MARKET_IFNO?.participantCount?.toString() ?? ""}
          />
        </div>
        <div className="border-b-1 border-app-background">
          <TokenRow
            title="Liquidity Score"
            value={MARKET_IFNO?.metrics?.liquidityScore ?? ""}
          />
        </div>
        <div className="border-b-1 border-app-background">
          <TokenRow
            title="Created"
            value={dateDistance(MARKET_IFNO?.createdAt ?? "")}
          />
        </div>
        <div>
          <TokenRow
            title="Ends"
            value={dateDistance(MARKET_IFNO?.endTime ?? "")}
          />
        </div>
      </div>

      <Title title="Price" ctrClassName="mt-2 mx-0" />

      <div className="mt-2 rounded-2xl bg-accent">
        <div className="border-b-1 border-app-background">
          <TokenRow
            title="Yes"
            value={`${MARKET_IFNO?.metrics?.yesPrice ?? 0} rETH`}
          />
        </div>

        <TokenRow
          title="No"
          value={`${MARKET_IFNO?.metrics?.noPrice ?? 0} rETH`}
        />
      </div>

      <Title title="Outcome" ctrClassName="mt-2 mx-0" />

      <div className="mt-2 rounded-2xl bg-accent">
        <div className="border-b-1 border-app-background">
          <TokenRow
            title="Yes %"
            value={`${MARKET_IFNO?.metrics?.yesPercentage ?? 0}%`}
          />
        </div>

        <div className="border-b-1 border-app-background">
          <TokenRow
            title="No %"
            value={`${MARKET_IFNO?.metrics?.noPercentage ?? 0}%`}
          />
        </div>

        <TokenRow
          title="Outcome"
          value={
            MARKET_IFNO?.outcome ? `${MARKET_IFNO?.outcome}` : "Not Resolved"
          }
        />
      </div>

      <Title
        title={`Participants (${MARKET_IFNO?.participants?.length || 0})`}
        ctrClassName="mt-2 mx-0"
      />

      <div className="flex flex-col rounded-2xl bg-accent">
        {MARKET_IFNO?.participants?.map((_addr, idx) => (
          <div
            key={idx}
            className={cn(
              "border-b-1 border-app-background",
              idx == (MARKET_IFNO?.participants?.length || 0) - 1 &&
                "border-b-0"
            )}
          >
            <TokenRow title={`#${idx + 1}`} value={shortenString(_addr)} />
          </div>
        ))}
      </div>

      <Title
        title={`P2P Listings (${PTOP_LISTINGS?.length || 0})`}
        ctrClassName="mt-2 mx-0"
      />

      <div className="flex flex-col rounded-2xl bg-accent">
        {PTOP_LISTINGS?.map((_listing, idx) => (
          <div
            key={idx}
            className={cn(
              "border-b-1 border-app-background",
              idx == (PTOP_LISTINGS?.length || 0) - 1 && "border-b-0"
            )}
          >
            <TokenRow
              title={`#${idx + 1} ${shortenString(_listing?.listing?.seller)}`}
              value={_listing?.listing?.askPrice}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <BuyMarket
          {...buy_yes_market_disclosure}
          marketId={id}
          position="Yes"
          renderTrigger={() => (
            <ActionButton variant="success" className="p-[0.5rem] border-0">
              Buy Yes
            </ActionButton>
          )}
        />

        <BuyMarket
          {...buy_no_market_disclosure}
          marketId={id}
          position="No"
          renderTrigger={() => (
            <ActionButton
              variant="danger"
              className="p-[0.5rem] font-medium border-0"
            >
              Buy No
            </ActionButton>
          )}
        />
      </div>
    </motion.div>
  );
}
