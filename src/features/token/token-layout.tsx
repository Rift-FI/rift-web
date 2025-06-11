import React, { useMemo } from "react";
import { FaQrcode, FaRetweet } from "react-icons/fa6";
import { BsSendFill } from "react-icons/bs";
import { CiLink } from "react-icons/ci";

import { colors } from "@/constants";
import PriceContainer from "../../v2/pages/token/features/PriceContainer";
import { PriceChart } from "../../v2/pages/token/features/PriceChart";
import Title from "../../v2/pages/token/components/Title";
import TokenContainer from "../../v2/pages/token/features/TokenContainer";
import TokenDetails from "../../v2/pages/token/features/TokenDetails";
import TokenActivity from "../../v2/pages/token/features/TokenActivity";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { useToken } from "./token-context";

interface TokenActionItem {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly action?: () => void;
}

const TOKEN_ACTIONS: readonly TokenActionItem[] = [
  {
    icon: <FaQrcode color={colors.textprimary} size={24} />,
    label: "Receive",
  },
  {
    icon: <BsSendFill color={colors.textprimary} size={24} />,
    label: "Send",
  },
  {
    icon: <FaRetweet color={colors.textprimary} size={24} />,
    label: "Swap",
  },
  {
    icon: <CiLink color={colors.textprimary} size={24} />,
    label: "Link",
  },
] as const;

const ErrorFallback: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex justify-center items-center h-screen">
    <p className="text-danger">{message}</p>
  </div>
);

const TokenLayout: React.FC = () => {
  const { tokenId } = useToken();
  const { data: balance } = useTokenBalance({
    token: tokenId,
    chain: "1",
  });

  const normalizedTokenId = useMemo(() => tokenId?.toLowerCase(), [tokenId]);

  if (!normalizedTokenId) {
    return <ErrorFallback message="Token ID is required" />;
  }

  return (
    <div className="w-full max-w-lg">
      <PriceContainer id={tokenId} />

      <PriceChart tokenID={normalizedTokenId} />

      {/* Token Actions */}
      <div className="flex justify-between mx-2 mt-2 gap-2 select-none">
        {TOKEN_ACTIONS.map((action) => (
          <button
            key={action.label}
            className="w-24 h-24 rounded-lg items-center justify-center bg-accent flex flex-col gap-2 hover:bg-accent/80 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-secondary"
            onClick={action.action}
            aria-label={action.label}
          >
            {action.icon}
            <p className="text-sm font-medium">{action.label}</p>
          </button>
        ))}
      </div>

      <Title title="Your Balance" />
      <TokenContainer tokenID={normalizedTokenId} userBalance={balance} />

      <Title title="Token Details" />
      <TokenDetails tokenID={normalizedTokenId} />

      <Title title="Activity" />
      <TokenActivity tokenID={normalizedTokenId} />
    </div>
  );
};

TokenLayout.displayName = "TokenLayout";

export default TokenLayout;
