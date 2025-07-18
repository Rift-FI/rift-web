import { useParams, useNavigate } from "react-router";
import { openLink } from "@telegram-apps/sdk-react";
import { motion } from "motion/react";
import { MdPublic } from "react-icons/md";
import { FiArrowLeft } from "react-icons/fi";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";
import { usePlatformDetection } from "@/utils/platform";
import { Button } from "@/components/ui/button";
import { PriceChart } from "./components/PriceChart";
import PriceContainer from "./components/PriceContainer";
import TokenContainer from "./components/TokenContainer";
import TokenDetails from "./components/TokenDetails";
import Title from "./components/Title";
import { shortenString } from "@/lib/utils";

export default function TokenInfo() {
  const { tokenId, chain, balance } = useParams() as {
    tokenId: string;
    chain: string;
    balance: string;
  };
  const navigate = useNavigate();
  const { isTelegram } = usePlatformDetection();
  const { tokenDetails } = useTokenDetails(tokenId);

  const onOpenLink = () => {
    if (isTelegram) {
      openLink(tokenDetails?.links?.homepage[0] as string);
    } else {
      window.open(tokenDetails?.links?.homepage[0] as string);
    }
  };

  const onGoBack = () => {
    navigate("/app");
  };

  return (
    <motion.div
      initial={{ x: -8, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto p-4"
    >
      <div className="fixed top-0 left-0 right-0 py-3 bg-surface z-10">
        <Button
          onClick={onGoBack}
          variant="ghost"
          className="w-9 h-9 ml-2 rounded-full bg-accent cursor-pointer"
        >
          <FiArrowLeft className="text-4xl" />
        </Button>

        <span className="absolute left-1/2 -translate-x-1/2 transform text-xl font-bold capitalize text-center">
          {tokenId?.length > 18
            ? shortenString(tokenId, { leading: 8, shorten: true })
            : tokenId}
        </span>
      </div>

      <PriceContainer id={tokenId} />

      <PriceChart tokenID={tokenId} />

      <Title title="Your Balance" />
      <TokenContainer tokenID={tokenId} userBalance={parseFloat(balance)} />

      <Title title="Info" />
      <TokenDetails tokenID={tokenId} />

      <Title title="About" />
      <p className="text-md font-semibold text-text-subtle mx-2">
        {tokenDetails?.description?.en}
      </p>

      <Title title="Links" />
      <span
        onClick={onOpenLink}
        className="flex flex-row items-center justify-start gap-1 p-1 px-2 w-fit bg-secondary rounded-full text-sm font-semibold text-text-default cursor-pointer"
      >
        <MdPublic className="text-xl" /> Website
      </span>
    </motion.div>
  );
}
