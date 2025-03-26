import { CSSProperties, JSX } from "react";
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
import { BottomButtonContainer } from "../../components/Bottom";
import { SubmitButton } from "../../components/global/Buttons";
import { colors } from "../../constants";
import "../../styles/pages/transactions/stakevault.scss";

export default function StakeVault(): JSX.Element {
  const { srcvault } = useParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  const { data: stakinginfo } = useQuery({
    queryKey: ["stakinginfo"],
    queryFn: getStakingInfo,
  });
  const { data: stakingbalance } = useQuery({
    queryKey: ["stkingbalance"],
    queryFn: getStakeingBalance,
  });

  const goBack = () => {
    switchtab("earn");
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

  useBackButton(goBack);

  return (
    <section id="stakevault">
      <div className="chain_ctr">
        <p className="chain">
          Polygon <span>Chain</span>
        </p>
      </div>

      <div className="stakedetails">
        <p className="total">
          Total Staked
          <span>
            $
            {lstUsdValue(
              Number(stakinginfo?.data?.treasuryValue || 0),
              Number(stakinginfo?.data?.totalStaked || 0),
              Number(stakingbalance?.data?.stakedBalance || 0)
            )}
            <br /> ≈ {stakingbalance?.data?.lstBalance}&nbsp;
            {stakinginfo?.data?.tokenSymbol}
          </span>
        </p>
        <p className="apy">
          APY <span>11%</span>
        </p>
        <p className="growth">
          7-Day Growth
          <span>
            +
            {1 -
              Number(stakinginfo?.data?.treasuryValue) /
                Number(stakinginfo?.data?.totalStaked)}
            %
          </span>
        </p>
        <p className="rebase">
          Last Rebase
          <span>
            +
            {1 -
              Number(stakinginfo?.data?.treasuryValue) /
                Number(stakinginfo?.data?.totalStaked)}
            %
          </span>
        </p>
        <p className="rebasetime">
          Next Rebase in <span>1H 22M</span>
        </p>
        <LSTChart />
      </div>

      <p className="desc">
        Rebasing automatically compounds your rewards by increasing the value of
        LST tokens you hold.
      </p>

      <TokenAPYDetails
        tokenName={srcvault as string}
        apyValue="11%"
        thirtyDyavg="3%"
      />
      <APYChart legendTitle={`${srcvault} APY`} />

      <BottomButtonContainer
        sxstyles={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <SubmitButton
          text="Stake"
          sxstyles={{ ...buttonstyles, backgroundColor: colors.success }}
          onclick={() => openAppDrawer("stakevault")}
        />
        <SubmitButton
          text="Unstake"
          sxstyles={{ ...buttonstyles, backgroundColor: colors.divider }}
          onclick={() => openAppDrawer("unstakevault")}
        />
      </BottomButtonContainer>
    </section>
  );
}

const LSTChart = () => {
  const data = [
    { name: "A", value: 10 },
    { name: "B", value: 20 },
    { name: "C", value: 15 },
    { name: "D", value: 25 },
    { name: "E", value: 20 },
    { name: "F", value: 22 },
  ];

  return (
    <div className="lstchart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Area
            type="stepAfter"
            dataKey="value"
            stroke="#66FCF1"
            fill="#2C3E3A"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const APYChart = ({ legendTitle }: { legendTitle: string }) => {
  const data = [
    { date: "2/28", protocolAPY: 7.5, seniorApy: 7.8 },
    { date: "3/3", protocolAPY: 4.5, seniorApy: 4.8 },
    { date: "3/6", protocolAPY: 5.2, seniorApy: 5.5 },
    { date: "3/9", protocolAPY: 3.8, seniorApy: 4.0 },
    { date: "3/13", protocolAPY: 4.0, seniorApy: 4.2 },
    { date: "3/17", protocolAPY: 3.5, seniorApy: 3.8 },
    { date: "3/21", protocolAPY: 2.8, seniorApy: 3.0 },
    { date: "3/25", protocolAPY: 1.5, seniorApy: 1.8 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        width={600}
        height={300}
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
        <XAxis
          dataKey="date"
          stroke="#888"
          style={{ fontSize: "0.75rem", fontWeight: "bold" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#333",
            border: "none",
            color: "#fff",
          }}
          formatter={(value) => `${value}%`}
        />
        <Legend verticalAlign="bottom" height={36} />
        <Line
          type="monotone"
          dataKey="protocolAPY"
          name="Protocol APY"
          stroke="#82ca9d"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="seniorApy"
          name={legendTitle}
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const TokenAPYDetails = ({
  tokenName,
  apyValue,
  thirtyDyavg,
}: {
  tokenName: string;
  apyValue: string | number;
  thirtyDyavg: string;
}): JSX.Element => {
  return (
    <div className="tokenapydetails">
      <div>
        <p className="title">
          <span>{tokenName}</span>&nbsp; APY
        </p>
        <p className="value">{apyValue}</p>
      </div>

      <div>
        <p className="title">30D Avg APY</p>
        <p className="value">{thirtyDyavg}</p>
      </div>
    </div>
  );
};

const buttonstyles: CSSProperties = {
  width: "48%",
  borderRadius: "1.25rem",
};
