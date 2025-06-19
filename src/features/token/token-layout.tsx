import React, { useMemo } from "react";
import PriceContainer from "../../v2/pages/token/features/PriceContainer";
import { PriceChart } from "../../v2/pages/token/features/PriceChart";
import Title from "../../v2/pages/token/components/Title";
import TokenContainer from "../../v2/pages/token/features/TokenContainer";
import TokenDetails from "../../v2/pages/token/features/TokenDetails";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { useToken } from "./token-context";

const ErrorFallback: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex justify-center items-center h-screen">
    <p className="text-danger">{message}</p>
  </div>
);

const TokenLayout: React.FC = () => {
  const { tokenId, chain } = useToken();
  const { data: balance } = useTokenBalance({ token: tokenId, chain: chain });

  const normalizedTokenId = useMemo(() => tokenId?.toLowerCase(), [tokenId]);

  if (!normalizedTokenId) {
    return <ErrorFallback message="Token ID is required" />;
  }

  return (
    <div className="w-full p-6">
      <PriceContainer id={tokenId} />

      <PriceChart tokenID={normalizedTokenId} />

      <Title title="Your Balance" />
      <TokenContainer tokenID={normalizedTokenId} userBalance={balance} />

      <Title title="Token Details" />
      <TokenDetails tokenID={normalizedTokenId} />
    </div>
  );
};

TokenLayout.displayName = "TokenLayout";

export default TokenLayout;
