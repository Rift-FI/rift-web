import {
  Dispatch,
  JSX,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { Skeleton } from "@mui/material";
import { walletBalance, uSdTBalance } from "../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../utils/ethusd";
import { ArrowRight } from "../assets/icons";
import { colors } from "../constants";
import "../styles/components/walletbalance.css";

interface props {
  refreshing: boolean;
  setRefreshing: Dispatch<SetStateAction<boolean>>;
}

export const WalletBalance = ({
  refreshing,
  setRefreshing,
}: props): JSX.Element => {
  const navigate = useNavigate();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [accBalance, setAccBalance] = useState<number>(0);
  const [btcAccBalance, setBtcAccAccBalance] = useState<number>(0);
  const [btcAccBalanceUsd, setBtcAccAccBalanceUsd] = useState<number>(0);
  const [usdtAccBalance, setusdtAccBalance] = useState<number>(0);
  const [amountInUsd, setAmountInUsd] = useState<number>(0);

  const getWalletBalance = useCallback(async () => {
    if (refreshing == true) {
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
      setRefreshing(false);

      localStorage.setItem("shouldRefetchbalances", "false");
    } else {
      let btcbal = localStorage.getItem("btcbal");
      let btcbalUsd = localStorage.getItem("btcbalUsd");
      let ethbal = localStorage.getItem("ethbal");
      let ethbalUsd = localStorage.getItem("ethbalUsd");
      let usdtbal = localStorage.getItem("usdtbal");

      setAccBalance(Number(ethbal));
      setBtcAccAccBalance(Number(btcbal));
      setusdtAccBalance(Number(usdtbal));

      setBtcAccAccBalanceUsd(Number(btcbalUsd));
      setAmountInUsd(Number(ethbalUsd));
    }
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
  }, [refreshing]);

  return (
    <div id="walletbalance">
      <p className="bal">Your Balance</p>

      <p className="balinusd">
        {accBalLoading ? (
          <Skeleton variant="text" width="50%" animation="wave" />
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
            height="2.5rem"
            animation="wave"
          />
          <Skeleton
            variant="text"
            width="100%"
            height="2.5rem"
            animation="wave"
          />
          <Skeleton
            variant="text"
            width="100%"
            height="2.5rem"
            animation="wave"
          />
        </>
      ) : (
        <>
          <p className="_asset" onClick={() => navigate("/btc-asset")}>
            <span>
              {btcAccBalance?.toFixed(8)}
              &nbsp;BTC
            </span>
            <ArrowRight color={colors.textsecondary} />
          </p>
          <p className="_asset" onClick={() => navigate("/eth-asset")}>
            <span>
              {accBalance?.toFixed(8)}
              &nbsp;ETH
            </span>
            <ArrowRight color={colors.textsecondary} />
          </p>
          <p
            className="_asset _l_asset"
            onClick={() => navigate("/usdt-asset")}
          >
            <span>
              {usdtAccBalance?.toFixed(8)}
              &nbsp;USDT
            </span>
            <ArrowRight color={colors.textsecondary} />
          </p>
        </>
      )}
    </div>
  );
};
