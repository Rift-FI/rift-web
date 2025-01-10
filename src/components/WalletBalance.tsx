import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Skeleton } from "@mui/material";
import { walletBalance, uSdTBalance } from "../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../utils/ethusd";
import { formatUsd } from "../utils/formatters";
import btclogo from "../assets/images/btc.png";
import ethlogo from "../assets/images/eth.png";
import usdclogo from "../assets/images/labs/usdc.png";
import "../styles/components/walletbalance.css";

export const WalletBalance = (): JSX.Element => {
  const navigate = useNavigate();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [accBalance, setAccBalance] = useState<number>(0);
  const [btcAccBalance, setBtcAccAccBalance] = useState<number>(0);
  const [btcAccBalanceUsd, setBtcAccAccBalanceUsd] = useState<number>(0);
  const [usdtAccBalance, setusdtAccBalance] = useState<number>(0);
  const [amountInUsd, setAmountInUsd] = useState<number>(0);

  const getWalletBalance = useCallback(async () => {
    setAccBalLoading(true);

    let access: string | null = localStorage.getItem("token");

    const { btcBalance, balance } = await walletBalance(access as string);
    const { ethInUSD, ethValue } = await getEthUsdVal(Number(balance));
    const { btcQtyInUSD } = await getBtcUsdVal(Number(btcBalance));
    const { data } = await uSdTBalance(access as string);

    setAccBalance(Number(balance));
    setBtcAccAccBalance(btcBalance);
    setusdtAccBalance(Number(data?.balance));

    setBtcAccAccBalanceUsd(btcQtyInUSD);
    setAmountInUsd(ethInUSD);

    localStorage.setItem("btcbal", String(btcBalance));
    localStorage.setItem("btcbalUsd", String(btcQtyInUSD));
    localStorage.setItem("ethbal", balance);
    localStorage.setItem("ethbalUsd", String(ethInUSD));
    localStorage.setItem("usdtbal", data?.balance);
    localStorage.setItem("ethvalue", String(ethValue));

    setAccBalLoading(false);
  }, []);

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
    compactDisplay: "short",
    unitDisplay: "short",
  });

  useEffect(() => {
    getWalletBalance();
  }, []);

  return (
    <div id="walletbalance">
      <p className="bal">Your Balance</p>

      <p className="balinusd">
        {accBalLoading ? (
          <Skeleton
            variant="text"
            width="50%"
            height="2.5rem"
            animation="wave"
          />
        ) : (
          `${usdFormatter.format(
            btcAccBalanceUsd + amountInUsd + usdtAccBalance
          )}`
        )}
      </p>

      {accBalLoading ? (
        <>
          <Skeleton
            variant="text"
            width="100%"
            height="3.75rem"
            animation="wave"
          />
          <Skeleton
            variant="text"
            width="100%"
            height="3.75rem"
            animation="wave"
          />
          <Skeleton
            variant="text"
            width="100%"
            height="3.75rem"
            animation="wave"
          />
        </>
      ) : (
        <>
          <div className="_asset" onClick={() => navigate("/btc-asset")}>
            <div>
              <img src={btclogo} alt="btc" />

              <p>
                Bitcoin
                <span>BTC</span>
              </p>
            </div>

            <p className="balance">
              <span>{btcAccBalance?.toFixed(8)}</span>

              <span className="fiat">
                {formatUsd(Number(localStorage.getItem("btcbalUsd")))}
              </span>
            </p>
          </div>

          <div className="_asset" onClick={() => navigate("/eth-asset")}>
            <div>
              <img src={ethlogo} alt="btc" />

              <p>
                Ethereum
                <span>ETH</span>
              </p>
            </div>

            <p className="balance">
              <span>{accBalance?.toFixed(8)}</span>

              <span className="fiat">
                {formatUsd(Number(localStorage.getItem("ethbalUsd")))}
              </span>
            </p>
          </div>

          <div className="_asset" onClick={() => navigate("/usdt-asset")}>
            <div>
              <img src={usdclogo} alt="btc" />

              <p>
                USD Coin
                <span>USDC</span>
              </p>
            </div>

            <p className="balance">
              <span>{usdtAccBalance}</span>

              <span className="fiat">
                {formatUsd(Number(localStorage.getItem("usdtbal")))}
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};
