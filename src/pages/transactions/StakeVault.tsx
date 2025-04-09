import { JSX, useState, useEffect } from "react";
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

  const vaultDetails = techgrityProducts.find(
    (product) =>
      product.id === srcvault ||
      product.name.toLowerCase().includes(srcvault || "")
  );

  const vaultName =
    srcvault === "buffet"
      ? "Sphere Vault"
      : vaultDetails?.name ||
        (srcvault
          ? srcvault.charAt(0).toUpperCase() + srcvault.slice(1)
          : "Stake Vault");

  const isBuffetVault =
    srcvault === "buffet" || vaultDetails?.name.includes("Senior");

  const convertTime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;

    const hours = Math.floor(seconds / (60 * 60));
    seconds %= 60 * 60;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return `${days} days, ${hours} hours, ${minutes} minutes`;
  };

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

  useBackButton(goBack);

  return (
    <section className="h-screen overflow-y-scroll bg-[#0e0e0e] px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goBack}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#212121] hover:bg-[#2a2a2a] transition-colors"
        >
          <FaIcon faIcon={faArrowLeft} fontsize={14} color="#f6f7f9" />
        </button>
        <h1 className="text-[#f6f7f9] text-xl font-bold">{vaultName}</h1>
        <div className="px-3 py-1 rounded-full bg-[#212121] text-[#f6f7f9] text-sm">
          {vaultDetails?.network || "Polygon"}
        </div>
      </div>

      {/* Guaranteed Banner */}
      {isBuffetVault && (
        <div className="flex items-center gap-2 bg-[#7be891]/10 text-[#7be891] py-2 px-4 rounded-xl mb-6">
          <FaIcon faIcon={faCheckCircle} fontsize={12} color="#7be891" />
          <span className="text-sm font-medium">Guaranteed 11% Returns</span>
        </div>
      )}

      {/* Vault Summary */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Staked</p>
            <div className="text-[#f6f7f9] text-2xl font-bold mb-1">
              {Math.round(Number(totalLstBalance))} {tokenSymbol}
            </div>
            <div className="text-gray-400">
              ${Math.round(Number(totalLstBalance))}
            </div>
            {isBuffetVault && (
              <div className="text-[#7be891] font-bold mt-2">
                TVL ${stakinginfo?.data?.treasuryValue || 0}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm mb-1">APY</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold ${
                  isBuffetVault ? "text-[#7be891]" : "text-[#f6f7f9]"
                }`}
              >
                {apyValue}
              </span>
              {isBuffetVault && (
                <span className="text-xs text-[#7be891] px-2 py-1 rounded-full bg-[#7be891]/10">
                  Fixed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-40 w-full">
          <LSTChart />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bg-[#212121] rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ffb386]/10 flex items-center justify-center">
            <FaIcon faIcon={faClock} fontsize={12} color="#ffb386" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Next Rebase</p>
            <p className="text-[#f6f7f9] font-medium">
              {String(timeRemaining.hours).padStart(2, "0")}h{" "}
              {String(timeRemaining.minutes).padStart(2, "0")}m{" "}
              {String(timeRemaining.seconds).padStart(2, "0")}s
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Notice */}
      {stakingbalance?.data?.isStaker &&
        stakingbalance?.data?.withdrawalRequest?.amount !== "0.0" && (
          <div className="text-[#f6f7f9] text-sm font-bold mb-6">
            Withdraw in&nbsp;
            {convertTime(
              Number(
                stakingbalance?.data?.withdrawalRequest?.cooldownRemaining || 0
              )
            )}
          </div>
        )}

      {/* APY History */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg mb-20">
        <h3 className="text-[#f6f7f9] text-lg font-semibold mb-4">
          APY History
        </h3>
        <SimplifiedAPYChart />
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0e0e0e] flex gap-3">
        <button
          onClick={() => openAppDrawer("stakevault")}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#7be891] text-[#0e0e0e] rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <FaIcon faIcon={faLayerGroup} fontsize={14} color="#0e0e0e" />
          <span>Stake Now</span>
        </button>
        <button
          onClick={() => openAppDrawer("unstakevault")}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#496bcc] text-[#f6f7f9] rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <FaIcon faIcon={faUnlockAlt} fontsize={14} color="#f6f7f9" />
          <span>Unstake</span>
        </button>
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
            <stop offset="5%" stopColor="#7be891" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#7be891" stopOpacity={0.1} />
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
          stroke="#7be891"
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
    <div className="w-full">
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
            stroke="#7be891"
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

  const getDistributionColor = (index: number) => {
    const colors = [
      "#7be891", // green
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
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        {["apy", "treasury", "backing", "distribution"].map((chart) => (
          <button
            key={chart}
            onClick={() => setActiveChart(chart)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeChart === chart
                ? "bg-[#ffb386] text-[#0e0e0e]"
                : "bg-[#2a2a2a] text-[#f6f7f9] hover:bg-[#2a2a2a]/80"
            }`}
          >
            {chart.charAt(0).toUpperCase() + chart.slice(1)}
          </button>
        ))}
      </div>

      {activeChart !== "distribution" ? (
        <div className="h-[140px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
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
              {activeChart === "apy" && (
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
                  <Line
                    type="monotone"
                    dataKey="apy"
                    name="Sphere Vault"
                    stroke="#7be891"
                    strokeWidth={3}
                    dot={{ stroke: "#7be891", strokeWidth: 2, r: 3 }}
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
              )}
              {activeChart === "treasury" && (
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
              )}
              {activeChart === "backing" && (
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
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {distributionData.map((item, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#f6f7f9]">{item.name}</span>
                <span className="text-gray-400">{item.value}%</span>
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: getDistributionColor(index),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-gray-400 text-sm">{getChartFooter()}</p>
    </div>
  );
};
