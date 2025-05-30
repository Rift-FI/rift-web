import React, { useMemo } from "react";
import { useTokenBalance } from "@/hooks/token/useTokenBalance";
import { FaSpinner } from "react-icons/fa6";

interface BalanceContainerProps {
  id: string | undefined;
}

function BalanceContainer({ id }: BalanceContainerProps) {
  const {
    userBalanceDetails,
    isLoadingUserBalanceDetails,
    errorUserBalanceDetails,
  } = useTokenBalance(id);

  const { usdPriceChangeDisplay, percentPriceChangeDisplay } = useMemo(() => {
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

  if (isLoadingUserBalanceDetails) {
    return (
      <div className="w-full flex flex-col items-center justify center mt-16">
        <FaSpinner className="animate-spin text-primary" size={24} />
      </div>
    );
  }
  if (
    errorUserBalanceDetails ||
    !userBalanceDetails ||
    "status" in userBalanceDetails
  ) {
    return (
      <div>
        Error:{" "}
        {errorUserBalanceDetails?.message ||
          (userBalanceDetails && "status" in userBalanceDetails
            ? userBalanceDetails.message
            : "Unknown error")}
      </div>
    );
  }

  const isPositive = userBalanceDetails!.usdPriceChange > 0;

  return (
    <div className="w-full flex flex-col items-center justify center mt-16">
      <p className={`text-5xl font-bold text-primary`}>
        ${userBalanceDetails!.balance}
      </p>
      <div className="flex flex-row items-center justify-center my-2">
        <p
          className={`text-xl font-semibold text-center ${
            isPositive ? "text-success" : "text-danger"
          }`}
        >
          {usdPriceChangeDisplay}
        </p>
        <p
          className={`text-sm font-semibold mx-1 rounded-sm py.5 px-1 text-primary ${
            isPositive ? "bg-success" : "bg-danger"
          }`}
        >
          {percentPriceChangeDisplay}
        </p>
      </div>
    </div>
  );
}

export default BalanceContainer;
