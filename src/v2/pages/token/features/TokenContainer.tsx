import React, { useMemo } from "react";
import { useTokenBalance } from "@/hooks/token/useTokenBalance";
import { FaSpinner } from "react-icons/fa6";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";
// TODO: Replace with actual token logo
import logo from "@/assets/images/logos/bera.png";

interface TokenContainerProps {
  tokenID: string | undefined;
}

function TokenContainer({ tokenID }: TokenContainerProps) {
  console.log(tokenID);
  const {
    userBalanceDetails,
    isLoadingUserBalanceDetails,
    errorUserBalanceDetails,
  } = useTokenBalance(tokenID);

  const { tokenDetails, isLoadingTokenDetails, errorTokenDetails } =
    useTokenDetails(tokenID);

  const { usdPriceChangeDisplay } = useMemo(() => {
    if (!userBalanceDetails || "status" in userBalanceDetails) {
      return { usdPriceChangeDisplay: "$0", percentPriceChangeDisplay: "0%" };
    }

    const isPositive = userBalanceDetails.usdPriceChange > 0;
    if (!isPositive) {
      const usdPrice = userBalanceDetails.usdPriceChange
        .toString()
        .replace("-", "");
      const percentPrice = userBalanceDetails.percentPriceChange
        .toString()
        .replace("-", "");
      return {
        usdPriceChangeDisplay: `-$${usdPrice}`,
        percentPriceChangeDisplay: `-${percentPrice}%`,
      };
    } else {
      return {
        usdPriceChangeDisplay: `$${userBalanceDetails.usdPriceChange}`,
        percentPriceChangeDisplay: `${userBalanceDetails.percentPriceChange}%`,
      };
    }
  }, [userBalanceDetails]);

  if (!tokenID) {
    return (
      <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
        <p className="text-danger text-sm">Token ID is required</p>
      </div>
    );
  }

  if (isLoadingTokenDetails || isLoadingUserBalanceDetails) {
    return (
      <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
        <FaSpinner className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  if (errorTokenDetails || errorUserBalanceDetails) {
    return (
      <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
        <p className="text-danger text-sm">Error loading data</p>
      </div>
    );
  }

  if (
    !tokenDetails ||
    "status" in tokenDetails ||
    !userBalanceDetails ||
    "status" in userBalanceDetails
  ) {
    return (
      <div className="flex items-center justify-center mx-2 bg-accent rounded-lg p-2 py-4 h-20">
        <p className="text-danger text-sm">Error loading data</p>
      </div>
    );
  }

  const isPositive = userBalanceDetails.usdPriceChange > 0;

  return (
    <div className="flex items-center justify-between mx-2 bg-accent rounded-lg p-2 py-4">
      <div className="flex items-center gap-2">
        <img
          src={tokenDetails.imageUrl || logo}
          alt="logo"
          width={44}
          height={44}
          className="rounded-full object-cover"
        />
        <div className="flex flex-col">
          <p className="text-lg font-bold text-primary">{tokenDetails.name}</p>
          <p className="text-xs font-medium text-textsecondary">
            {userBalanceDetails.balance} {tokenDetails.symbol}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-col">
        <p className="text-xl font-bold text-primary">
          ${userBalanceDetails.usdBalance}
        </p>
        <div className="flex items-center gap-1">
          <p
            className={`text-sm font-medium ${
              isPositive ? "text-success" : "text-danger"
            }`}
          >
            {usdPriceChangeDisplay}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TokenContainer;
