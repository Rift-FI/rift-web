import { CSSProperties, JSX, MouseEvent, ReactNode, useState } from "react";
import {
  faAnglesDown,
  faAnglesUp,
  faChartPie,
  faChartSimple,
  faWaveSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackButton } from "@/hooks/backbutton";
import { useTabs } from "@/hooks/tabs";
import { useAppDrawer } from "@/hooks/drawer";
import { formatUsd } from "@/utils/formatters";
import { fetchMarkets } from "@/utils/polymarket/markets";
import { numberFormat } from "@/utils/formatters";
import { SubmitButton } from "@/components/global/Buttons";
import { FaIcon } from "@/assets/faicon";
import { colors } from "@/constants";
import { Loading } from "@/assets/animations";
import "@/styles/pages/polymarket/index.scss";

export const Polymarket = (): JSX.Element => {
  const queryclient = useQueryClient();
  const { switchtab } = useTabs();

  const [marketFilter, setMarketFilter] = useState<"nba" | "crypto" | "me">(
    "nba"
  );

  const goBack = () => {
    switchtab("home");
  };

  const { data: nbamarkets, isPending: nbamarketspending } = useQuery({
    queryKey: ["nbamarkets"],
    queryFn: () => fetchMarkets("nba"),
  });
  const { data: cryptomarkets, isPending: cryptomarketspending } = useQuery({
    queryKey: ["cryptomarkets"],
    queryFn: () => fetchMarkets("crypto"),
  });

  useBackButton(goBack);

  return (
    <section id="polymarket">
      <div className="mystats">
        <StatsCounter
          icon={<FaIcon faIcon={faChartSimple} color={colors.textprimary} />}
          title="Markets Traded"
          value={0}
        />
        <StatsCounter
          icon={<FaIcon faIcon={faChartPie} color={colors.textprimary} />}
          title="Volume Traded"
          value={formatUsd(0)}
        />
        <StatsCounter
          icon={<FaIcon faIcon={faWaveSquare} color={colors.textprimary} />}
          title="Profit/Loss"
          value={formatUsd(0)}
        />
      </div>

      <div className="marketfilters">
        <button
          className={marketFilter == "nba" ? "active" : ""}
          onClick={() => {
            setMarketFilter("nba");
            queryclient.invalidateQueries({ queryKey: ["allmarkets"] });
          }}
        >
          NBA
        </button>

        <button
          className={marketFilter == "crypto" ? "active" : ""}
          onClick={() => {
            setMarketFilter("crypto");
            queryclient.invalidateQueries({ queryKey: ["allmarkets"] });
          }}
        >
          Crypto
        </button>

        <button
          className={marketFilter == "me" ? "active" : ""}
          onClick={() => setMarketFilter("me")}
        >
          My Trades
        </button>
      </div>

      {nbamarketspending || cryptomarketspending ? (
        <div className="loading">
          <Loading width="1.5rem" height="1.5rem" />
        </div>
      ) : marketFilter == "nba" ? (
        <div className="markets">
          {nbamarkets?.data?.map((market) => (
            <Market
              key={market?.id}
              conditionid={market?.markets[0]?.conditionId}
              marketimage={market?.image}
              markettitle={market?.title}
              marketvolume={market?.volume}
              spread={market?.markets[0]?.spread}
              outcome={market?.markets[0]?.outcomes}
            />
          ))}
        </div>
      ) : marketFilter == "crypto" ? (
        <div className="markets">
          {cryptomarkets?.data?.map((market) => (
            <Market
              key={market?.id}
              conditionid={market?.markets[0]?.conditionId}
              marketimage={market?.image}
              markettitle={market?.title}
              marketvolume={market?.volume}
              spread={market?.markets[0]?.spread}
              outcome={market?.markets[0]?.outcomes}
            />
          ))}
        </div>
      ) : (
        <div className="markets">
          <p className="notrades">
            Your trades will appear here once you start trading
          </p>
        </div>
      )}
    </section>
  );
};

