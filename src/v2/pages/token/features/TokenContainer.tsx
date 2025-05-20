import React from "react";
import { colors } from "@/constants";
interface TokenContainerProps {
  tokenName: string;
  tokenImage: string;
  tokenBalance: number;
  tokenUsdBalance: number;
  tokenUsdPriceChange: number;
  tokenSymbol: string;
}

function TokenContainer({
  tokenName,
  tokenImage,
  tokenBalance,
  tokenUsdBalance,
  tokenUsdPriceChange,
  tokenSymbol,
}: TokenContainerProps) {
  const isPositive = tokenUsdPriceChange > 0;

  // Work around to display - sign before the price change
  const displayPriceChange = isPositive
    ? tokenUsdPriceChange
    : `-$${tokenUsdPriceChange.toString().slice(1)}`;

  return (
    <div className="flex items-center justify-between mx-2 bg-accent rounded-lg p-2 py-4">
      <div className="flex items-center gap-2">
        <img
          src={tokenImage}
          alt="logo"
          width={44}
          height={44}
          className="rounded-full object-cover"
        />
        <div className="flex flex-col">
          <p className="text-lg font-bold">{tokenName}</p>
          <p
            className="text-xs font-medium"
            style={{ color: colors.textsecondary }}
          >
            {tokenBalance} {tokenSymbol}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-col">
        <p className="text-xl font-bold">${tokenUsdBalance}</p>
        <p
          className="text-sm font-medium"
          style={{ color: isPositive ? colors.success : colors.danger }}
        >
          {displayPriceChange}
        </p>
      </div>
    </div>
  );
}

export default TokenContainer;
