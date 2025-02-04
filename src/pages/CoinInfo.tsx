import { JSX, useEffect, Fragment, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { openLink } from "@telegram-apps/sdk-react";
import { CandlestickData } from "lightweight-charts";
import { useParams, useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../hooks/snackbar";
import { useTabs } from "../hooks/tabs";
import { CoinPriceChart } from "../components/PriceChart";
import {
  coinInfoType,
  fetchCoinPrices,
  fetchCoinInfo,
} from "../utils/api/market";
import { numberFormat, formatUsd } from "../utils/formatters";
import { colors } from "../constants";
import "../styles/pages/coininfo.scss";

export default function CoinInfo(): JSX.Element {
  const { coinId } = useParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const queryclient = useQueryClient();
  const { showerrorsnack } = useSnackbar();

  const [dayCountPrices, setDaycountPrices] = useState<number>(30);

  const { data: coininfoDetails } = useQuery({
    queryKey: ["coindetails"],
    queryFn: () => fetchCoinInfo(coinId as string),
    refetchInterval: 3000,
  });

  const { data: coininfoPrices } = useQuery({
    queryKey: ["coinprices"],
    queryFn: () => fetchCoinPrices(coinId as string, dayCountPrices),
    refetchInterval: 3000,
  });
  const coinDetails = coininfoDetails as coinInfoType;
  const coinPrices = coininfoPrices as CandlestickData[];

  const onGoBack = () => {
    switchtab("earn");
    navigate(-1);
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(() => onGoBack());
    }

    return () => {
      backButton.offClick(onGoBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="aboutcoin">
      <Fragment>
        <div id="loo1">
          <p className="name_symbol">
            {coinDetails && coinDetails?.name}{" "}
            <span>{coinDetails && coinDetails?.symbol}</span>
          </p>
          <p className="price">
            {formatUsd(
              coinDetails && coinDetails?.market_data?.current_price?.usd
            )}
          </p>
          <p
            className="price_change24"
            style={{
              fontStyle: "normal",
              fontWeight: "600",
              color:
                coinDetails &&
                coinDetails?.market_data?.price_change_percentage_24h < 0
                  ? colors.danger
                  : colors.success,
            }}
          >
            {coinDetails &&
            coinDetails?.market_data?.price_change_percentage_24h > 0
              ? `+${
                  coinDetails &&
                  coinDetails?.market_data?.price_change_percentage_24h.toFixed(
                    2
                  )
                }%`
              : `${
                  coinDetails &&
                  coinDetails?.market_data?.price_change_percentage_24h.toFixed(
                    2
                  )
                }%`}
          </p>
        </div>

        <div className="prices">
          <CoinPriceChart data={coinPrices || []} />

          <div className="dayscount">
            <button
              className={dayCountPrices == 1 ? "selecteddays" : ""}
              onClick={() => {
                setDaycountPrices(1);
                queryclient.invalidateQueries({ queryKey: ["coinprices"] });
              }}
            >
              1D
            </button>
            <button
              className={dayCountPrices == 7 ? "selecteddays" : ""}
              onClick={() => {
                setDaycountPrices(7);
                queryclient.invalidateQueries({ queryKey: ["coinprices"] });
              }}
            >
              1W
            </button>
            <button
              className={dayCountPrices == 30 ? "selecteddays" : ""}
              onClick={() => {
                setDaycountPrices(30);
                queryclient.invalidateQueries({ queryKey: ["coinprices"] });
              }}
            >
              1M
            </button>
            <button
              className={dayCountPrices == 365 ? "selecteddays" : ""}
              onClick={() => {
                setDaycountPrices(365);
                queryclient.invalidateQueries({ queryKey: ["coinprices"] });
              }}
            >
              1Y
            </button>
          </div>
        </div>

        <div id="loo3">
          <p>
            Rank <span>NO.{coinDetails?.market_cap_rank}</span>
          </p>
          <p>
            Market Cap
            <span>
              ${numberFormat(Number(coinDetails?.market_data?.market_cap?.usd))}
            </span>
          </p>
          <p>
            Circulation Supply
            <span>
              {numberFormat(
                Number(coinDetails?.market_data?.circulating_supply)
              )}
              &nbsp;
              <em
                className="sym"
                style={{ textTransform: "uppercase", fontStyle: "normal" }}
              >
                {coinDetails?.symbol}
              </em>
            </span>
          </p>
          <p>
            Max Supply
            <span>
              {typeof coinDetails?.market_data?.max_supply == "number"
                ? numberFormat(Number(coinDetails?.market_data?.max_supply))
                : "---"}
            </span>
          </p>
          <p>
            Total Supply
            <span>
              {numberFormat(Number(coinDetails?.market_data?.total_supply))}
              &nbsp;
              <em
                className="sym"
                style={{ textTransform: "uppercase", fontStyle: "normal" }}
              >
                {coinDetails?.symbol}
              </em>
            </span>
          </p>
          <p>
            Issue Date <span>{coinDetails?.genesis_date}</span>
          </p>
        </div>

        <p id="loo2">{coinDetails && coinDetails?.description?.en}</p>

        <div id="loo4">
          <span
            onClick={() =>
              openLink(coinDetails && coinDetails?.links?.homepage[0])
            }
          >
            Official Website
          </span>
          <span
            onClick={() =>
              openLink(coinDetails && coinDetails?.links?.whitepaper)
            }
          >
            Whitepaper
          </span>
        </div>

        <div id="loo5">
          {coinDetails &&
            coinDetails?.categories?.map((_cat, idx) => (
              <span key={_cat + idx}>{_cat}</span>
            ))}
        </div>
      </Fragment>

      <div className="buy_sell">
        <button
          className="_buy"
          onClick={() => showerrorsnack("Feature coming soon...")}
        >
          Buy
        </button>
        <button onClick={() => showerrorsnack("Feature coming soon...")}>
          Sell
        </button>
      </div>
    </section>
  );
}
