import { JSX, useCallback, useEffect, useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router";
import { KeyboardArrowLeftOutlined } from "@mui/icons-material";
import { useSnackbar } from "../hooks/snackbar";
import { coinInfoType, fetchCoinInfo } from "../utils/api/market";
import { numberFormat, formatUsd } from "../utils/formatters";
import { Loading } from "../assets/animations";
import "../styles/pages/coininfo.css";

export default function CoinInfo(): JSX.Element {
  const { coinId } = useParams();
  const navigate = useNavigate();
  const { showerrorsnack } = useSnackbar();

  const [loading, setLoading] = useState<boolean>(false);
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

  const onGoBack = () => {
    navigate(-1);
  };

  const getCoinDetails = useCallback(async () => {
    setLoading(true);

    const { coinInfo, isOK } = await fetchCoinInfo(coinId as string);

    if (isOK && coinInfo?.id) {
      setLoading(false);
      setCoinDetails(coinInfo);
    } else {
      setLoading(false);
      showerrorsnack("Failed to get coin details!");
    }
  }, []);

  useEffect(() => {
    getCoinDetails();
  }, []);

  return (
    <section id="aboutcoin">
      <button className="goback" onClick={onGoBack}>
        <KeyboardArrowLeftOutlined />
      </button>

      {loading ? (
        <div className="animation">
          <Loading />
        </div>
      ) : (
        <Fragment>
          <div id="loo1">
            <p className="name_symbol">
              {coinDetails.name} <span>{coinDetails.symbol}</span>
            </p>
            <p className="price">
              {formatUsd(coinDetails?.market_data?.current_price?.usd)}
            </p>
            <p className="price_change24">
              {coinDetails?.market_data?.price_change_percentage_24h}%
            </p>
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
                {coinDetails.symbol}
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
                {numberFormat(coinDetails?.market_data?.total_supply)}
                {coinDetails.symbol}
              </span>
            </p>
            <p>
              Issue Date <span>{coinDetails?.genesis_date}</span>
            </p>
          </div>

          <p id="loo2">{coinDetails?.description?.en}</p>

          <div id="loo4">
            <a href={coinDetails?.links?.homepage[0]}>Official Website</a>
            <a href={coinDetails?.links?.whitepaper}>Whitepaper</a>
          </div>

          <div id="loo5">
            {coinDetails?.categories?.map((_cat, idx) => (
              <span key={_cat + idx}>{_cat}</span>
            ))}
          </div>
        </Fragment>
      )}
    </section>
  );
}
