import React from "react";
import TokenRow from "../components/TokenRow";

interface TokenDetailsProps {
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: number;
  circulatingSupply: number;
  maxSupply?: number;
}

interface TokenRowItem {
  title: string;
  value: string | number;
}

function TokenDetails({
  symbol,
  name,
  decimals,
  totalSupply,
  circulatingSupply,
}: TokenDetailsProps) {
  const itemDetails: TokenRowItem[] = [
    {
      title: "Symbol",
      value: symbol,
    },
    {
      title: "Name",
      value: name,
    },
    {
      title: "Decimals",
      value: decimals,
    },
    {
      title: "Total Supply",
      value: totalSupply,
    },
    {
      title: "Circulating Supply",
      value: circulatingSupply,
    },
  ];
  return (
    <div className="flex flex-col gap-1 bg-accent rounded-md p-2 mx-2">
      {itemDetails.map((detail, index) => (
        <TokenRow key={index} title={detail.title} value={detail.value} />
      ))}
    </div>
  );
}

export default TokenDetails;
