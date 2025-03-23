import { CSSProperties, JSX } from "react";
import { useNavigate } from "react-router";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { useAppDrawer } from "../../hooks/drawer";
import { BottomButtonContainer } from "../../components/Bottom";
import { SubmitButton } from "../../components/global/Buttons";
import { colors } from "../../constants";
import "../../styles/pages/transactions/stakevault.scss";

export default function StakeVault(): JSX.Element {
  //   const { srcvault } = useParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  const goBack = () => {
    switchtab("earn");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="stakevault">
      <div className="chain_ctr">
        <p className="chain">
          Mantra <span>Chain</span>
        </p>
      </div>

      <p className="wallet">
        Connected Wallet
        <span>0xAbc...1234</span>
      </p>

      <div className="stakedetails">
        <p className="total">
          Total Staked
          <span>
            $1000 <br /> ≈ 100 LST
          </span>
        </p>
        <p className="apy">
          APY <span>12%</span>
        </p>
        <p className="growth">
          7-Day Growth <span>+2.1%</span>
        </p>
        <p className="rebase">
          Last Rebase<span>+1.2%</span>
        </p>
        <p className="rebasetime">
          Next Rebase in <span>1H 22M</span>
        </p>
        <LSTChart />
      </div>

      <p className="desc">
        Rebasing automatically compounds your rewards by increasing the number
        of LST tokens you hold.
      </p>

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

const buttonstyles: CSSProperties = {
  width: "48%",
  borderRadius: "1.25rem",
};