const StatsCounter = ({
  icon,
  title,
  value,
  onclick,
}: {
  icon: ReactNode;
  title: string;
  value: string | number;
  onclick?: () => void;
}): JSX.Element => {
  return (
    <div className="stat_ctr" onClick={onclick}>
      <div className="icon">{icon}</div>

      <p>
        <span>{title}</span> {value}
      </p>
    </div>
  );
};

const Market = ({
  conditionid,
  marketimage,
  markettitle,
  marketvolume,
  spread,
  outcome,
}: {
  conditionid: string;
  marketimage: string;
  markettitle: string;
  marketvolume: number | string;
  spread: string | number;
  outcome: string;
}): JSX.Element => {
  const { openAppDrawerWithKey } = useAppDrawer();
  const outcomearr: string[] = JSON.parse(outcome);

  const buttonstyles: CSSProperties = {
    width: "49%",
    padding: "0.5rem",
    borderRadius: "0.5rem",
    fontFamily: "Raleway, serif",
    fontWeight: "bold",
    color: colors.textprimary,
  };

  const onTradeYes = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openAppDrawerWithKey("tradeyesno", conditionid, outcomearr[0]); // drawer action : tradeyesno >> keyToShare : condition id >> purpose : outcome[0]
  };

  const onTradeNo = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openAppDrawerWithKey("tradeyesno", conditionid, outcomearr[1]); // drawer action : tradeyesno >> keyToShare : condition id >> purpose : outcome[1]
  };

  return (
    <div className="marketctr">
      <div className="img_title">
        <img src={marketimage} alt="market" />
        <p>{markettitle}</p>
      </div>

      <div className="marketconditions">
        <p>
          {numberFormat(Number(marketvolume || 0))} <span>Vol</span>
        </p>
        <p>
          {spread || 0} <span>Spread</span>
        </p>
      </div>

      <div className="marketactions">
        <SubmitButton
          text={`Buy ${outcomearr[0]}`}
          icon={
            <FaIcon
              faIcon={faAnglesUp}
              color={colors.textprimary}
              fontsize={12}
            />
          }
          sxstyles={{ ...buttonstyles, backgroundColor: colors.success }}
          onclick={onTradeYes}
        />

        <SubmitButton
          text={`Buy ${outcomearr[1]}`}
          icon={
            <FaIcon
              faIcon={faAnglesDown}
              color={colors.textprimary}
              fontsize={12}
            />
          }
          sxstyles={{ ...buttonstyles, backgroundColor: colors.danger }}
          onclick={onTradeNo}
        />
      </div>
    </div>
  );
};

// const TradedMarket = ({
//   marketid,
//   marketimage,
//   markettitle,
//   marketvolume,
//   spread,
// }: {
//   marketid: string;
//   marketimage: string;
//   markettitle: string;
//   marketvolume: number | string;
//   spread: number;
// }): JSX.Element => {
//   const { openAppDrawerWithKey } = useAppDrawer();

//   const buttonstyles: CSSProperties = {
//     padding: "0.5rem",
//     fontFamily: "Raleway, serif",
//     fontWeight: "bold",
//     color: colors.textprimary,
//     backgroundColor: colors.danger,
//   };

//   const onCancelTrade = () => {
//     openAppDrawerWithKey(
//       "canceltradeorder",
//       marketid,
//       "Will Meta be forced to sell Instagram or WhatsApp in 2025 ?"
//     ); // drawer action : tradeyesno >> keyToShare : market id >> purpose : market title
//   };

//   return (
//     <div className="marketctr">
//       <div className="img_title">
//         <img src={marketimage} alt="market" />
//         <p>{markettitle}</p>
//       </div>

//       <div className="marketconditions">
//         <p>
//           {numberFormat(Number(marketvolume || 0))} <span>Vol</span>
//         </p>
//         <p>
//           {spread} <span>Spread</span>
//         </p>
//       </div>

//       <div className="marketactions">
//         <SubmitButton
//           text="Cancel Order"
//           sxstyles={buttonstyles}
//           onclick={onCancelTrade}
//         />
//       </div>
//     </div>
//   );
// };
