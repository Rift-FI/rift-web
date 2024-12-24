import { JSX, useCallback, useEffect, useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router";
import { openLink } from "@telegram-apps/sdk-react";
import { backButton } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../hooks/snackbar";
import { SnackBar } from "../components/global/SnackBar";
import { CoinPriceChart } from "../components/PriceChart";
import {
  coinInfoType,
  coinPriceType,
  fetchCoinPrices,
  fetchCoinInfo,
} from "../utils/api/market";
import { numberFormat, formatUsd } from "../utils/formatters";
import { colors } from "../constants";
import "../styles/pages/coininfo.css";

export default function CoinInfo(): JSX.Element {
  const { coinId } = useParams();
  const navigate = useNavigate();
  const { showerrorsnack } = useSnackbar();

  const [coinDetails, setCoinDetails] = useState<coinInfoType>({
    id: "",
    symbol: "",
    name: "",
    categories: [],
    description: {
      en: "",
    },
    links: {
      homepage: [],
      whitepaper: "",
      official_forum_url: [],
    },
    image: {
      thumb: "",
      small: "",
      large: "",
    },
    genesis_date: "",
    market_cap_rank: 0,
    market_data: {
      current_price: {
        usd: 0,
      },
      price_change_percentage_24h: 0,
      total_supply: 0,
      max_supply: 0,
      circulating_supply: 0,
      market_cap: {
        usd: 0,
      },
    },
  });
  const [coinPrices, setCoinPrices] = useState<coinPriceType[]>([]);

  const onGoBack = () => {
    navigate(-1);
  };

  if (backButton.isMounted()) {
    backButton.onClick(() => onGoBack());
  }

  const getCoinDetails = useCallback(async () => {
    const { coinInfo, isOK } = await fetchCoinInfo(coinId as string);

    if (isOK && coinInfo?.id) {
      setCoinDetails(coinInfo);
    } else {
      showerrorsnack("Failed to get coin details!");
    }
  }, []);

  const getCoinPrices = useCallback(async () => {
    const { prices, isOk } = await fetchCoinPrices(coinId as string, 30);

    if (isOk) {
      setCoinPrices(prices);
    }
  }, []);

  useEffect(() => {
    getCoinDetails();
    getCoinPrices();

    let interval = setInterval(() => {
      getCoinDetails();
      getCoinPrices();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  return (
    <section id="aboutcoin">
      <Fragment>
        <div id="loo1">
          <p className="name_symbol">
            {coinDetails.name} <span>{coinDetails.symbol}</span>
          </p>
          <p className="price">
            {formatUsd(coinDetails?.market_data?.current_price?.usd)}
          </p>
          <p
            className="price_change24"
            style={{
              fontStyle: "normal",
              fontWeight: "600",
              color:
                coinDetails?.market_data?.price_change_percentage_24h < 0
                  ? colors.danger
                  : colors.success,
            }}
          >
            {coinDetails?.market_data?.price_change_percentage_24h > 0
              ? `+${coinDetails?.market_data?.price_change_percentage_24h.toFixed(
                  2
                )}%`
              : `${coinDetails?.market_data?.price_change_percentage_24h.toFixed(
                  2
                )}%`}
          </p>
        </div>

        <div className="prices">
          <CoinPriceChart data={coinPrices} />
        </div>

        <div id="loo3">
          <p>
            Rank <span>NO.{coinDetails?.market_cap_rank}</span>
          </p>
          <p>
            Market Cap
            <span>
              ${numberFormat(coinDetails?.market_data?.market_cap?.usd)}
            </span>
          </p>
          <p>
            Circulation Supply
            <span>
              {numberFormat(coinDetails?.market_data?.circulating_supply)}
              &nbsp;
              <em
                className="sym"
                style={{ textTransform: "uppercase", fontStyle: "normal" }}
              >
                {coinDetails.symbol}
              </em>
            </span>
          </p>
          <p>
            Max Supply
            <span>
              {typeof coinDetails?.market_data?.max_supply == "number"
                ? numberFormat(coinDetails?.market_data?.max_supply)
                : "---"}
            </span>
          </p>
          <p>
            Total Supply
            <span>
              {numberFormat(coinDetails?.market_data?.total_supply)}&nbsp;
              <em
                className="sym"
                style={{ textTransform: "uppercase", fontStyle: "normal" }}
              >
                {coinDetails.symbol}
              </em>
            </span>
          </p>
          <p>
            Issue Date <span>{coinDetails?.genesis_date}</span>
          </p>
        </div>

        <p id="loo2">{coinDetails?.description?.en}</p>

        <div id="loo4">
          <span onClick={() => openLink(coinDetails?.links?.homepage[0])}>
            Official Website
          </span>
          <span onClick={() => openLink(coinDetails?.links?.whitepaper)}>
            Whitepaper
          </span>
        </div>

        <div id="loo5">
          {coinDetails?.categories?.map((_cat, idx) => (
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

      <SnackBar />
    </section>
  );
}
