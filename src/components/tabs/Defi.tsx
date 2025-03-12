import { JSX, ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  faCoins,
  faDotCircle,
  faFolderOpen,
  faLayerGroup,
  faLock,
  faPlusCircle,
  faRotate,
  faSquareUpRight,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import { stakeproducttype } from "../../types/earn";
import { useAppDrawer } from "../../hooks/drawer";
import { psttoken, getPstTokens } from "../../utils/api/quvault/psttokens";
import {
  launchpadstore,
  getLaunchPadStores,
} from "../../utils/api/quvault/launchpad";
import { formatUsdSimple } from "../../utils/formatters";
import { SubmitButton } from "../global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import stakeicon from "../../assets/images/icons/lendto.png";
import "../../styles/components/tabs/defitab.scss";

interface sphereVaultType extends stakeproducttype {
  strategy: "index" | "buffet" | "degen";
  description: string;
  risk: "low" | "medium" | "high";
  popularity: number;
  lockPeriod?: string;
}

type ammPoolType = {
  name: string;
  apy: number;
  hasMonthlyDividend: boolean;
  minDeposit: number | null;
  minLockPeriod: number | null;
  popularity: number;
  lockPeriod?: string;
};

export const DefiTab = (): JSX.Element => {
  const [filter, setFilter] = useState<
    "portfolio" | "yield" | "amm" | "tokens" | "launchpad"
  >("portfolio");

  const { data: pstTokensdata } = useQuery({
    queryKey: ["psttokens"],
    queryFn: getPstTokens,
  });
  const { data: launchPaddata } = useQuery({
    queryKey: ["launchpad"],
    queryFn: getLaunchPadStores,
  });

  return (
    <section id="defitab">
      <p className="title">Defi Hub</p>

      <div className="filters">
        <FilterButton
          text="Portfolio"
          icon={
            <FaIcon
              faIcon={faFolderOpen}
              fontsize={12}
              color={
                filter == "portfolio"
                  ? colors.textprimary
                  : colors.textsecondary
              }
            />
          }
          isActive={filter == "portfolio"}
          onclick={() => setFilter("portfolio")}
        />

        <FilterButton
          text="Yield"
          icon={
            <FaIcon
              faIcon={faLayerGroup}
              fontsize={14}
              color={
                filter == "yield" ? colors.textprimary : colors.textsecondary
              }
            />
          }
          isActive={filter == "yield"}
          onclick={() => setFilter("yield")}
        />

        <FilterButton
          text="AMM"
          icon={
            <FaIcon
              faIcon={faSquareUpRight}
              fontsize={14}
              color={
                filter == "amm" ? colors.textprimary : colors.textsecondary
              }
            />
          }
          isActive={filter == "amm"}
          onclick={() => setFilter("amm")}
        />

        <FilterButton
          text="Tokens"
          icon={
            <FaIcon
              faIcon={faCoins}
              fontsize={14}
              color={
                filter == "tokens" ? colors.textprimary : colors.textsecondary
              }
            />
          }
          isActive={filter == "tokens"}
          onclick={() => setFilter("tokens")}
        />

        <FilterButton
          text="Launchpad"
          icon={
            <FaIcon
              faIcon={faUpRightAndDownLeftFromCenter}
              fontsize={14}
              color={
                filter == "launchpad"
                  ? colors.textprimary
                  : colors.textsecondary
              }
            />
          }
          isActive={filter == "launchpad"}
          onclick={() => setFilter("launchpad")}
        />
      </div>

      {filter == "amm" && (
        <div className="tokens_ctr">
          {ammPools?.map((_product, index) => (
            <AMMProduct key={index} product={_product} />
          ))}
        </div>
      )}

      {filter == "yield" && (
        <div className="tokens_ctr">
          {sphereVaults?.map((_product) => (
            <YieldProduct key={_product?.id} product={_product} />
          ))}
        </div>
      )}

      {filter == "launchpad" && (
        <div className="tokens_ctr">
          {launchPaddata?.data?.map((_store) => (
            <LaunchPadProduct key={_store?.store_id} store={_store} />
          ))}
        </div>
      )}

      {filter == "tokens" && (
        <div className="tokens_ctr">
          {pstTokensdata?.data?.map((_token) => (
            <TokenProduct key={_token?.symbol} token={_token} />
          ))}
        </div>
      )}

      <p className="desc">
        Discover and track tokens, Automated Market Maker(AMM) assets, yield
        opportunities, launchpad, and your portfolio.
      </p>
    </section>
  );
};

const FilterButton = ({
  text,
  icon,
  isActive,
  onclick,
}: {
  text: string;
  icon: ReactNode;
  isActive: boolean;
  onclick: () => void;
}): JSX.Element => {
  return (
    <button className={isActive ? "activefilter" : ""} onClick={onclick}>
      {icon}
      {text}
    </button>
  );
};

const YieldProduct = ({
  product,
}: {
  product: sphereVaultType;
}): JSX.Element => {
  const navigate = useNavigate();

  const onStake = () => {
    navigate(`/stake/${product?.id}`);
  };

  return (
    <div className="yieldproduct">
      <p className="name_apy">
        {product?.name}
        <span>{product?.apy}</span>
      </p>

      <p className="description">{product?.description}</p>

      <div className="container">
        <p>
          Strategy <span>{product?.strategy}</span>
        </p>
        <p>
          Risk Level <span>{product?.risk}</span>
        </p>
        <p>
          Network <span>{product?.network}</span>
        </p>
        <p>
          Current TVL <span>{product?.currentTvl}</span>
        </p>
        <p>
          Unstaking Period <span>{product?.lockPeriod}</span>
        </p>
        <p>
          Max Capacity <span>{product?.maxCapacity}</span>
        </p>
      </div>

      <SubmitButton
        text="Stake"
        icon={
          <FaIcon
            faIcon={faLayerGroup}
            fontsize={14}
            color={colors.textprimary}
          />
        }
        sxstyles={{
          padding: "0.625rem",
          borderRadius: "0 0 0.375rem 0.375rem",
          borderTop: `1px solid ${colors.divider}`,
          backgroundColor: "transparent",
        }}
        onclick={onStake}
      />
    </div>
  );
};

const AMMProduct = ({ product }: { product: ammPoolType }): JSX.Element => {
  return (
    <div className="ammproduct">
      <div className="img_name_apy">
        <div className="img_name">
          <img src={stakeicon} alt="amm" />
          <p>{product?.name}</p>
        </div>
        <p className="apy">{product?.apy}%</p>
      </div>

      <div className="details">
        <p>
          Pair <span>{product?.name}</span>
        </p>
        <p>
          Liquidity <span>$2,5000,000</span>
        </p>
        <p>
          Network <span>Ethereum</span>
        </p>
        <p>
          Current TVL <span>$30,000,000</span>
        </p>
      </div>

      <SubmitButton
        text="Add Liquidity"
        icon={
          <FaIcon
            faIcon={faPlusCircle}
            fontsize={14}
            color={colors.textprimary}
          />
        }
        sxstyles={{
          padding: "0.625rem",
          borderRadius: "0 0 0.375rem 0.375rem",
          borderTop: `1px solid ${colors.divider}`,
          backgroundColor: "transparent",
        }}
        onclick={() => {}}
      />
    </div>
  );
};

const LaunchPadProduct = ({
  store,
}: {
  store: launchpadstore;
}): JSX.Element => {
  return (
    <div className="launchpadproduct">
      <div className="img_status">
        <img src={store?.logo_url} alt={store?.symbol} />

        <span
          style={{
            color: store?.status === "ended" ? colors.danger : colors.success,
          }}
        >
          <FaIcon
            faIcon={store?.status === "ended" ? faLock : faDotCircle}
            color={store?.status === "ended" ? colors.danger : colors.success}
            fontsize={14}
          />
          {store?.status === "ended" ? "Ended" : "Sale Live"}
        </span>
      </div>

      <div className="price_sub">
        <div className="symbol_price">
          <p className="symbol">{store?.symbol}</p>
          <span className="price">
            1 {store?.symbol} ≈ {store?.price} USDC
          </span>
        </div>

        <SubmitButton
          text="Subscribe"
          sxstyles={{
            width: "fit-content",
            padding: "0.25rem 0.875rem",
            borderRadius: "1rem",
            fontWeight: 300,
            backgroundColor: colors.success,
          }}
          icon={<FaIcon faIcon={faPlusCircle} color={colors.textprimary} />}
          onclick={() => {}}
        />
      </div>

      <p className="detail">
        Liquidity <span>{store?.liquidity_percentage}%</span>
      </p>
      <p className="detail">
        APY <span>{store?.apy}%</span>
      </p>
      <p className="detail">
        {store?.status === "ended" ? "Presale" : "Sale Ends In"}
        <span>{store?.status === "ended" ? "Ended" : "0 Days"}</span>
      </p>
    </div>
  );
};

const TokenProduct = ({ token }: { token: psttoken }): JSX.Element => {
  const { openAppDrawerWithKey } = useAppDrawer();

  return (
    <div className="tokenproduct">
      <div className="img_symbol">
        <div className="img">
          <img src={token?.logo_url} alt={token?.symbol} />
          <p>{token?.symbol}</p>
        </div>

        <SubmitButton
          text="Swap"
          icon={<FaIcon faIcon={faRotate} color={colors.textprimary} />}
          sxstyles={{
            width: "fit-content",
            padding: "0.25rem 0.875rem",
            borderRadius: "1rem",
            fontWeight: 300,
            backgroundColor: colors.success,
          }}
          onclick={() =>
            openAppDrawerWithKey(
              "stakepst",
              token?.symbol,
              String(token?.price)
            )
          }
        />
      </div>

      <p className="detail">
        Price <span> {formatUsdSimple(token?.price)}</span>
      </p>
      <p className="detail">
        Market Cap <span> {formatUsdSimple(token?.market_cap)}</span>
      </p>
      <p className="detail">
        Total Supply <span> {token?.total_supply}</span>
      </p>
      <p className="detail">
        APY <span>{token?.apy}%</span>
      </p>
      <p className="detail">
        TVL <span>{formatUsdSimple(token?.tvl)}</span>
      </p>
    </div>
  );
};

export const techgrityProducts: (stakeproducttype & {
  popularity: number;
  apyHistory?: number[];
  tvlHistory?: number[];
  lockPeriod?: string;
  minDeposit?: number;
  hasMonthlyDividend?: boolean;
})[] = [
  {
    id: "tg00",
    name: "Techgrity Super Senior",
    apy: "Fixed 11%",
    currentTvl: "$26,000,000",
    maxCapacity: "$26,000,000",
    network: "Techgrity",
    lockPeriod: "7 days",
    minDeposit: 100,
    hasMonthlyDividend: false,
    popularity: 2,
    apyHistory: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    tvlHistory: [10000000, 15000000, 18000000, 22000000, 24000000, 26000000],
  },
  {
    id: "tg01",
    name: "Techgrity Junior",
    apy: "29%",
    currentTvl: "$25,000,000",
    maxCapacity: "$25,000,000",
    network: "Techgrity",
    lockPeriod: "7 days",
    minDeposit: 50,
    hasMonthlyDividend: true,
    popularity: 4,
    apyHistory: [8, 8.2, 8.5, 8.8, 9, 9.2, 9, 8.9, 9.1, 9.2, 9, 9],
    tvlHistory: [8000000, 12000000, 16000000, 20000000, 22000000, 25000000],
  },
];

export const ammPools: ammPoolType[] = [
  {
    name: "PST / WUSD",
    apy: 15,
    hasMonthlyDividend: true,
    minDeposit: 250,
    minLockPeriod: null,
    lockPeriod: "7 days",
    popularity: 4,
  },
  {
    name: "PST / USDC",
    apy: 13,
    hasMonthlyDividend: true,
    minDeposit: 200,
    minLockPeriod: null,
    lockPeriod: "7 days",
    popularity: 6,
  },
];

export const sphereVaults: sphereVaultType[] = [
  {
    id: "st00",
    name: "Index Vault",
    strategy: "index",
    description: "Diversified investments in top market cap tokens",
    apy: "13%",
    currentTvl: "$15,432,678",
    maxCapacity: "$30,000,000",
    network: "Sphere",
    risk: "low",
    popularity: 1,
    lockPeriod: "7 days",
  },
  {
    id: "st01",
    name: "Buffet Vault",
    strategy: "buffet",
    description:
      "Value investing in underpriced tokens with strong fundamentals",
    apy: "17%",
    currentTvl: "$8,765,432",
    maxCapacity: "$20,000,000",
    network: "Sphere",
    risk: "medium",
    popularity: 3,
    lockPeriod: "7 days",
  },
  {
    id: "st02",
    name: "Degen Vault",
    strategy: "degen",
    description: "High-risk high-reward AMM investments for maximum yield",
    apy: "31%",
    currentTvl: "$5,432,109",
    maxCapacity: "$10,000,000",
    network: "Sphere",
    risk: "high",
    popularity: 7,
    lockPeriod: "7 days",
  },
];
