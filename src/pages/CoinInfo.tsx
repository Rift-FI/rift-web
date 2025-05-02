import { JSX } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "@/hooks/tabs";
import { useBackButton } from "@/hooks/backbutton";
import { CoinPriceChart } from "@/components/PriceChart";
import { coinPriceType } from "@/types/earn";
import { useQuery } from "@tanstack/react-query";
import { getSphrUsdcRate } from "@/utils/api/mantra";
import "../styles/pages/coininfo.scss";

export default function CoinInfo(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const prevpage = localStorage.getItem("prev_page");

  const { data: sphrUsdcRateData, isLoading: sphrUsdcRateLoading } = useQuery({
    queryKey: ["sphrUsdcRate"],
    queryFn: getSphrUsdcRate,
  });

  const goBack = () => {
    if (prevpage == null) {
      switchtab("home");
    } else {
      switchtab("rewards");
    }

    localStorage.removeItem("prev_page");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="aboutcoin">
      <p className="infoctr">
        SPHR / USDC Exchange Rate
        <span>Rates for the last 30 days</span>
      </p>

      <div className="chartctr">
        <CoinPriceChart data={last30DaysData} />
      </div>

      <div className="currenrate">
        <p>Current Exchange Rate</p>
        <span>
          1 SPHR ≈{" "}
          {sphrUsdcRateLoading
            ? 0
            : sphrUsdcRateData?.data?.currentRate?.substring(0, 5)}
          &nbsp;USDC
        </span>
      </div>
    </section>
  );
}

const last30DaysData: coinPriceType[] = [
  { time: "2025-03-17", open: 0.128, high: 0.135, low: 0.128, close: 0.123 },
  { time: "2025-03-18", open: 0.123, high: 0.132, low: 0.117, close: 0.114 },
  { time: "2025-03-19", open: 0.114, high: 0.122, low: 0.101, close: 0.108 },
  { time: "2025-03-20", open: 0.108, high: 0.109, low: 0.095, close: 0.103 },
  { time: "2025-03-21", open: 0.103, high: 0.112, low: 0.09, close: 0.101 },
  { time: "2025-03-22", open: 0.101, high: 0.109, low: 0.097, close: 0.1 },
  { time: "2025-03-23", open: 0.1, high: 0.106, low: 0.091, close: 0.099 },
  { time: "2025-03-24", open: 0.099, high: 0.106, low: 0.086, close: 0.099 },
  { time: "2025-03-25", open: 0.099, high: 0.102, low: 0.094, close: 0.099 },
  { time: "2025-03-26", open: 0.099, high: 0.1, low: 0.087, close: 0.099 },
  { time: "2025-03-27", open: 0.099, high: 0.111, low: 0.084, close: 0.099 },
  { time: "2025-03-28", open: 0.099, high: 0.113, low: 0.099, close: 0.099 },
  { time: "2025-03-29", open: 0.099, high: 0.099, low: 0.092, close: 0.099 },
  { time: "2025-03-30", open: 0.099, high: 0.107, low: 0.091, close: 0.099 },
  { time: "2025-03-31", open: 0.099, high: 0.106, low: 0.092, close: 0.099 },
  { time: "2025-04-01", open: 0.099, high: 0.104, low: 0.094, close: 0.099 },
  { time: "2025-04-02", open: 0.099, high: 0.103, low: 0.093, close: 0.099 },
  { time: "2025-04-03", open: 0.099, high: 0.112, low: 0.092, close: 0.099 },
  { time: "2025-04-04", open: 0.099, high: 0.105, low: 0.086, close: 0.099 },
  { time: "2025-04-05", open: 0.099, high: 0.111, low: 0.086, close: 0.099 },
  { time: "2025-04-06", open: 0.099, high: 0.108, low: 0.086, close: 0.099 },
  { time: "2025-04-07", open: 0.099, high: 0.106, low: 0.094, close: 0.099 },
  { time: "2025-04-08", open: 0.099, high: 0.106, low: 0.098, close: 0.099 },
  { time: "2025-04-09", open: 0.099, high: 0.1, low: 0.088, close: 0.099 },
  { time: "2025-04-10", open: 0.099, high: 0.111, low: 0.088, close: 0.099 },
  { time: "2025-04-11", open: 0.099, high: 0.107, low: 0.097, close: 0.099 },
  { time: "2025-04-12", open: 0.099, high: 0.108, low: 0.086, close: 0.099 },
  { time: "2025-04-13", open: 0.099, high: 0.109, low: 0.091, close: 0.099 },
  { time: "2025-04-14", open: 0.099, high: 0.112, low: 0.094, close: 0.099 },
  { time: "2025-04-15", open: 0.099, high: 0.1, low: 0.098, close: 0.099 },
];
