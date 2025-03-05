import { JSX, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { coinType, stakeproducttype, yieldtokentype } from "../../types/earn";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { fetchCoins } from "../../utils/api/market";
import mantraLogo from "../../assets/images/labs/mantralogo.jpeg";
import { formatUsd, formatLargeUsd } from "../../utils/formatters";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChartArea,
  faChartBar,
  faChartLine,
  faChevronDown,
  faCoins,
  faExchangeAlt,
  faGem,
  faLock,
  faPercent,
  faSearch,
  faShieldAlt,
  faCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/components/tabs/defitab.scss";
import { createChart, IChartApi, ISeriesApi, Time } from "lightweight-charts";

// Product filter types
type ProductFilterType = "all" | "yield" | "amm" | "tokens";

// Extended types for Sphere Vaults
type VaultStrategyType = "index" | "buffet" | "degen";

// Chart type toggle
type ChartType = "tvl" | "apy";

interface SphereVaultType extends stakeproducttype {
  strategy: VaultStrategyType;
  description: string;
  historicalYield: number[];
  risk: "low" | "medium" | "high";
  tvlHistory: number[];
  apyHistory: number[];
  popularity: number;
  lockPeriod?: string;
}

// Extended product type to include provider information
interface Product {
  id: string;
  type: "vault" | "staking" | "amm" | "token";
  provider: "sphere" | "techgrity" | "stratox";
  data: any;
  popularity: number;
}

// Define the PremiumModal component at the top of the file
interface PremiumModalProps {
  onClose: () => void;
  onGoToPremium: () => void;
}

// Update the coinType interface to include selectedTimeframe
interface ExtendedCoinType extends coinType {
  selectedTimeframe?: string; // Add this property
}

export const DefiTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const [activeFilter, setActiveFilter] = useState<ProductFilterType>("all");
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [activeChartType, setActiveChartType] = useState<ChartType>("tvl");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [expandedTokenChart, setExpandedTokenChart] = useState<string | null>(
    null
  );
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);

  const { data, isLoading } = useQuery({
    queryKey: ["coins"],
    queryFn: fetchCoins,
    refetchInterval: 3000,
  });

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  // Fix premium page navigation - navigate to Premium page to show benefits
  const goToPremium = () => {
    // Navigate to the Premium page with a return path parameter
    navigate("/premiums?returnPath=defi");
  };

  const filterProducts = (filterType: ProductFilterType) => {
    setActiveFilter(filterType);
  };

  // Function to handle staking with premium option
  const handleStakeClick = (productName: string) => {
    // Show premium options modal
    console.log(`Starting staking process for: ${productName}`);
  };

  const handleBoostedStakeClick = () => {
    setShowPremiumModal(true);
  };

  const closePremiumModal = () => {
    setShowPremiumModal(false);
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
    // Reset token chart expansion when collapsing card
    setExpandedTokenChart(null);
  };

  // Navigate to individual token page
  const navigateToToken = (tokenId: string) => {
    navigate(`/coin/${tokenId}`);
  };

  const toggleChartType = () => {
    setActiveChartType((prev) => (prev === "tvl" ? "apy" : "tvl"));
  };

  // Function to draw line chart (TVL or APY)
  const renderChart = (
    tvlData: number[],
    apyData: number[],
    _providerClass: string
  ) => {
    if (!tvlData || !apyData || tvlData.length === 0 || apyData.length === 0)
      return null;

    const data = activeChartType === "tvl" ? tvlData : apyData;
    const width = 100;
    const height = 60;
    const padding = 10;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Find min and max for scaling
    const max = Math.max(...data);
    const min = Math.min(...data);

    // Generate path
    const points = data.map((val, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y =
        height - padding - ((val - min) / (max - min || 1)) * chartHeight;
      return `${x},${y}`;
    });

    const linePath = `M ${points.join(" L ")}`;

    // Area under the curve
    const areaPath = `${linePath} L ${width - padding},${
      height - padding
    } L ${padding},${height - padding} Z`;

    // Determine chart color based on chart type rather than provider
    const chartColor = activeChartType === "tvl" ? "#4a90e2" : "#4caf50";
    const chartAreaOpacity = 0.1;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="rgba(150,150,150,0.1)"
          strokeWidth="0.5"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="rgba(150,150,150,0.1)"
          strokeWidth="0.5"
        />

        {/* Area and line - Use chart type color instead of provider class */}
        <path d={areaPath} fill={chartColor} fillOpacity={chartAreaOpacity} />
        <path d={linePath} stroke={chartColor} strokeWidth="1" fill="none" />
      </svg>
    );
  };

  // Function to render token price candlestick chart
  const renderTokenChart = (coin: ExtendedCoinType) => {
    // Create a ref for the chart container
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    // Initialize the selected timeframe if not set
    if (!coin.selectedTimeframe) {
      coin.selectedTimeframe = "7D";
    }

    useEffect(() => {
      if (!chartContainerRef.current) return;

      // Clean up previous chart if it exists
      if (chartRef.current) {
        chartRef.current.remove();
      }

      // Initialize the chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: "#999",
        },
        grid: {
          vertLines: { color: "rgba(150, 150, 150, 0.1)" },
          horzLines: { color: "rgba(150, 150, 150, 0.1)" },
        },
        width: chartContainerRef.current.clientWidth,
        height: 120, // Updated height to match CSS
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: "rgba(150, 150, 150, 0.1)",
        },
        rightPriceScale: {
          borderColor: "rgba(150, 150, 150, 0.1)",
        },
      });

      // Create the candlestick series with colors matching our button styling
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#4caf50",
        downColor: "#f44336",
        borderVisible: false,
        wickUpColor: "#4caf50",
        wickDownColor: "#f44336",
      });

      // Generate mock price data
      const data = generateMockPriceData();

      // Set the data
      candlestickSeries.setData(data);

      // Store references
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;

      // Fit content
      chart.timeScale().fitContent();

      // Clean up on unmount
      return () => {
        chart.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      };
    }, [coin.selectedTimeframe, forceUpdate]); // Add forceUpdate to dependencies

    // Generate mock price data based on current price and timeframe
    const generateMockPriceData = () => {
      const currentPrice = coin.current_price;
      const priceChange = coin.price_change_percentage_24h / 100;
      const timeframe = coin.selectedTimeframe || "7D";

      // Determine number of data points based on timeframe
      let dataPoints = 30;
      switch (timeframe) {
        case "1D":
        case "24H":
          dataPoints = 24;
          break;
        case "1W":
        case "7D":
          dataPoints = 7;
          break;
        case "1M":
        case "30D":
          dataPoints = 30;
          break;
        case "3M":
        case "90D":
          dataPoints = 90;
          break;
        case "1Y":
          dataPoints = 365;
          break;
        default:
          dataPoints = 30;
      }

      // Generate data
      const data = [];
      const now = new Date();
      const volatility = Math.abs(priceChange) * 2 || 0.02;

      // Calculate starting price based on price change
      const startPrice = currentPrice / (1 + priceChange);

      for (let i = 0; i < dataPoints; i++) {
        const date = new Date();

        // Adjust date based on timeframe
        switch (timeframe) {
          case "1D":
            date.setHours(now.getHours() - (dataPoints - i));
            break;
          case "1W":
            date.setDate(now.getDate() - (dataPoints - i));
            break;
          case "1M":
            date.setDate(now.getDate() - (dataPoints - i));
            break;
          case "3M":
            date.setDate(now.getDate() - (dataPoints - i));
            break;
          case "1Y":
            date.setDate(now.getDate() - (dataPoints - i));
            break;
          default:
            date.setDate(now.getDate() - (dataPoints - i));
        }

        // Calculate price movement
        const randomFactor = (Math.random() - 0.5) * volatility;
        const progressFactor = i / dataPoints;
        const trendFactor = priceChange * progressFactor;

        // Calculate open, high, low, close prices
        const openPrice: number = i === 0 ? startPrice : data[i - 1].close;

        const closePrice: number =
          i === dataPoints - 1
            ? currentPrice
            : openPrice * (1 + randomFactor + trendFactor);

        const highPrice: number =
          Math.max(openPrice, closePrice) *
          (1 + Math.random() * volatility * 0.5);
        const lowPrice: number =
          Math.min(openPrice, closePrice) *
          (1 - Math.random() * volatility * 0.5);

        data.push({
          time: (date.getTime() / 1000) as Time,
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          close: closePrice,
        });
      }

      return data;
    };

    return (
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    );
  };

  // Create a combined array of all products for "all" view
  const getAllProducts = (): Product[] => {
    const products: Product[] = [];

    // Add Sphere Vaults
    sphereVaults.forEach((vault, index) => {
      products.push({
        id: `vault-${index}`,
        type: "vault",
        provider: "sphere",
        data: vault,
        popularity: vault.popularity,
      });
    });

    // Add Techgrity Staking Products
    techgrityProducts.forEach((product, index) => {
      products.push({
        id: `staking-${index}`,
        type: "staking",
        provider: "techgrity",
        data: product,
        popularity: product.popularity,
      });
    });

    // Add AMM Pools
    ammPools.forEach((pool, index) => {
      products.push({
        id: `amm-${index}`,
        type: "amm",
        provider: "stratox",
        data: pool,
        popularity: pool.popularity,
      });
    });

    // Add Tokens
    if (!isLoading && data) {
      (data as coinType[]).slice(0, 6).forEach((coin, index) => {
        // Use index + a base value as popularity since market_cap_rank may not exist
        const tokenPopularity = (index + 1) * 10; // Give some spacing in popularity rankings
        products.push({
          id: `token-${coin.id}`,
          type: "token",
          provider: "stratox",
          data: coin,
          popularity: tokenPopularity, // Use generated popularity
        });
      });
    }

    // Sort by popularity (lower number = more popular)
    return products.sort((a, b) => a.popularity - b.popularity);
  };

  // Filter products based on active filter
  const getFilteredProducts = (): Product[] => {
    if (activeFilter === "all") {
      return getAllProducts();
    }

    // Fix filtering to properly identify yield products
    if (activeFilter === "yield") {
      return getAllProducts().filter(
        (product) => product.type === "vault" || product.type === "staking"
      );
    }

    if (activeFilter === "tokens") {
      // Ensure token products are displayed
      return getAllProducts().filter((product) => product.type === "token");
    }

    return getAllProducts().filter((product) => product.type === activeFilter);
  };

  // Add a function to handle showing the coming soon message
  const handleShowComingSoon = (id: string) => {
    setShowComingSoon(id);
    setTimeout(() => setShowComingSoon(null), 3000);
  };

  useBackButton(goBack);

  return (
    <section id="defitab">
      <div className="defi-header">
        <h1 className="title">DeFi Hub</h1>
        <div className="premium-boost" onClick={goToPremium}>
          <FontAwesomeIcon icon={faGem} className="gem-icon" />
          <span>+2% Yield Boost</span>
          <FontAwesomeIcon icon={faArrowRight} className="arrow-icon" />
        </div>
      </div>

      {/* Navigation filter */}
      <div className="filter-navigation">
        <button
          className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => filterProducts("all")}
        >
          <FontAwesomeIcon icon={faSearch} />
          <span>All Products</span>
        </button>
        <button
          className={`filter-btn yield-btn ${
            activeFilter === "yield" ? "active" : ""
          }`}
          onClick={() => filterProducts("yield")}
        >
          <FontAwesomeIcon icon={faPercent} />
          <span>Yield</span>
        </button>
        <button
          className={`filter-btn amm-btn ${
            activeFilter === "amm" ? "active" : ""
          }`}
          onClick={() => filterProducts("amm")}
        >
          <FontAwesomeIcon icon={faExchangeAlt} />
          <span>AMM</span>
        </button>
        <button
          className={`filter-btn token-btn ${
            activeFilter === "tokens" ? "active" : ""
          }`}
          onClick={() => filterProducts("tokens")}
        >
          <FontAwesomeIcon icon={faCoins} />
          <span>Tokens</span>
        </button>
      </div>

      {/* Products section - unified list for "all" view */}
      <div className="products-container">
        <div className="products-list">
          {getFilteredProducts().map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              type={product.type}
              provider={product.provider}
              data={product.data}
              isExpanded={expandedCards.includes(product.id)}
              toggleExpansion={() => toggleCardExpansion(product.id)}
              onAction={
                product.type === "token" ? navigateToToken : handleStakeClick
              }
              onBoostedStake={handleBoostedStakeClick}
              renderChart={renderChart}
              renderTokenChart={renderTokenChart}
              showTokenChart={
                expandedTokenChart ===
                (product.type === "token" ? product.data.id : null)
              }
              showComingSoon={showComingSoon === product.id}
              filterType={activeFilter}
              activeChartType={activeChartType}
              toggleChartType={toggleChartType}
              onShowComingSoon={handleShowComingSoon}
              onGoToPremium={() => setShowPremiumModal(true)}
              setForceUpdate={setForceUpdate}
            />
          ))}
        </div>
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <PremiumModal onClose={closePremiumModal} onGoToPremium={goToPremium} />
      )}
    </section>
  );
};

