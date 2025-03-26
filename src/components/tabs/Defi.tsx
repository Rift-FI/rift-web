import { JSX, ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  faCoins,
  faFolderOpen,
  faLayerGroup,
  faPlusCircle,
  faSquareUpRight,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import { stakeproducttype } from "../../types/earn";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { getPstTokens } from "../../utils/api/quvault/psttokens";
import { getLaunchPadStores } from "../../utils/api/quvault/launchpad";
import { getMyDividends } from "../../utils/api/quvault/dividends";
import { getStakingInfo, getStakeingBalance } from "../../utils/api/staking";
import { formatUsdSimple } from "../../utils/formatters";
import { TokenomicsChart } from "../../pages/quvault/LaunchpadInfo";
import { Asset } from "../WalletBalance";
import { SubmitButton } from "../global/Buttons";
import { Loading } from "../../assets/animations";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import stakeicon from "../../assets/images/icons/lendto.png";
import "../../styles/components/tabs/defitab.scss";

interface sphereVaultType {
  id: string;
  name: string;
  strategy: string;
  apy: string;
  currentTvl: string;
  maxCapacity: string;
  network: string;
  lockPeriod: string;
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
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [filter, setFilter] = useState<
    "portfolio" | "yield" | "amm" | "tokens" | "launchpad"
  >("portfolio");

  const { data: mydividends, isFetching: dividendsloading } = useQuery({
    queryKey: ["mydividends"],
    queryFn: getMyDividends,
  });

  const { data: pstTokensdata, isFetching: pstLoading } = useQuery({
    queryKey: ["psttokens"],
    queryFn: getPstTokens,
  });

  const { data: launchPaddata, isFetching: launchpadLoading } = useQuery({
    queryKey: ["launchpad"],
    queryFn: getLaunchPadStores,
  });

  const { data: stakinginfo, isFetching: stakinginfoloading } = useQuery({
    queryKey: ["stkinginfo"],
    queryFn: getStakingInfo,
  });

  const { data: stakingbalance, isFetching: stakingbalanceloading } = useQuery({
    queryKey: ["stkingbalance"],
    queryFn: getStakeingBalance,
  });

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  // 1 - {trasuryvalue / totalstaked}

  useBackButton(goBack);

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
          text="Stake"
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

      {dividendsloading ||
        pstLoading ||
        launchpadLoading ||
        stakinginfoloading ||
        (stakingbalanceloading && (
          <div className="loading_ctr">
            <Loading width="2rem" height="2rem" />
          </div>
        ))}

      {filter == "portfolio" && !dividendsloading && (
        <>
          <div className="stakingrewards_ctr">
            <p className="title">Staking Rewards</p>
            <div className="myrewards">
              <Asset
                image={stakeicon}
                name="Buffet Vault"
                symbol="BUFFET"
                navigatelink="/stakevault/buffet"
                balance={stakingbalance?.data?.lstBalance}
                balanceusd={
                  String(
                    1 -
                      Number(stakinginfo?.data?.treasuryValue) /
                        Number(stakinginfo?.data?.totalStaked)
                  ) + "%"
                }
              />
              <Asset
                image={stakeicon}
                name="Super Senior"
                symbol="SENIOR"
                navigatelink="/stakevault/senior"
                balance="100 LST"
                balanceusd={100}
              />
              <Asset
                image={stakeicon}
                name="Junior"
                symbol="JUNIOR"
                navigatelink="/stakevault/junior"
                balance="100 LST"
                balanceusd={100}
              />
            </div>
          </div>

          <div className="dividends_ctr">
            <p className="title">Dividends</p>

            <div className="total_hold">
              <p className="total">
                Total Dividends Earned
                <span>{mydividends?.data?.total_amount} USD</span>
              </p>

              <p className="hold">
                Total Token Hold <span>{mydividends?.data?.total_tokens}</span>
              </p>
            </div>

            <div className="chart_ctr">
              <TokenomicsChart
                data={[
                  { name: "CMT", value: 10, color: colors.success },
                  { name: "STRAT", value: 40, color: colors.accent },
                  { name: "CHEAP", value: 50, color: colors.danger },
                ]}
              />
            </div>

            <Asset
              image={stakeicon}
              name="CMT"
              symbol="CMT"
              balance="300 CMT"
              balanceusd={34}
            />
            <Asset
              image={stakeicon}
              name="STRAT"
              symbol="STRAT"
              balance="100 STRAT"
              balanceusd={10}
            />
            <Asset
              image={stakeicon}
              name="CHEAP"
              symbol="CHEAP"
              balance="200 CHEAP"
              balanceusd={5}
            />

            <div className="earn_more">
              <div onClick={() => setFilter("launchpad")}>
                <span>
                  Earn More <br /> Dividends
                </span>
                <FaIcon
                  faIcon={faUpRightAndDownLeftFromCenter}
                  fontsize={18}
                  color={colors.textprimary}
                />
              </div>
              <div className="tokens" onClick={() => setFilter("tokens")}>
                <span>
                  Get More <br /> Tokens
                </span>
                <FaIcon
                  faIcon={faCoins}
                  fontsize={18}
                  color={colors.textprimary}
                />
              </div>
            </div>
          </div>
        </>
      )}
      {filter == "amm" && (
        <div className="tokens_ctr">
          {ammPools?.map((_product, index) => (
            <AMMProduct key={index + _product?.name} product={_product} />
          ))}
        </div>
      )}
      {filter == "yield" && (
        <div className="tokens_ctr">
          <YieldProduct
            product={{
              name: "Buffet Vault",
              apy: "10%",
              currentTvl: String(
                formatUsdSimple(Number(stakinginfo?.data?.treasuryValue))
              ),
              id: "buffet",
              lockPeriod: "7 days",
              maxCapacity: "20,000",
              network: "Polygon",
              strategy: "buffet",
            }}
          />
          {sphereVaults?.map((_product, index) => (
            <YieldProduct key={_product?.id + index} product={_product} />
          ))}
        </div>
      )}
      {filter == "launchpad" && (
        <div className="tokens_ctr">
          {launchPaddata?.data?.map((_store) => (
            <Asset
              key={_store?.id}
              image={_store?.logo_url}
              name={_store?.store_name}
              balanceusd={_store?.price}
              navigatelink={`/launchpad/${_store?.id}`}
              symbol={_store?.symbol}
            />
          ))}
        </div>
      )}
      {filter == "tokens" && (
        <div className="tokens_ctr">
          {pstTokensdata?.data?.map((_token, index) => (
            <Asset
              key={_token?.symbol + index}
              image={_token?.logo_url}
              name={_token?.symbol}
              symbol={_token?.symbol}
              balanceusd={_token?.price}
              navigatelink={`/pst/${_token?.symbol}/${_token?.price}`}
            />
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

export const StakingReward = ({
  image,
  tokenid,
  tokenname,
  rewardvalue,
}: {
  image: string;
  tokenid: string;
  tokenname: string;
  rewardvalue: number;
}): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div className="stakingreward">
      <div className="img_token_name">
        <img src={image} alt={tokenname} />
        <p>
          {tokenname}
          <span>
            {rewardvalue} st{tokenname.split(" ").join("")}
          </span>
        </p>
      </div>

      <button onClick={() => navigate(`/stake/${tokenid}`)}>
        Stake
        <FaIcon
          faIcon={faLayerGroup}
          fontsize={14}
          color={colors.textprimary}
        />
      </button>
    </div>
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
      <p className="name">{product?.name}</p>

      <p className="apy">
        APY <span>{product?.apy}</span>
      </p>

      <div className="tvl_progress">
        <p className="tvl_max_cap">
          <span>Current TVL</span> <span>Max Capacity</span>
        </p>
        <div className="progress_ctr">
          <div className="progress" />
        </div>
        <p>
          <span>{product?.currentTvl}</span> <span>{product?.maxCapacity}</span>
        </p>
      </div>

      <p className="network">
        Network <span>{product?.network}</span>
      </p>

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

// eslint-disable-next-line react-refresh/only-export-components
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

// eslint-disable-next-line react-refresh/only-export-components
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

// eslint-disable-next-line react-refresh/only-export-components
export const sphereVaults: sphereVaultType[] = [
  {
    id: "st00",
    name: "Super Senior",
    strategy: "super-senior",
    apy: "11%",
    currentTvl: "$22,698,886.84",
    maxCapacity: "26,000,000",
    network: "Mantra",
    lockPeriod: "30 days",
  },
  {
    id: "st01",
    name: "Junior",
    strategy: "junior",
    apy: "29%",
    currentTvl: "$22,698,886.84",
    maxCapacity: "26,000,000",
    network: "Mantra",
    lockPeriod: "30 days",
  },
  {
    id: "st00",
    name: "Super Senior",
    strategy: "super-senior",
    apy: "11%",
    currentTvl: "$22,698,886.84",
    maxCapacity: "26,000,000",
    network: "Berachain",
    lockPeriod: "30 days",
  },
  {
    id: "st01",
    name: "Junior",
    strategy: "junior",
    apy: "29%",
    currentTvl: "$22,698,886.84",
    maxCapacity: "26,000,000",
    network: "Berachain",
    lockPeriod: "30 days",
  },
];
