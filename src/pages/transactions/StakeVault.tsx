import { CSSProperties, JSX, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { getStakeingBalance, getStakingInfo } from "../../utils/api/staking";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { useAppDrawer } from "../../hooks/drawer";
import { SubmitButton } from "../../components/global/Buttons";
import { FaIcon } from "../../assets/faicon";
import {
  faArrowLeft,
  faLayerGroup,
  faUnlockAlt,
  faCheckCircle,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { techgrityProducts } from "../../components/tabs/Defi";
import { colors } from "../../constants";
import "../../styles/pages/transactions/stakevault.scss";

export default function StakeVault(): JSX.Element {
  const { srcvault } = useParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 1,
    minutes: 22,
    seconds: 0,
  });

  const { data: stakinginfo } = useQuery({
    queryKey: ["stakinginfo"],
    queryFn: getStakingInfo,
  });

  const { data: stakingbalance } = useQuery({
    queryKey: ["stkingbalance"],
    queryFn: getStakeingBalance,
  });

  // Get vault details from techgrityProducts based on srcvault
  const vaultDetails = techgrityProducts.find(
    (product) =>
      product.id === srcvault ||
      product.name.toLowerCase().includes(srcvault || "")
  );

  // Rename "Buffet" to "Sphere Vault"
  const vaultName =
    srcvault === "buffet"
      ? "Sphere Vault"
      : vaultDetails?.name ||
        (srcvault
          ? srcvault.charAt(0).toUpperCase() + srcvault.slice(1)
          : "Stake Vault");

  const isBuffetVault =
    srcvault === "buffet" || vaultDetails?.name.includes("Senior");

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 1, minutes: 22, seconds: 0 }; // Reset timer
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const goBack = () => {
    switchtab("earn");
    navigate("/app");
  };

  const totalLstBalance = stakingbalance?.data?.lstBalance || 0;
  const tokenSymbol = stakinginfo?.data?.tokenSymbol || "LST";

  const apyValue = isBuffetVault ? "11%" : vaultDetails?.apy || "11%";
  const apyClass = isBuffetVault ? "guaranteed" : "";

  useBackButton(goBack);

  return (
    <section id="stakevault">
      <div className="vault-header">
        <button className="back-button" onClick={goBack}>
          <FaIcon
            faIcon={faArrowLeft}
            fontsize={14}
            color={colors.textprimary}
          />
        </button>
        <h1>{vaultName}</h1>
        <div className="network-badge">
          <span>{vaultDetails?.network || "Polygon"}</span>
        </div>
      </div>

      {isBuffetVault && (
        <div className="guaranteed-banner">
          <FaIcon faIcon={faCheckCircle} fontsize={12} color={colors.success} />
          <span>Guaranteed 11% Returns</span>
        </div>
      )}

      <div className="vault-summary">
        <div className="token-stats">
          <div className="balance-section">
            <div className="balance-container">
              <span className="balance-label">Total Staked</span>
              <span className="balance-value">
                {Math.round(Number(totalLstBalance))} {tokenSymbol}
              </span>
              <span className="balance-usd">
                ${Math.round(Number(totalLstBalance))}
              </span>
            </div>

            <div className="apy-container">
              <span className="apy-label">APY</span>
              <span className={`apy-value ${apyClass}`}>
                {apyValue}
                {isBuffetVault && (
                  <span className="guaranteed-badge">Fixed</span>
                )}
              </span>
              {isBuffetVault && (
                <p>TVL ${stakinginfo?.data?.treasuryValue || 0}</p>
              )}
            </div>
          </div>

          <div className="chart-container">
            <LSTChart />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">
              <FaIcon faIcon={faClock} fontsize={12} color={colors.accent} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Next Rebase</span>
              <span className="stat-value">
                {String(timeRemaining.hours).padStart(2, "0")}h{" "}
                {String(timeRemaining.minutes).padStart(2, "0")}m{" "}
                {String(timeRemaining.seconds).padStart(2, "0")}s
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="apy-history">
        <h3 className="section-title">APY History</h3>
        <SimplifiedAPYChart />
      </div>

      <div className="action-buttons">
        <SubmitButton
          text="Stake Now"
          icon={<FaIcon faIcon={faLayerGroup} fontsize={14} color="#FFFFFF" />}
          sxstyles={{ ...stakeButtonStyles }}
          onclick={() => openAppDrawer("stakevault")}
        />
        <SubmitButton
          text="Unstake"
          icon={<FaIcon faIcon={faUnlockAlt} fontsize={14} color="#FFFFFF" />}
          sxstyles={{ ...unstakeButtonStyles }}
          onclick={() => openAppDrawer("unstakevault")}
        />
      </div>
    </section>
  );
}

