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

export default function BeraAsset(): JSX.Element {
  const navigate = useNavigate();
  const { intent } = useParams();
  const { switchtab } = useTabs();

  const { data: beraInfo } = useQuery({
    queryKey: ["berachainbera"],
    queryFn: () => fetchCoinInfo("berachain-bera"),
  });

  const { data: beraprices, isPending: pricesfetching } = useQuery({
    queryKey: ["beraprices"],
    queryFn: () => fetchCoinPrices("berachain-bera", 30),
  });

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const berabal = localStorage.getItem("berabal");
  const berabalUsd = localStorage.getItem("berabalusd");

  const onSendBera = () => {
    // localStorage.setItem("prev_page", `/eth-asset/${intent}`);
    // navigate(`/send-crypto/ETH/${intent}`);
  };

  const onDepositBera = () => {
    localStorage.setItem("prev_page", `/eth-asset/${intent}`);
    navigate("/deposit/WBERA");
  };

  useBackButton(goBack);

  return (
    <section id="assetdetails">
      <div className="token">
        <div className="img_name_symbol">
          <img src={beraInfo?.image?.large} alt="ETH" />
          <p>
            {beraInfo?.name} <span>{beraInfo?.symbol}</span>
          </p>
        </div>

        <p className="price_change">
          ${beraInfo?.market_data?.current_price?.usd}
          <span
            className={
              Number(beraInfo?.market_data?.price_change_percentage_24h) > 1 ||
              Number(beraInfo?.market_data?.price_change_percentage_24h) == 0
                ? "positive"
                : "negative"
            }
          >
            {beraInfo?.market_data?.price_change_percentage_24h}%
          </span>
        </p>
      </div>

      <YourAssetBalance
        balance={Number(berabal)}
        balanceUsd={Number(berabalUsd)}
      />

      {beraprices && <CoinPriceChart data={beraprices} />}
      {!pricesfetching && (
        <p className="pice-desc">
          <Question width={12} height={12} color={colors.textsecondary} />
          Prices for the last 30 days
        </p>
      )}

      <p className="tokendesc">{beraInfo?.description?.en}</p>

      <div className="token_stats">
        <p>
          Market cap Rank <span>#{beraInfo?.market_cap_rank}</span>
        </p>
        <p>
          Market Cap{" "}
          <span>
            ${numberFormat(Number(beraInfo?.market_data?.market_cap?.usd))}
          </span>
        </p>
        <p>
          Circulating Supply
          <span>
            {numberFormat(Number(beraInfo?.market_data?.circulating_supply))}
          </span>
        </p>
        <p>
          Total Supply
          <span>
            {beraInfo?.market_data?.total_supply
              ? numberFormat(Number(beraInfo?.market_data?.total_supply))
              : "- - -"}
          </span>
        </p>
        <p>
          Max Supply
          <span>
            {beraInfo?.market_data?.max_supply
              ? numberFormat(Number(beraInfo?.market_data?.max_supply))
              : "- - -"}
          </span>
        </p>
      </div>

      <div className="assetactions">
        <button onClick={onSendBera}>
          Send <ArrowUpCircle color={colors.textprimary} />
        </button>
        <button onClick={onDepositBera}>
          Deposit <ArrowDownCircle color={colors.textprimary} />
        </button>
      </div>
    </section>
  );
}
