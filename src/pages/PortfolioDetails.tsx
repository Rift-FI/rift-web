import { JSX, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FaIcon } from "../assets/faicon";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { getPstTokens } from "../utils/api/quvault/psttokens";
import { getLaunchPadStores } from "../utils/api/quvault/launchpad";
import { getMyDividends } from "../utils/api/quvault/dividends";
import { getStakingInfo, getStakeingBalance } from "../utils/api/staking";
import { formatUsdSimple } from "../utils/formatters";
import { Loading } from "../assets/animations";
import { colors } from "../constants";
import stakeicon from "../assets/images/icons/lendto.png";
import "../styles/pages/portfoliodetails.scss";

// Asset type definition matching what's in Defi.tsx
type AssetType = {
  id: string;
  name: string;
  symbol: string;
  balance: number | string;
  balanceUsd: number;
  image: string;
  type: "staking" | "token" | "dividend" | "launchpad" | "amm";
  apy?: string | number;
  link: string;
  network?: string;
  supportedAssets?: string[];
};

const PortfolioDetails = (): JSX.Element => {
  const navigate = useNavigate();

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
        Number(stakingbalance?.data?.stakedBalance || 0)
      );

      assets.push({
        id: "buffet",
        name: "Buffet Vault",
        symbol: "BUFFET",
        balance: stakingbalance?.data?.lstBalance || 0,
        balanceUsd: buffetLstValue,
        image: stakeicon,
        type: "staking",
        apy: "Guaranteed 11%",
        link: "/stakevault/buffet",
        network: "Polygon",
        supportedAssets: ["USDC", "USDT", "DAI"],
      });

      // Add other staking assets (placeholder values)
      assets.push({
        id: "senior",
        name: "Super Senior",
        symbol: "SENIOR",
        balance: 100,
        balanceUsd: 100,
        image: stakeicon,
        type: "staking",
        apy: "11%",
        link: "/stakevault/senior",
        network: "Mantra",
        supportedAssets: ["BTC", "ETH"],
      });

      assets.push({
        id: "junior",
        name: "Junior",
        symbol: "JUNIOR",
        balance: 100,
        balanceUsd: 100,
        image: stakeicon,
        type: "staking",
        apy: "29%",
        link: "/stakevault/junior",
        network: "Mantra",
        supportedAssets: ["SOL", "AVAX"],
      });
    }

    // Add dividend tokens
    if (mydividends?.data) {
      assets.push({
        id: "cmt",
        name: "CMT",
        symbol: "CMT",
        balance: 300,
        balanceUsd: 34,
        image: stakeicon,
        type: "dividend",
        link: "/dividend/cmt",
        apy: "5%",
      });

      assets.push({
        id: "strat",
        name: "STRAT",
        symbol: "STRAT",
        balance: 100,
        balanceUsd: 10,
        image: stakeicon,
        type: "dividend",
        link: "/dividend/strat",
        apy: "3%",
      });

      assets.push({
        id: "cheap",
        name: "CHEAP",
        symbol: "CHEAP",
        balance: 200,
        balanceUsd: 5,
        image: stakeicon,
        type: "dividend",
        link: "/dividend/cheap",
        apy: "2%",
      });
    }

    // Add launchpad tokens
    if (launchPaddata?.data) {
      launchPaddata.data.forEach((store) => {
        assets.push({
          id: store.id,
          name: store.store_name,
          symbol: store.symbol,
          balance: 0, // We don't have balance info from the API
          balanceUsd: store.price,
          image: store.logo_url,
          type: "launchpad",
          link: `/launchpad/${store.id}`,
        });
      });
    }

    // Add PST tokens
    if (pstTokensdata?.data) {
      pstTokensdata.data.forEach((token, index) => {
        assets.push({
          id: token.symbol + index,
          name: token.symbol,
          symbol: token.symbol,
          balance: 0, // We don't have balance info from the API
          balanceUsd: token.price,
          image: token.logo_url,
          type: "token",
          link: `/pst/${token.symbol}/${token.price}`,
        });
      });
    }

    return assets;
  }, [stakingbalance, stakinginfo, mydividends, launchPaddata, pstTokensdata]);

  // Sort assets by value (highest first)
  const sortedAssets = useMemo(() => {
    return [...portfolioAssets].sort((a, b) => b.balanceUsd - a.balanceUsd);
  }, [portfolioAssets]);

  // Calculate total portfolio value
  const totalValue = useMemo(() => {
    return portfolioAssets.reduce(
      (total, asset) => total + asset.balanceUsd,
      0
    );
  }, [portfolioAssets]);

  // Get color for asset type
  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      staking: "#0fb14d", // colors.$success
      dividend: "#5b8def", // colors.$info
      launchpad: "#ff9f1c", // colors.$warning
      token: "#496bcc", // colors.$accent
      amm: "#5b8def", // colors.$info
    };
    return colors[type] || "#ffffff";
  };

  // Get readable names for asset types
  const getTypeDisplayName = (type: string): string => {
    const displayNames: Record<string, string> = {
      staking: "Staking",
      dividend: "Dividends",
      launchpad: "Launchpad",
      token: "Token",
      amm: "Liquidity",
    };
    return displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const isLoading =
    dividendsloading ||
    pstLoading ||
    launchpadLoading ||
    stakinginfoloading ||
    stakingbalanceloading;

  return (
    <div className="portfolio-details">
      <div className="details-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaIcon
            faIcon={faArrowLeft}
            fontsize={16}
            color={colors.textprimary}
          />
        </button>
        <h1>Portfolio Details</h1>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <Loading width="2rem" height="2rem" />
        </div>
      ) : (
        <>
          <div className="portfolio-summary-card">
            <div className="total-value-section">
              <div className="label">Total Portfolio Value</div>
              <div className="value">{formatUsdSimple(totalValue)}</div>
            </div>
            <div className="asset-count">
              {portfolioAssets.length}{" "}
              {portfolioAssets.length === 1 ? "Asset" : "Assets"}
            </div>
          </div>

          <div className="assets-list">
            <h2>Your Assets</h2>

            {sortedAssets.length === 0 ? (
              <div className="no-assets">
                <p>You don't have any assets yet</p>
              </div>
            ) : (
              sortedAssets.map((asset) => (
                <div
                  className="detailed-asset-card"
                  key={asset.id}
                  onClick={() => navigate(asset.link)}
                >
                  <div className="asset-header">
                    <div className="asset-icon-name">
                      <img src={asset.image} alt={asset.name} />
                      <div className="name-section">
                        <span className="asset-name">{asset.name}</span>
                        <span className="asset-symbol">{asset.symbol}</span>
                      </div>
                    </div>
                    <div
                      className="asset-type"
                      style={{
                        backgroundColor: `${getTypeColor(asset.type)}20`,
                        color: getTypeColor(asset.type),
                      }}
                    >
                      {getTypeDisplayName(asset.type)}
                    </div>
                  </div>

                  <div className="asset-details">
                    <div className="detail-row">
                      <span className="detail-label">Balance</span>
                      <span className="detail-value">
                        {asset.balance} {asset.symbol}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Value</span>
                      <span className="detail-value">
                        {formatUsdSimple(asset.balanceUsd)}
                      </span>
                    </div>
                    {asset.network && (
                      <div className="detail-row">
                        <span className="detail-label">Network</span>
                        <span className="detail-value">{asset.network}</span>
                      </div>
                    )}
                    {asset.apy && (
                      <div className="detail-row">
                        <span className="detail-label">APY</span>
                        <span className="detail-value highlight">
                          {asset.apy}
                        </span>
                      </div>
                    )}
                    {asset.supportedAssets && (
                      <div className="detail-row">
                        <span className="detail-label">Supported Assets</span>
                        <div className="supported-assets">
                          {asset.supportedAssets.map(
                            (supportedAsset, index) => (
                              <span key={index} className="supported-asset">
                                {supportedAsset}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioDetails;