const LSTChart = () => {
  const data = [
    { name: "A", value: 10 },
    { name: "B", value: 12 },
    { name: "C", value: 15 },
    { name: "D", value: 18 },
    { name: "E", value: 20 },
    { name: "F", value: 22 },
    { name: "G", value: 25 },
    { name: "H", value: 28 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0fb14d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0fb14d" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(33, 33, 33, 0.8)",
            border: "none",
            borderRadius: "4px",
            padding: "6px",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#0fb14d"
          strokeWidth={1.5}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const APYChart = ({ legendTitle }: { legendTitle: string }) => {
  const data = [
    { date: "Feb 15", protocolAPY: 7.5, seniorApy: 11 },
    { date: "Feb 22", protocolAPY: 8.2, seniorApy: 11 },
    { date: "Mar 1", protocolAPY: 7.8, seniorApy: 11 },
    { date: "Mar 8", protocolAPY: 8.5, seniorApy: 11 },
    { date: "Mar 15", protocolAPY: 9.2, seniorApy: 11 },
    { date: "Mar 22", protocolAPY: 8.7, seniorApy: 11 },
    { date: "Mar 29", protocolAPY: 9.5, seniorApy: 11 },
    { date: "Apr 5", protocolAPY: 10.2, seniorApy: 11 },
  ];

  return (
    <div className="apy-chart-container">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255, 255, 255, 0.1)"
          />
          <XAxis
            dataKey="date"
            stroke="rgba(255, 255, 255, 0.6)"
            style={{ fontSize: "0.7rem" }}
            tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.6)"
            style={{ fontSize: "0.7rem" }}
            tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(33, 33, 33, 0.8)",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              padding: "8px",
            }}
            formatter={(value) => [`${value}%`, ``]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: "0.75rem", paddingTop: "10px" }}
          />
          <Line
            type="monotone"
            dataKey="protocolAPY"
            name="Protocol APY"
            stroke="#496bcc"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="seniorApy"
            name={legendTitle}
            stroke="#0fb14d"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SimplifiedAPYChart = () => {
  const [activeChart, setActiveChart] = useState("apy");

  const data = [
    {
      date: "Feb 15",
      apy: 11.5,
      competitors: 4.2,
      treasury: 8.5,
      backing: 1.52,
    },
    {
      date: "Feb 22",
      apy: 12.3,
      competitors: 3.8,
      treasury: 10.8,
      backing: 1.55,
    },
    {
      date: "Mar 1",
      apy: 11.8,
      competitors: 4.0,
      treasury: 14.2,
      backing: 1.58,
    },
    {
      date: "Mar 8",
      apy: 13.0,
      competitors: 4.5,
      treasury: 19.6,
      backing: 1.61,
    },
    {
      date: "Mar 15",
      apy: 12.2,
      competitors: 5.0,
      treasury: 28.0,
      backing: 1.63,
    },
    {
      date: "Mar 22",
      apy: 11.7,
      competitors: 4.8,
      treasury: 39.5,
      backing: 1.67,
    },
    {
      date: "Mar 29",
      apy: 12.8,
      competitors: 4.2,
      treasury: 58.2,
      backing: 1.72,
    },
    {
      date: "Apr 5",
      apy: 12.5,
      competitors: 3.9,
      treasury: 82.0,
      backing: 1.78,
    },
  ];

  // Portfolio distribution data
  const distributionData = [
    { name: "Mantra", value: 30 },
    { name: "Berachain", value: 30 },
    { name: "Aave", value: 22 },
    { name: "Compound", value: 18 },
    { name: "Uniswap", value: 15 },
    { name: "Curve", value: 12 },
    { name: "MakerDAO", value: 10 },
    { name: "Balancer", value: 8 },
    { name: "Others", value: 15 },
  ];

  const renderChart = () => {
    switch (activeChart) {
      case "apy":
        return (
          <>
            <YAxis
              stroke="rgba(255, 255, 255, 0.6)"
              style={{ fontSize: "0.7rem" }}
              tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 14]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(33, 33, 33, 0.8)",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
                padding: "8px",
              }}
              formatter={(value, name) => {
                if (name === "apy") return [`${value}%`, "Sphere Vault"];
                if (name === "competitors")
                  return [`${value}%`, "Other Protocols"];
                return [value, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: "0.75rem", paddingTop: "10px" }}
            />
            <Line
              type="monotone"
              dataKey="apy"
              name="Sphere Vault"
              stroke="#0fb14d"
              strokeWidth={3}
              dot={{ stroke: "#0fb14d", strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="competitors"
              name="Other Protocols"
              stroke="#888"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={{ stroke: "#888", strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4 }}
            />
          </>
        );
      case "treasury":
        return (
          <>
            <YAxis
              stroke="rgba(255, 255, 255, 0.6)"
              style={{ fontSize: "0.7rem" }}
              tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
              tickFormatter={(value) => `$${value}M`}
              domain={[0, 90]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(33, 33, 33, 0.8)",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
                padding: "8px",
              }}
              formatter={(value) => [`$${value}M`, "Treasury Value"]}
            />
            <Area
              type="monotone"
              dataKey="treasury"
              name="Treasury Value"
              stroke="#496bcc"
              strokeWidth={3}
              fillOpacity={0.5}
              fill="url(#colorTreasury)"
              dot={{ stroke: "#496bcc", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 7, stroke: "#496bcc", strokeWidth: 2 }}
            />
          </>
        );
      case "backing":
        return (
          <>
            <YAxis
              stroke="rgba(255, 255, 255, 0.6)"
              style={{ fontSize: "0.7rem" }}
              tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
              tickFormatter={(value) => `${value}x`}
              domain={[1.5, 1.8]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(33, 33, 33, 0.8)",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
                padding: "8px",
              }}
              formatter={(value) => [`${value}x`, "Total Backing"]}
            />
            <Line
              type="monotone"
              dataKey="backing"
              name="Total Backing"
              stroke="#e6b11e"
              strokeWidth={3}
              dot={{ stroke: "#e6b11e", strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6 }}
            />
          </>
        );
      case "distribution":
        return (
          <div className="distribution-container">
            {distributionData.map((item, index) => (
              <div className="distribution-item" key={index}>
                <div className="distribution-bar-container">
                  <div
                    className="distribution-bar"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: getDistributionColor(index),
                    }}
                  />
                </div>
                <div className="distribution-label">
                  <span className="protocol-name">{item.name}</span>
                  <span className="protocol-value">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const getDistributionColor = (index: number) => {
    const colors = [
      "#0fb14d", // green
      "#496bcc", // blue
      "#e6b11e", // amber
      "#a459d1", // purple
      "#e34935", // red
      "#2684ff", // bright blue
      "#bfbfbf", // gray
    ];
    return colors[index % colors.length];
  };

  const getChartFooter = () => {
    switch (activeChart) {
      case "apy":
        return "* Sphere Vault consistently outperforms other protocols by 2-3x";
      case "treasury":
        return "* Treasury value growing exponentially, ensuring long-term stability";
      case "backing":
        return "* Each token is backed by >150% of its value for enhanced security";
      case "distribution":
        return "* Diversified portfolio across leading DeFi protocols reduces risk";
      default:
        return "";
    }
  };

  return (
    <div className="apy-chart-container">
      <div className="chart-tabs">
        <button
          className={`chart-tab ${activeChart === "apy" ? "active" : ""}`}
          onClick={() => setActiveChart("apy")}
        >
          APY
        </button>
        <button
          className={`chart-tab ${activeChart === "treasury" ? "active" : ""}`}
          onClick={() => setActiveChart("treasury")}
        >
          Treasury
        </button>
        <button
          className={`chart-tab ${activeChart === "backing" ? "active" : ""}`}
          onClick={() => setActiveChart("backing")}
        >
          Backing
        </button>
        <button
          className={`chart-tab ${
            activeChart === "distribution" ? "active" : ""
          }`}
          onClick={() => setActiveChart("distribution")}
        >
          Allocation
        </button>
      </div>

      {activeChart !== "distribution" ? (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorTreasury" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#496bcc" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#496bcc" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255, 255, 255, 0.1)"
            />
            <XAxis
              dataKey="date"
              stroke="rgba(255, 255, 255, 0.6)"
              style={{ fontSize: "0.65rem" }}
              tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
            />
            {activeChart === "treasury" ? (
              <YAxis
                scale="pow"
                stroke="rgba(255, 255, 255, 0.6)"
                style={{ fontSize: "0.65rem" }}
                tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
                tickFormatter={(value) => `$${value}M`}
                domain={[0, 90]}
              />
            ) : (
              renderChart()
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="distribution-chart">{renderChart()}</div>
      )}

      <div className="chart-footer">
        <p>{getChartFooter()}</p>
      </div>
    </div>
  );
};

const stakeButtonStyles: CSSProperties = {
  flex: 1,
  padding: "0.75rem",
  borderRadius: "0.75rem",
  backgroundColor: colors.success,
  fontSize: "0.9rem",
  fontWeight: "600",
  boxShadow: "0 4px 12px rgba(15, 177, 77, 0.25)",
};

const unstakeButtonStyles: CSSProperties = {
  flex: 1,
  padding: "0.75rem",
  borderRadius: "0.75rem",
  backgroundColor: "rgba(73, 107, 204, 0.8)",
  fontSize: "0.9rem",
  fontWeight: "600",
  boxShadow: "0 4px 12px rgba(73, 107, 204, 0.25)",
};
