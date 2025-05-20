import React from "react";
import TokenHeader from "./features/TokenHeader";
import BalanceContainer from "./features/BalanceContainer";
import { PriceChart } from "./features/PriceChart";

function TokenDetails() {
  return (
    <div className="">
      <TokenHeader title="Sphere" />
      <BalanceContainer
        balance="7.69"
        usdPriceChange={-7.23}
        percentPriceChange={-4.07}
      />
      <PriceChart />
    </div>
  );
}

export default TokenDetails;
