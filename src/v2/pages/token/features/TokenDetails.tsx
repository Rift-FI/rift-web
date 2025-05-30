import React from "react";
import { FaSpinner } from "react-icons/fa6";
import TokenRow from "../components/TokenRow";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";

interface TokenDetailsProps {
  tokenID: string | undefined;
}

interface TokenRowItem {
  title: string;
  value: string | number;
}

function TokenDetails({ tokenID }: TokenDetailsProps) {
  const { tokenDetails, isLoadingTokenDetails, errorTokenDetails } =
    useTokenDetails(tokenID);

  if (!tokenID) {
    return (
      <div className="flex justify-center items-center bg-accent rounded-md p-4 mx-2">
        <p className="text-danger text-sm">Token ID is required</p>
      </div>
    );
  }

  if (isLoadingTokenDetails) {
    return (
      <div className="flex justify-center items-center bg-accent rounded-md p-4 mx-2">
        <FaSpinner className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  if (errorTokenDetails || !tokenDetails || "status" in tokenDetails) {
    return (
      <div className="flex justify-center items-center bg-accent rounded-md p-4 mx-2">
        <p className="text-danger text-sm">Error loading token details</p>
      </div>
    );
  }

  const itemDetails: TokenRowItem[] = [
    {
      title: "Symbol",
      value: tokenDetails.symbol,
    },
    {
      title: "Name",
      value: tokenDetails.name,
    },
    {
      title: "Decimals",
      value: tokenDetails.decimals,
    },
    {
      title: "Total Supply",
      value: tokenDetails.totalSupply.toLocaleString(),
    },
    {
      title: "Circulating Supply",
      value: tokenDetails.circulatingSupply.toLocaleString(),
    },
    {
      title: "Max Supply",
      value: tokenDetails.maxSupply.toLocaleString(),
    },
  ];

  return (
    <div className="flex flex-col gap-1 bg-accent rounded-md p-2 mx-2">
      {itemDetails.map((detail, index) => (
        <div
          key={index}
          className="border-b border-gray-600"
          style={{
            borderBottomWidth: itemDetails.length - 1 === index ? 0 : "0.5px",
          }}
        >
          <TokenRow title={detail.title} value={detail.value} />
        </div>
      ))}
    </div>
  );
}

export default TokenDetails;
