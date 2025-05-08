import { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { fetchCoinInfo, fetchCoinPrices } from "../../utils/coingecko/markets";
import { numberFormat } from "../../utils/formatters";
import { YourAssetBalance } from "../../components/WalletBalance";
import { CoinPriceChart } from "../../components/PriceChart";
import { Question, ArrowUpCircle, ArrowDownCircle } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/pages/assets/assets.scss";

export default function EthAsset(): JSX.Element {
  const navigate = useNavigate();
  const { intent } = useParams();
  const { switchtab } = useTabs();

  const { data: ethereumInfo } = useQuery({
    queryKey: ["ethinfo"],
    queryFn: () => fetchCoinInfo("ethereum"),
  });

  const { data: ethPrices, isPending: pricesfetching } = useQuery({
    queryKey: ["ethprices"],
    queryFn: () => fetchCoinPrices("ethereum", 30),
  });

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const ethbal = localStorage.getItem("ethbal");
  const ethbalUsd = localStorage.getItem("ethbalUsd");

  const onSendEth = () => {
    // localStorage.setItem("prev_page", `/eth-asset/${intent}`);
    // navigate(`/send-crypto/ETH/${intent}`);
  };

  const onDepositEth = () => {
    localStorage.setItem("prev_page", `/eth-asset/${intent}`);
    navigate("/deposit/ETH");
  };

  useBackButton(goBack);

  return (
    <section id="assetdetails">
      <div className="token">
        <div className="img_name_symbol">
          <img src={ethereumInfo?.image?.large} alt="ETH" />
          <p>
            {ethereumInfo?.name} <span>{ethereumInfo?.symbol}</span>
          </p>
        </div>

        <p className="price_change">
          ${ethereumInfo?.market_data?.current_price?.usd}
          <span
            className={
              Number(ethereumInfo?.market_data?.price_change_percentage_24h) >
                1 ||
              Number(ethereumInfo?.market_data?.price_change_percentage_24h) ==
                0
                ? "positive"
                : "negative"
            }
          >
            {ethereumInfo?.market_data?.price_change_percentage_24h}%
          </span>
        </p>
      </div>

      <YourAssetBalance
        balance={Number(ethbal)}
        balanceUsd={Number(ethbalUsd)}
      />

      {ethPrices && <CoinPriceChart data={ethPrices} />}
      {!pricesfetching && (
        <p className="pice-desc">
          <Question width={12} height={12} color={colors.textsecondary} />
          Prices for the last 30 days
        </p>
      )}

      <p className="tokendesc">{ethereumInfo?.description?.en}</p>

      <div className="token_stats">
        <p>
          Market cap Rank <span>#{ethereumInfo?.market_cap_rank}</span>
        </p>
        <p>
          Market Cap{" "}
          <span>
            ${numberFormat(Number(ethereumInfo?.market_data?.market_cap?.usd))}
          </span>
        </p>
        <p>
          Circulating Supply
          <span>
            {numberFormat(
              Number(ethereumInfo?.market_data?.circulating_supply)
            )}
          </span>
        </p>
        <p>
          Total Supply
          <span>
            {ethereumInfo?.market_data?.total_supply
              ? numberFormat(Number(ethereumInfo?.market_data?.total_supply))
              : "- - -"}
          </span>
        </p>
        <p>
          Max Supply
          <span>
            {ethereumInfo?.market_data?.max_supply
              ? numberFormat(Number(ethereumInfo?.market_data?.max_supply))
              : "- - -"}
          </span>
        </p>
      </div>

      <div className="assetactions">
        <button onClick={onSendEth}>
          Send <ArrowUpCircle color={colors.textprimary} />
        </button>
        <button onClick={onDepositEth}>
          Deposit <ArrowDownCircle color={colors.textprimary} />
        </button>
      </div>
    </section>
  );
}
