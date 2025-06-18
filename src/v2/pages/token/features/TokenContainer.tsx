// import React, { useMemo } from "react";
import { useTokenPriceChange } from "@/hooks/token/useTokenBalance";
import { FaSpinner } from "react-icons/fa6";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";
import { Balance } from "@/lib/entities";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import { formatNumberUsd } from "@/lib/utils";

interface TokenContainerProps {
  tokenID: string | undefined;
  userBalance: Balance | undefined;
}

function TokenContainer({ tokenID, userBalance }: TokenContainerProps) {
  const {
    tokenPriceChange,
    isLoadingTokenPriceChange,
    errorTokenPriceChange,
  } = useTokenPriceChange(tokenID as string);

  const { convertedAmount } = useGeckoPrice({ amount: Number(userBalance?.amount), token: tokenID, base: 'usd' });

  const { tokenDetails, isLoadingTokenDetails, errorTokenDetails } =
    useTokenDetails(tokenID as string);

  // const { isPositive, usdPriceChangeDisplay, percentPriceChangeDisplay } =
  //   useMemo(() => {
  //     const isPositive = tokenPriceChange && tokenPriceChange > 0;
  //     const usdPriceChangeDisplay = `$${tokenPriceChangeUsd?.toLocaleString(
  //       undefined,
  //       {
  //         minimumFractionDigits: 2,
  //         maximumFractionDigits: 2,
  //       }
  //     )}`;
  //     const percentPriceChangeDisplay = `${tokenPriceChange?.toFixed(2)}%`;
  //     return { isPositive, usdPriceChangeDisplay, percentPriceChangeDisplay };
  //   }, [tokenPriceChange]);

  if (!tokenID) {
    return (
      <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
        <p className="text-danger text-sm">Token ID is required</p>
      </div>
    );
  }

  if (isLoadingTokenDetails || isLoadingTokenPriceChange) {
    return (
      <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
        <FaSpinner className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  if (errorTokenDetails || errorTokenPriceChange) {
    return (
      <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
        <p className="text-danger text-sm">Error loading data</p>
      </div>
    );
  }

  if (!tokenDetails || "status" in tokenDetails || !tokenPriceChange) {
    return (
      <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
        <p className="text-danger text-sm">Error loading data</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mx-2 bg-accent rounded-lg p-2 py-4">
      <div className="flex items-center gap-2">
        <img
          src={tokenDetails.image.small}
          alt="logo"
          width={44}
          height={44}
          className="rounded-full object-cover"
        />
        <div className="flex flex-col">
          <p className="text-md font-medium text-text-subtle">{tokenDetails.name}</p>
          <p className="text-lg font-bold text-primary">
            {userBalance?.amount} {tokenDetails.symbol?.toUpperCase()}
          </p>
        </div>
      </div>
      <div className="flex items-end gap-2 flex-col justify-end ">
        <p className="text-lg font-bold text-primary">
          {formatNumberUsd(convertedAmount || 0)}
        </p>
        {/* <div className="flex items-center gap-1">
          <p
            className={`text-sm font-medium ${isPositive ? "text-success" : "text-danger"
              }`}
          >
            {usdPriceChangeDisplay}
          </p>
        </div> */}
      </div>
    </div>
  );
}

export default TokenContainer;
