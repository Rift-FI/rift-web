import React from "react";
import TokenHeader from "./features/TokenHeader";
import BalanceContainer from "./features/BalanceContainer";
import { PriceChart } from "./features/PriceChart";
import TokenActions from "./features/TokenActions";
import Title from "./components/Title";
import TokenContainer from "./features/TokenContainer";
import dummyTokenLogo from "@/assets/images/logos/bera.png";
import TokenDetails from "./features/TokenDetails";

function Token() {
  return (
    <div className="">
      <TokenHeader title="Sphere" />
      <BalanceContainer
        balance="7.69"
        usdPriceChange={-7.23}
        percentPriceChange={-4.07}
      />
      <PriceChart />
      <TokenActions />
      <Title title="Your Balance" />
      <TokenContainer
        tokenName="Sphere"
        tokenImage={dummyTokenLogo}
        tokenBalance={7.69}
        tokenUsdBalance={7.69}
        tokenUsdPriceChange={-7.23}
        tokenSymbol="SPHERE"
      />
      <Title title="Token Details" />
      <TokenDetails
        symbol="SPHERE"
        name="Sphere"
        decimals={18}
        totalSupply={1000000000}
        circulatingSupply={1000000000}
        maxSupply={1000000000}
      />
    </div>
  );
}

export default Token;