// Unified product card component
const ProductCard = ({
  id,
  type,
  provider,
  data,
  isExpanded,
  toggleExpansion,
  onAction,
  onBoostedStake,
  renderChart,
  renderTokenChart,
  showTokenChart,
  showComingSoon,
  activeChartType,
  toggleChartType,
  onShowComingSoon,
  setForceUpdate,
}: {
  id: string;
  type: "vault" | "staking" | "amm" | "token";
  provider: "sphere" | "techgrity" | "stratox";
  data: any;
  isExpanded: boolean;
  toggleExpansion: () => void;
  onAction: (id: string) => void;
  onBoostedStake: () => void;
  renderChart: (
    tvlData: number[],
    apyData: number[],
    providerClass: string
  ) => JSX.Element | null;
  renderTokenChart: (coin: ExtendedCoinType) => JSX.Element;
  showTokenChart: boolean;
  showComingSoon: boolean;
  filterType: ProductFilterType;
  activeChartType: ChartType;
  toggleChartType: () => void;
  onShowComingSoon: (id: string) => void;
  onGoToPremium: () => void;
  setForceUpdate: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element => {
  // Default chart data if not available
  const defaultTVLData = [
    100000, 120000, 115000, 140000, 160000, 155000, 180000,
  ];
  const defaultAPYData = [9, 10.5, 9.8, 11.2, 12.5, 11.9, 13];

  // Get correct data to display
  const getName = () => {
    if (type === "token") {
      return data.name;
    }
    return data.name;
  };

  // Get fixed APY display instead of ranges
  const getApyDisplay = () => {
    if (type === "token") {
      return null;
    }

    if (type === "amm") {
      return `${data.apy}%`;
    }

    // For vault and staking, extract fixed APY values
    if (type === "staking") {
      if (data.name === "Super Senior") {
        return "Fixed 11%";
      } else if (data.name === "Variable APY") {
        return "30%";
      }
    }

    // For vaults, use the middle of the range
    if (type === "vault") {
      if (data.name === "Index Vault") {
        return "13%";
      } else if (data.name === "Buffet Vault") {
        return "17%";
      } else if (data.name === "Degen Vault") {
        return "31%";
      }
    }

    return data.apy;
  };

  // Get tag text
  const getTagText = () => {
    switch (type) {
      case "vault":
      case "staking":
        return "YIELD";
      case "amm":
        return "AMM";
      case "token":
        return "TOKEN";
      default:
        return "";
    }
  };

  // Get tag class - use classes that match filter buttons
  const getTagClass = () => {
    if (type === "vault" || type === "staking") {
      return "yield-tag";
    }
    if (type === "amm") {
      return "amm-tag";
    }
    if (type === "token") {
      return "token-tag";
    }
    return "";
  };

  // Get risk class for coloring risk levels
  const getRiskClass = () => {
    if (type === "vault") {
      return `risk-${data.risk}`;
    }
    return "";
  };

  // Get provider display name
  const getProviderDisplay = () => {
    switch (provider) {
      case "sphere":
        return "Sphere";
      case "techgrity":
        return "Techgrity";
      case "stratox":
        return "StratoX";
      default:
        return "";
    }
  };

  // Update the action button click handler
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === "token") {
      // Show coming soon toast for token trade
      onShowComingSoon(id);
    } else {
      onAction(data.name);
    }
  };

  // Render different content based on product type
  const renderCardContent = () => {
    return (
      <>
        <div className="card-main-content">
          <div className="card-left">
            <div className={`tag ${getTagClass()}`}>{getTagText()}</div>

            <div className="card-header">
              <div className="title-container">
                {type === "token" && (
                  <img
                    src={data.image}
                    alt={data.name}
                    className="product-logo"
                  />
                )}
                {type === "amm" && (
                  <img src={mantraLogo} alt="Mantra" className="product-logo" />
                )}
                <h3>{getName()}</h3>
              </div>

              <div className={`provider-label ${provider}`}>
                <FontAwesomeIcon
                  icon={
                    provider === "sphere"
                      ? faCircle
                      : provider === "techgrity"
                      ? faShieldAlt
                      : faExchangeAlt
                  }
                />
                <span>{getProviderDisplay()}</span>
              </div>
            </div>

            {type === "vault" && !isExpanded && (
              <div className={`risk-indicator ${getRiskClass()}`}>
                {data.risk.toUpperCase()} RISK
              </div>
            )}
          </div>

          <div className="card-center">
            {type === "vault" && !isExpanded && (
              <p className="card-description">{data.description}</p>
            )}
          </div>

          <div className="card-right">
            {getApyDisplay() && (
              <div className="card-apy">{getApyDisplay()}</div>
            )}

            {type === "token" && (
              <div className="token-price">
                <div className="current-price">
                  {formatUsd(data.current_price)}
                </div>
                <div
                  className={`price-change ${
                    data.price_change_percentage_24h < 0
                      ? "negative"
                      : "positive"
                  }`}
                >
                  {data.price_change_percentage_24h > 0
                    ? `+${data.price_change_percentage_24h.toFixed(2)}%`
                    : `${data.price_change_percentage_24h.toFixed(2)}%`}
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button
                className={`primary-action ${type}`}
                onClick={handleActionClick}
              >
                {type === "token"
                  ? "Trade"
                  : type === "amm"
                  ? "Liquidity"
                  : "Stake"}
              </button>

              {/* Expand/collapse button for all card types */}
              <button
                className={`expand-button ${isExpanded ? "expanded" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion();
                }}
              >
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded content for all card types */}
        {isExpanded && (
          <div className="card-expanded-content">
            <div className="expanded-left">
              <div className="detailed-info">
                <p className="card-description">{data.description}</p>

                <div className="detail-row">
                  {(type === "vault" || type === "staking") && (
                    <>
                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faChartLine} /> Strategy
                        </div>
                        <div className="detail-value">
                          {data.strategy === "index" && "Index"}
                          {data.strategy === "buffet" && "Buffet"}
                          {data.strategy === "degen" && "Degen"}
                          {!data.strategy && "Standard"}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faChartBar} /> Risk Level
                        </div>
                        <div
                          className={`detail-value risk-${
                            data.risk || "medium"
                          }`}
                        >
                          {data.risk
                            ? data.risk.charAt(0).toUpperCase() +
                              data.risk.slice(1)
                            : "Medium"}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faExchangeAlt} /> Network
                        </div>
                        <div className="detail-value">
                          {data.network || "Ethereum"}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faCoins} /> Current TVL
                        </div>
                        <div className="detail-value">
                          {formatUsd(data.tvl || 1250000)}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faLock} /> Unstaking Period
                        </div>
                        <div className="detail-value">
                          {data.lockPeriod || "7 days"}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faChartBar} /> Max Capacity
                        </div>
                        <div className="detail-value">
                          {formatUsd(
                            typeof data.maxCapacity === "string"
                              ? parseFloat(
                                  data.maxCapacity.replace(/[^0-9.]/g, "")
                                )
                              : data.maxCapacity || 5000000
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {type === "token" && (
                    <>
                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faChartBar} /> Market Cap
                        </div>
                        <div className="detail-value">
                          {formatLargeUsd(data.market_cap)}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faExchangeAlt} /> 24h Volume
                        </div>
                        <div className="detail-value">
                          {formatLargeUsd(data.total_volume)}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faCoins} /> Symbol
                        </div>
                        <div className="detail-value">
                          {data.symbol.toUpperCase()}
                        </div>
                      </div>
                    </>
                  )}

                  {type === "amm" && (
                    <>
                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faExchangeAlt} /> Pair
                        </div>
                        <div className="detail-value">
                          {data.pair || "ETH/USDC"}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faCoins} /> Liquidity
                        </div>
                        <div className="detail-value">
                          {formatUsd(data.liquidity || 2500000)}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faExchangeAlt} /> Network
                        </div>
                        <div className="detail-value">
                          {data.network || "Ethereum"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="expanded-right">
              {type !== "token" && (
                <div className="chart-container">
                  <div className="chart-header">
                    <span className="chart-label">
                      {activeChartType === "tvl"
                        ? "TVL History"
                        : "APY History"}
                    </span>

                    {/* Improved chart type toggle */}
                    <div className="chart-toggle-group">
                      <button
                        className={`chart-toggle-btn ${
                          activeChartType === "tvl" ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChartType();
                        }}
                      >
                        <FontAwesomeIcon icon={faChartArea} />
                        <span>TVL</span>
                      </button>
                      <button
                        className={`chart-toggle-btn ${
                          activeChartType === "apy" ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChartType();
                        }}
                      >
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>APY</span>
                      </button>
                    </div>
                  </div>

                  {renderChart(
                    type === "vault" || type === "staking"
                      ? data.tvlHistory || defaultTVLData
                      : type === "amm"
                      ? data.tvlHistory || defaultTVLData
                      : defaultTVLData,

                    type === "vault" || type === "staking"
                      ? data.apyHistory || defaultAPYData
                      : type === "amm"
                      ? data.apyHistory || defaultAPYData
                      : defaultAPYData,

                    provider
                  )}

                  <div className="chart-info">
                    <span className="info-label">
                      {activeChartType === "tvl"
                        ? "Current TVL:"
                        : "Current APY:"}
                    </span>
                    <span className="info-value">
                      {activeChartType === "tvl"
                        ? data.currentTvl ||
                          formatUsd(
                            data.tvlHistory?.[data.tvlHistory.length - 1] || 0
                          )
                        : getApyDisplay()}
                    </span>
                  </div>
                </div>
              )}

              {/* Token chart container with timeframe buttons */}
              {type === "token" && isExpanded && (
                <div className="token-chart-container">
                  <div className="chart-header">
                    <span className="chart-label">Price History</span>
                  </div>
                  <div className="chart-content">{renderTokenChart(data)}</div>
                  <div className="dayscount">
                    <button
                      className={
                        data.selectedTimeframe === "1D" ? "selecteddays" : ""
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        data.selectedTimeframe = "1D";
                        setForceUpdate((prev) => !prev);
                      }}
                    >
                      24H
                    </button>
                    <button
                      className={
                        data.selectedTimeframe === "1W" ? "selecteddays" : ""
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        data.selectedTimeframe = "1W";
                        setForceUpdate((prev) => !prev);
                      }}
                    >
                      7D
                    </button>
                    <button
                      className={
                        data.selectedTimeframe === "1M" ? "selecteddays" : ""
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        data.selectedTimeframe = "1M";
                        setForceUpdate((prev) => !prev);
                      }}
                    >
                      30D
                    </button>
                    <button
                      className={
                        data.selectedTimeframe === "3M" ? "selecteddays" : ""
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        data.selectedTimeframe = "3M";
                        setForceUpdate((prev) => !prev);
                      }}
                    >
                      90D
                    </button>
                    <button
                      className={
                        data.selectedTimeframe === "1Y" ? "selecteddays" : ""
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        data.selectedTimeframe = "1Y";
                        setForceUpdate((prev) => !prev);
                      }}
                    >
                      1Y
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons - Only show boosted stake for vault and staking products */}
              <div className="action-buttons-expanded">
                <button className="standard-action" onClick={handleActionClick}>
                  {type === "token"
                    ? "Trade"
                    : type === "amm"
                    ? "Liquidity"
                    : "Stake"}
                </button>

                {(type === "vault" || type === "staking") && (
                  <button
                    className="boosted-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBoostedStake();
                    }}
                  >
                    <FontAwesomeIcon icon={faGem} />
                    <span>+2% Boosted Stake</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className={`product-card ${provider} ${
        isExpanded ? "expanded" : ""
      } ${type} ${getRiskClass()} ${showTokenChart ? "token-expanded" : ""}`}
      onClick={() => !isExpanded && toggleExpansion()}
    >
      {showComingSoon && (
        <div className="coming-soon-overlay">
          <div className="coming-soon-message">Coming Soon</div>
        </div>
      )}
      {renderCardContent()}
    </div>
  );
};

// Update the premium modal component
const PremiumModal: React.FC<PremiumModalProps> = ({
  onClose,
  onGoToPremium,
}) => {
  return (
    <div className="premium-modal" onClick={onClose}>
      <div
        className="premium-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <FontAwesomeIcon icon={faGem} className="premium-icon" />
        <h3>Unlock Premium Features</h3>
        <p>
          Subscribe to Sphere Premium to access boosted staking rates and
          exclusive features. Get +2% APY on all your staking positions!
        </p>
        <button className="subscribe-button" onClick={onGoToPremium}>
          Subscribe Now
        </button>
      </div>
    </div>
  );
};

// Sample data for Techgrity staking products
const techgrityProducts: (stakeproducttype & {
  popularity: number;
  apyHistory?: number[];
  tvlHistory?: number[];
  lockPeriod?: string;
  minDeposit?: number;
  hasMonthlyDividend?: boolean;
})[] = [
  {
    name: "Techgrity Super Senior",
    apy: "Fixed 11%",
    currentTvl: "$26,000,000",
    maxCapacity: "$26,000,000",
    network: "Techgrity",
    lockPeriod: "7 days",
    minDeposit: 100,
    hasMonthlyDividend: false,
    popularity: 2, // 2nd most popular
    apyHistory: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    tvlHistory: [10000000, 15000000, 18000000, 22000000, 24000000, 26000000],
  },
  {
    name: "Techgrity Junior",
    apy: "29%",
    currentTvl: "$25,000,000",
    maxCapacity: "$25,000,000",
    network: "Techgrity",
    lockPeriod: "7 days",
    minDeposit: 50,
    hasMonthlyDividend: true,
    popularity: 4, // 4th most popular
    apyHistory: [8, 8.2, 8.5, 8.8, 9, 9.2, 9, 8.9, 9.1, 9.2, 9, 9],
    tvlHistory: [8000000, 12000000, 16000000, 20000000, 22000000, 25000000],
  },
];

// Sample data for AMM Pools
const ammPools: (yieldtokentype & {
  popularity: number;
  apyHistory?: number[];
  tvlHistory?: number[];
  lockPeriod?: string;
})[] = [
  {
    name: "PST / WUSD",
    apy: 15,
    hasMonthlyDividend: true,
    minDeposit: 250,
    minLockPeriod: null,
    lockPeriod: "7 days",
    popularity: 4, // 4th most popular
    apyHistory: [12, 13, 14.5, 15, 15.5, 14.8, 15, 15.2, 14.9, 15.3, 15.1, 15],
    tvlHistory: [8000000, 9500000, 10200000, 11000000, 12500000, 13800000],
  },
  {
    name: "PST / USDC",
    apy: 13,
    hasMonthlyDividend: true,
    minDeposit: 200,
    minLockPeriod: null,
    lockPeriod: "7 days",
    popularity: 6, // 6th most popular
    apyHistory: [13, 14, 15, 14.5, 15.2, 15.5, 15, 14.8, 15.3, 15.7, 15.2, 15],
    tvlHistory: [7000000, 8500000, 9300000, 10100000, 11200000, 12500000],
  },
];

// Sample data for Sphere Vaults
const sphereVaults: SphereVaultType[] = [
  {
    name: "Index Vault",
    strategy: "index",
    description: "Diversified investments in top market cap tokens",
    apy: "13%",
    currentTvl: "$15,432,678",
    maxCapacity: "$30,000,000",
    network: "Sphere",
    historicalYield: [11.2, 12.5, 11.8, 13.6, 14.8, 13.2],
    risk: "low",
    tvlHistory: [5000000, 7500000, 10000000, 12500000, 14000000, 15432678],
    apyHistory: [
      10, 11.5, 12.2, 13.4, 12.8, 13.1, 13, 12.7, 12.9, 13.2, 13.1, 13,
    ],
    popularity: 1, // Most popular
    lockPeriod: "7 days",
  },
  {
    name: "Buffet Vault",
    strategy: "buffet",
    description:
      "Value investing in underpriced tokens with strong fundamentals",
    apy: "17%",
    currentTvl: "$8,765,432",
    maxCapacity: "$20,000,000",
    network: "Sphere",
    historicalYield: [14.3, 16.8, 18.2, 17.5, 19.6, 20.1],
    risk: "medium",
    tvlHistory: [2000000, 3500000, 5000000, 6500000, 7800000, 8765432],
    apyHistory: [
      15.5, 16.2, 16.8, 17.4, 17.2, 16.9, 17, 17.5, 16.5, 16.8, 17.2, 17,
    ],
    popularity: 3, // 3rd most popular
    lockPeriod: "7 days",
  },
  {
    name: "Degen Vault",
    strategy: "degen",
    description: "High-risk high-reward AMM investments for maximum yield",
    apy: "31%",
    currentTvl: "$5,432,109",
    maxCapacity: "$10,000,000",
    network: "Sphere",
    historicalYield: [25.6, 32.4, 28.9, 35.6, 30.2, 38.7],
    risk: "high",
    tvlHistory: [1000000, 2000000, 3500000, 4200000, 5000000, 5432109],
    apyHistory: [28, 30, 29.5, 32, 33.5, 30.8, 31, 32.5, 31.2, 29.8, 30.5, 31],
    popularity: 7, // Least popular
    lockPeriod: "7 days",
  },
];
