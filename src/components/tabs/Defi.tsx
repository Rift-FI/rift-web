import { JSX, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  faLayerGroup,
  faCheckCircle,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   Tooltip,
//   Legend,
// } from "recharts";
import { stakeproducttype } from "../../types/earn";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { getPstTokens } from "../../utils/api/quvault/psttokens";
import { getLaunchPadStores } from "../../utils/api/quvault/launchpad";
import { getMyDividends } from "../../utils/api/quvault/dividends";
import { getStakingInfo, getStakeingBalance } from "../../utils/api/staking";
import { formatUsd, formatUsdSimple } from "../../utils/formatters";

import { Loading } from "../../assets/animations";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import stakeicon from "../../assets/images/icons/lendto.png";
import "../../styles/components/tabs/defitab.scss";
import { DemoChart } from "./defi/DemoChart";
import { DemoPieChart } from "./defi/DemoPieChart";

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

type AssetType = {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  balanceUsd: number;
  image: string;
  type: "staking" | "token" | "dividend" | "launchpad" | "amm";
  apy?: string | number;
  link: string;
  network?: string;
};

export const DefiTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

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
    queryKey: ["stakinginfo"],
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

  const lstUsdValue = (
    treasuryvalue: number,
    totalstaked: number,
    stakedamount: number
  ): number => {
    const profit = 1 - treasuryvalue / totalstaked;
    const usdvalue = profit / 100 + stakedamount;
    return usdvalue;
  };

  // Combine all assets into a unified list
  const portfolioAssets = useMemo(() => {
    const assets: AssetType[] = [];

    // Add staking assets
    if (stakingbalance?.data) {
      const buffetLstValue = lstUsdValue(
        Number(stakinginfo?.data?.treasuryValue || 0),
        Number(stakinginfo?.data?.totalStaked || 0),
        Number(stakingbalance?.data?.lstBalance || 0)
      );

      assets.push({
        id: "buffet",
        name: "Sphere Vault",
        symbol: "SPHERE",
        balance: Number(stakingbalance?.data?.lstBalance) || 0,
        balanceUsd: buffetLstValue,
        image: stakeicon,
        type: "staking",
        apy: "11-13% Guaranteed",
        link: "/stakevault/buffet",
        network: "Polygon",
      });

      // Add other staking assets (placeholder values)
      // assets.push({
      //   id: "senior",
      //   name: "Super Senior",
      //   symbol: "SENIOR",
      //   balance: 0,
      //   balanceUsd: 0,
      //   image: stakeicon,
      //   type: "staking",
      //   apy: "11-13% Guaranteed",
      //   link: "/stakevault/senior",
      //   network: "Mantra",
      // });

      // assets.push({
      //   id: "junior",
      //   name: "Junior",
      //   symbol: "JUNIOR",
      //   balance: 0,
      //   balanceUsd: 0,
      //   image: stakeicon,
      //   type: "staking",
      //   apy: "29%",
      //   link: "/stakevault/junior",
      //   network: "Mantra",
      // });
    }

    // Add dividend tokens
    // if (mydividends?.data) {
    //   assets.push({
    //     id: "cmt",
    //     name: "CMT",
    //     symbol: "CMT",
    //     balance: 0,
    //     balanceUsd: 0,
    //     image: stakeicon,
    //     type: "dividend",
    //     link: "/dividend/cmt",
    //     apy: "5%",
    //   });

    //   assets.push({
    //     id: "strat",
    //     name: "STRAT",
    //     symbol: "STRAT",
    //     balance: 0,
    //     balanceUsd: 0,
    //     image: stakeicon,
    //     type: "dividend",
    //     link: "/dividend/strat",
    //     apy: "3%",
    //   });

    //   assets.push({
    //     id: "cheap",
    //     name: "CHEAP",
    //     symbol: "CHEAP",
    //     balance: 0,
    //     balanceUsd: 0,
    //     image: stakeicon,
    //     type: "dividend",
    //     link: "/dividend/cheap",
    //     apy: "2%",
    //   });
    // }

    // Add launchpad tokens
    // if (launchPaddata?.data) {
    //   launchPaddata.data.forEach((store) => {
    //     assets.push({
    //       id: store.id,
    //       name: store.store_name,
    //       symbol: store.symbol,
    //       balance: 0, // We don't have balance info from the API
    //       balanceUsd: 0,
    //       image: store.logo_url,
    //       type: "launchpad",
    //       link: `/launchpad/${store.id}`,
    //     });
    //   });
    // }

    // Add PST tokens
    // if (pstTokensdata?.data) {
    //   pstTokensdata.data.forEach((token, index) => {
    //     assets.push({
    //       id: token.symbol + index,
    //       name: token.symbol,
    //       symbol: token.symbol,
    //       balance: 0, // We don't have balance info from the API
    //       balanceUsd: 0,
    //       image: token.logo_url,
    //       type: "token",
    //       link: `/pst/${token.symbol}/${token.price}`,
    //     });
    //   });
    // }

    return assets;
  }, [stakingbalance, stakinginfo, mydividends, launchPaddata, pstTokensdata]);

  // Fix for NaN percentage calculation
  const getAverageStakingPercentage = () => {
    if (!stakinginfo?.data || !stakingbalance?.data) return "0";

    if (Number(stakingbalance?.data?.lstBalance) === 0) return "0";

    const treasuryValue = Number(stakinginfo?.data?.treasuryValue || 0);
    const totalStaked = Number(stakinginfo?.data?.totalStaked || 0);

    if (totalStaked === 0) return "0";

    return formatUsdSimple(Math.abs((treasuryValue / totalStaked - 1) * 100));
  };

  // Sort assets by value (highest first) and group by type
  const sortedPortfolioAssets = useMemo(() => {
    // Sort function: prioritize by type, then by value
    return [...portfolioAssets].sort((a, b) => {
      // Priority order: staking, dividend, launchpad, token, amm
      const typeOrder = {
        staking: 1,
        dividend: 2,
        launchpad: 3,
        token: 4,
        amm: 5,
      };

      // First sort by type
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }

      // Then sort by value (highest first)
      return b?.balanceUsd || 0 - a?.balanceUsd || 0;
    });
  }, [portfolioAssets]);

  // Group assets by type
  const groupedAssets = useMemo(() => {
    const grouped = {
      staking: sortedPortfolioAssets.filter(
        (asset) => asset.type === "staking"
      ),
      dividend: sortedPortfolioAssets.filter(
        (asset) => asset.type === "dividend"
      ),
      launchpad: sortedPortfolioAssets.filter(
        (asset) => asset.type === "launchpad"
      ),
      token: sortedPortfolioAssets.filter((asset) => asset.type === "token"),
      amm: sortedPortfolioAssets.filter((asset) => asset.type === "amm"),
    };

    // Only include categories that have assets
    return Object.entries(grouped)
      .filter(([, assets]) => assets.length > 0)
      .map(([type, assets]) => ({
        type: type as "staking" | "dividend" | "launchpad" | "token" | "amm",
        assets,
        totalValue: assets.reduce(
          (sum, asset) => sum + asset?.balanceUsd || 0,
          0
        ),
      }));
  }, [sortedPortfolioAssets]);

  // Add sub-filter for portfolio assets
  const [portfolioFilter] = useState<
    "all" | "staking" | "dividend" | "launchpad" | "token" | "amm"
  >("all");

  // Get filtered assets based on the portfolio filter
  const filteredAssets = useMemo(() => {
    if (portfolioFilter === "all") {
      return groupedAssets;
    }
    return groupedAssets.filter((group) => group.type === portfolioFilter);
  }, [groupedAssets, portfolioFilter]);

  // Get color for asset type
  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      staking: "#0fb14d",
      dividend: "#5b8def",
      launchpad: "#ff9f1c",
      token: "#496bcc",
      amm: "#5b8def",
    };
    return colors[type] || "#ffffff";
  };

  useBackButton(goBack);

  const isLoading =
    dividendsloading ||
    pstLoading ||
    launchpadLoading ||
    stakinginfoloading ||
    stakingbalanceloading;

  return (
    <section className="pb-16">
      {isLoading && (
        <div className="h-screen flex justify-center items-center">
          <Loading width="2rem" height="2rem" />
        </div>
      )}

      {!isLoading && (
        <div className="px-1 pt-3">
          {/* Asset List */}
          <div>
            {filteredAssets.length === 0 ? (
              <div className="flex justify-center items-center rounded-xl p-8 my-4">
                <p className="text-sm text-white/70 text-center">
                  No assets found in this category
                </p>
              </div>
            ) : (
              <>
                {/* Highlight guaranteed returns if in All Assets or Staking filter */}
                {(portfolioFilter === "all" || portfolioFilter === "staking") &&
                  groupedAssets.find((group) => group.type === "staking") && (
                    <div className="mb-4 bg-[#0e0e0e]">
                      <div className="flex items-center gap-2 justify-center">
                        <FaIcon
                          faIcon={faCheckCircle}
                          fontsize={14}
                          color="#ffb386"
                        />
                        <h4 className="text-base font-semibold text-[#f6f7f9]">
                          Sphere Vault - 11-13% Guaranteed Returns
                        </h4>
                      </div>
                      <div className="p-2">
                        {groupedAssets
                          .find((group) => group.type === "staking")
                          ?.assets.filter(
                            (asset) => asset.name === "Sphere Vault"
                          )
                          .map((asset) => (
                            <PortfolioAsset
                              key={asset.id}
                              asset={asset}
                              onClick={() => navigate(asset.link)}
                              getTypeColor={getTypeColor}
                              stakinginfotvl={
                                stakinginfo?.data?.treasuryValue || 0
                              }
                              userBalance={
                                Number(stakingbalance?.data?.lstBalance) || 0
                              }
                              totalStaked={stakinginfo?.data?.totalStaked || 0}
                              avgAPY={getAverageStakingPercentage()}
                            />
                          ))}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

interface PortfolioAssetProps {
  asset: AssetType;
  onClick: () => void;
  getTypeColor: (type: string) => string;
  stakinginfotvl?: string | number;
  userBalance: number;
  totalStaked: number | string;
  avgAPY: string;
}

const PortfolioAsset = ({
  asset,
  onClick,
  stakinginfotvl,
  userBalance,
  totalStaked,
  avgAPY,
}: PortfolioAssetProps): JSX.Element => {
  const navigate = useNavigate();
  const [activeChart, setActiveChart] = useState<"apy" | "treasury">("apy");
  const isSphereVault =
    asset.name === "Sphere Vault" && asset.type === "staking";

  const formatTvl = (tvl: string | number | undefined): string => {
    if (typeof tvl === "undefined") return "0";
    const numValue = typeof tvl === "string" ? Number(tvl) || 0 : tvl || 0;
    return formatUsdSimple(numValue);
  };

  const formatBalance = (balance: number): string => {
    return formatUsd(balance || 0);
  };

  const formatNumber = (num: number | string): number => {
    if (typeof num === "string") return Number(num) || 0;
    return num || 0;
  };

  return (
    <div
      className={`relative mb-2 rounded-xl transition-all duration-200 cursor-pointer ${
        isSphereVault ? "border-accent/20" : ""
      }`}
      onClick={isSphereVault ? undefined : onClick}
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <img
            src={asset.image}
            alt={asset?.name}
            className="w-7 h-7 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {asset?.name}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-white/70">{asset?.symbol}</span>
              {asset.network && (
                <span className="text-[10px] text-white/50 bg-white/40 px-1 rounded-sm">
                  {asset?.network}
                </span>
              )}
              {isSphereVault && (
                <span className="text-[10px] font-semibold text-white bg-accent/80 px-1.5 py-0.5 rounded ml-1">
                  RWA
                </span>
              )}
            </div>
            {isSphereVault && (
              <div className="flex items-center gap-1 mt-1 px-2 py-0.5 bg-success/10 rounded-full w-fit">
                <FaIcon
                  faIcon={faCheckCircle}
                  fontsize={10}
                  color={colors.success}
                />
                <span className="text-xs font-semibold text-success text-[#f6f7f9]">
                  11-13% Guaranteed
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSphereVault && (
        <div className="flex flex-col gap-1.5 mt-2 p-2 rounded-lg border border-dashed border-white/50">
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-white/70">
              Your Balance:
            </div>
            <div className="text-sm font-semibold text-white">
              {formatBalance(userBalance)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-white/70">24h APY:</div>
            <div className="text-sm font-semibold text-success">{avgAPY}%</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-white/70">TVL:</div>
            <div className="text-sm font-semibold text-white">
              ${formatTvl(stakinginfotvl)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-white/70">
              Total Staked:
            </div>
            <div className="text-sm font-semibold text-white">
              ${formatUsdSimple(formatNumber(totalStaked))}
            </div>
          </div>
        </div>
      )}

      {isSphereVault && (
        <div className="mt-2">
          <div className="py-2 border-t border-dashed border-success/20 mb-2">
            <div className="flex flex-col items-center">
              <DemoPieChart />
            </div>
            <p className="text-[10px] text-success font-medium text-center mt-2 text-gray-400">
              Treasury backed by real-world assets in Asia (tokenized shopping
              centers)
            </p>
          </div>

          <div className="pt-2 border-t border-dashed border-success/20">
            <div className="flex flex-col items-center gap-1.5 mb-2">
              <h5 className="font-semibold text-white text-center my-2">
                Performance History
              </h5>
              <div className="flex bg-white/10 rounded-full p-0.5 w-4/5 max-w-[300px]">
                <button
                  className={`flex-1 text-xs py-1 px-2 rounded-full font-medium transition-all duration-200 
                    ${
                      activeChart === "apy"
                        ? "bg-[#ffb386] text-[#000] font-semibold shadow-sm"
                        : "text-white/60 hover:bg-white/5"
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChart("apy");
                  }}
                >
                  APY
                </button>
                <button
                  className={`flex-1 text-xs py-1 px-2 rounded-full font-medium transition-all duration-200 
                    ${
                      activeChart === "treasury"
                        ? "bg-[#ffb386] text-[#000] font-semibold shadow-sm"
                        : "text-white/60 hover:bg-white/5"
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChart("treasury");
                  }}
                >
                  Treasury Growth
                </button>
              </div>
            </div>
            <div className="my-2 px-1">
              <DemoChart />
            </div>

            <button
              className="w-full flex items-center justify-center bg-[#ffb386] text-[#000] font-semibold shadow-sm p-2 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                navigate(asset.link);
              }}
            >
              <span className="text-sm">Stake Now</span>
              <FaIcon faIcon={faArrowRight} fontsize={16} color="#000" />
            </button>
          </div>
        </div>
      )}
    </div>
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
    apy: "11-13% Guaranteed",
    currentTvl: "$26,000,000",
    maxCapacity: "$26,000,000",
    network: "Techgrity",
    lockPeriod: "7 days",
    minDeposit: 100,
    hasMonthlyDividend: false,
    popularity: 2,
    apyHistory: [11, 12, 11, 13, 12, 11, 12, 13, 11, 12, 13, 12],
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
    apy: "11-13% Guaranteed",
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
    apy: "11-13% Guaranteed",
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
