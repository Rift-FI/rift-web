import React, { useMemo } from "react";
import { useTokenPriceChange } from "@/hooks/token/useTokenBalance";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";

interface BalanceContainerProps {
  readonly id: string;
}

interface PriceDisplayData {
  readonly isPositive: boolean;
  readonly usdPriceChangeDisplay: string;
  readonly percentPriceChangeDisplay: string;
  readonly formattedCurrentPrice: string;
}

const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

const LoadingState: React.FC<{ className?: string }> = React.memo(
  ({ className = "" }) => (
    <div
      className={`flex justify-center items-center bg-accent p-4 mx-2 animate-pulse h-12 w-full rounded-xl ${className}`}
    />
  )
);

const ErrorState: React.FC<{ error: string }> = React.memo(({ error }) => (
  <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
    <p className="text-danger text-sm" role="alert">
      {error}
    </p>
  </div>
));

const PriceDisplay: React.FC<{
  currentPrice: string;
  priceChange: PriceDisplayData;
  isLoadingPriceChange: boolean;
}> = React.memo(({ currentPrice, priceChange, isLoadingPriceChange }) => (
  <div className="w-full flex flex-col items-center justify-center mt-16">
    <p className="text-3xl font-medium text-primary">${currentPrice}</p>

    {isLoadingPriceChange ? (
      <LoadingState className="mt-2" />
    ) : (
      <div className="flex flex-row items-center justify-center my-2">
        <p
          className={`text-lg text-center ${
            priceChange.isPositive ? "text-success" : "text-danger"
          }`}
        >
          {priceChange.usdPriceChangeDisplay}
        </p>
        <p
          className={`text-sm font-medium mx-1 rounded-sm px-3 text-primary ${
            priceChange.isPositive ? "bg-success" : "bg-danger"
          }`}
        >
          {priceChange.percentPriceChangeDisplay}
        </p>
      </div>
    )}
  </div>
));

// Custom hook for price calculations
const usePriceDisplayData = (
  tokenPriceChange: number | undefined,
  tokenPriceChangeUsd: number | undefined,
  currentPrice: number | undefined
): PriceDisplayData | null => {
  return useMemo(() => {
    if (currentPrice === undefined) return null;

    const isPositive = tokenPriceChange !== undefined && tokenPriceChange > 0;

    const usdPriceChangeDisplay =
      tokenPriceChangeUsd !== undefined
        ? `$${tokenPriceChangeUsd.toLocaleString(
            undefined,
            CURRENCY_FORMAT_OPTIONS
          )}`
        : "$0.00";

    const percentPriceChangeDisplay =
      tokenPriceChange !== undefined
        ? `${tokenPriceChange.toFixed(2)}%`
        : "0.00%";

    const formattedCurrentPrice = currentPrice.toLocaleString(
      undefined,
      CURRENCY_FORMAT_OPTIONS
    );

    return {
      isPositive,
      usdPriceChangeDisplay,
      percentPriceChangeDisplay,
      formattedCurrentPrice,
    };
  }, [tokenPriceChange, tokenPriceChangeUsd, currentPrice]);
};

const PriceContainer: React.FC<BalanceContainerProps> = ({ id }) => {
  const {
    tokenPriceChange,
    tokenPriceChangeUsd,
    isLoadingTokenPriceChange,
    errorTokenPriceChange,
  } = useTokenPriceChange(id);

  const { tokenDetails, isLoadingTokenDetails, errorTokenDetails } =
    useTokenDetails(id);

  const priceDisplayData = usePriceDisplayData(
    tokenPriceChange,
    tokenPriceChangeUsd,
    tokenDetails?.market_data?.current_price?.usd
  );

  const error = errorTokenDetails || errorTokenPriceChange;
  if (error) {
    return <ErrorState error={error.toString()} />;
  }

  if (isLoadingTokenDetails) {
    return <LoadingState />;
  }

  if (!tokenDetails || "status" in tokenDetails || !priceDisplayData) {
    return <ErrorState error="Failed to load token data" />;
  }

  return (
    <PriceDisplay
      currentPrice={priceDisplayData.formattedCurrentPrice}
      priceChange={priceDisplayData}
      isLoadingPriceChange={isLoadingTokenPriceChange}
    />
  );
};

LoadingState.displayName = "PriceContainer.LoadingState";
ErrorState.displayName = "PriceContainer.ErrorState";
PriceDisplay.displayName = "PriceContainer.PriceDisplay";
PriceContainer.displayName = "PriceContainer";

export default PriceContainer;
