import { FaSpinner } from "react-icons/fa6";
import { useTokenPriceChange } from "@/hooks/token/useTokenBalance";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import { shortenString, formatNumberUsd } from "@/lib/utils";

interface TokenContainerProps {
  tokenID: string;
  userBalance: number;
}

function TokenContainer({ tokenID, userBalance }: TokenContainerProps) {
  const { tokenPriceChange, isLoadingTokenPriceChange, errorTokenPriceChange } =
    useTokenPriceChange(tokenID as string);

  const { convertedAmount } = useGeckoPrice({
    amount: userBalance,
    token: tokenID,
    base: "usd",
  });

  const { tokenDetails, isLoadingTokenDetails, errorTokenDetails } =
    useTokenDetails(tokenID as string);

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
    <div className="flex items-center justify-between mx-2 bg-accent rounded-2xl p-2">
      <div className="flex items-center gap-2">
        <img
          src={tokenDetails.image.small}
          alt="logo"
          width={44}
          height={44}
          className="rounded-full object-cover"
        />
        <div className="flex flex-col">
          <p className="text-md font-medium text-text-subtle">
            {tokenDetails?.name?.length > 18
              ? shortenString(tokenDetails.name, { leading: 8, shorten: true })
              : tokenDetails?.name}
          </p>
          <p className="text-md font-medium text-primary">
            {userBalance?.toFixed(3)}&nbsp;
            {tokenDetails.symbol?.toUpperCase()}
          </p>
        </div>
      </div>
      <div className="flex items-end gap-2 flex-col justify-end ">
        <p className="text-md font-medium text-primary">
          {formatNumberUsd(convertedAmount || 0)}
        </p>
      </div>
    </div>
  );
}

export default TokenContainer;
