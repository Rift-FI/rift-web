import { CSSProperties, JSX, MouseEvent, ReactNode, useState } from "react";
import { useNavigate } from "react-router";
// import { useQuery } from "@tanstack/react-query";
import {
  faAnglesDown,
  faAnglesUp,
  faChartPie,
  faChartSimple,
  faWaveSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "@/hooks/backbutton";
import { useTabs } from "@/hooks/tabs";
import { useAppDrawer } from "@/hooks/drawer";
import { formatUsd } from "@/utils/formatters";
// import { fetchMarkets } from "@/utils/polymarket/markets";
import { SearchInput } from "@/components/global/Inputs";
import { SubmitButton } from "@/components/global/Buttons";
import { FaIcon } from "@/assets/faicon";
import { colors } from "@/constants";
import marketimg from "@/assets/images/labs/mantracover.png";
import "@/styles/pages/polymarket/index.scss";

export default function Polymarket(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [searchValue, setSearchValue] = useState<string>("");
  const [marketFilter, setMarketFilter] = useState<"all" | "me">("all");

  // const { data } = useQuery({
  //   queryKey: ["polymarkets"],
  //   queryFn: fetchMarkets,
  // });
  // console.log(isPending);
  // console.log(error);
  // console.log(data?.status);
  // console.log(data?.markets);

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

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

      <SearchInput
        placeholder="Find Markets"
        inputState={searchValue}
        setInputState={setSearchValue}
        ctrsxstyles={{ marginTop: "0.75rem" }}
      />

      <div className="marketfilters">
        <button
          className={marketFilter == "all" ? "active" : ""}
          onClick={() => setMarketFilter("all")}
        >
          All Markets
        </button>
        <button
          className={marketFilter == "me" ? "active" : ""}
          onClick={() => setMarketFilter("me")}
        >
          My Trades
        </button>
      </div>

      {marketFilter == "all" ? (
        <div className="markets">
          <Market
            marketid="1278687rL"
            marketimage={marketimg}
            markettitle="Will Meta be forced to sell Instagram or WhatsApp in 2025 ?"
            marketvolume="$8K"
            minshares={100}
          />
        </div>
      ) : (
        <div className="markets">
          <TradedMarket
            marketid="1278687rL"
            marketimage={marketimg}
            markettitle="Will Meta be forced to sell Instagram or WhatsApp in 2025 ?"
            marketvolume="$8K"
            myshares={100}
          />
          {/* <p className="notrades">
            Your trades will appear here once you strat trading
          </p> */}
        </div>
      )}
    </section>
  );
}

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
  marketid,
  marketimage,
  markettitle,
  marketvolume,
  minshares,
}: {
  marketid: string;
  marketimage: string;
  markettitle: string;
  marketvolume: number | string;
  minshares: number;
}): JSX.Element => {
  const navigate = useNavigate();
  const { openAppDrawerWithKey } = useAppDrawer();

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
    openAppDrawerWithKey("tradeyesno", marketid, "yes"); // drawer action : tradeyesno >> keyToShare : market id >> purpose : trade yes
  };

  const onTradeNo = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openAppDrawerWithKey("tradeyesno", marketid, "no"); // drawer action : tradeyesno >> keyToShare : market id >> purpose : trade no
  };

  const goToMarket = () => {
    navigate(`/market/${marketid}`);
  };

  return (
    <div className="marketctr" onClick={goToMarket}>
      <div className="img_title">
        <img src={marketimage} alt="market" />
        <p>{markettitle}</p>
      </div>

      <div className="marketconditions">
        <p>
          {marketvolume} <span>Vol</span>
        </p>
        <p>
          {minshares} <span>Min Shares</span>
        </p>
      </div>

      <div className="marketactions">
        <SubmitButton
          text="Buy Yes"
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
          text="Buy No"
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

const TradedMarket = ({
  marketid,
  marketimage,
  markettitle,
  marketvolume,
  myshares,
}: {
  marketid: string;
  marketimage: string;
  markettitle: string;
  marketvolume: number | string;
  myshares: number;
}): JSX.Element => {
  const { openAppDrawerWithKey } = useAppDrawer();

  const buttonstyles: CSSProperties = {
    padding: "0.5rem",
    fontFamily: "Raleway, serif",
    fontWeight: "bold",
    color: colors.textprimary,
    backgroundColor: colors.danger,
  };

  const onCancelTrade = () => {
    openAppDrawerWithKey(
      "canceltradeorder",
      marketid,
      "Will Meta be forced to sell Instagram or WhatsApp in 2025 ?"
    ); // drawer action : tradeyesno >> keyToShare : market id >> purpose : market title
  };

  return (
    <div className="marketctr">
      <div className="img_title">
        <img src={marketimage} alt="market" />
        <p>{markettitle}</p>
      </div>

      <div className="marketconditions">
        <p>
          {marketvolume} <span>Vol</span>
        </p>
        <p>
          {myshares} <span>Shares</span>
        </p>
      </div>

      <div className="marketactions">
        <SubmitButton
          text="Cancel Order"
          sxstyles={buttonstyles}
          onclick={onCancelTrade}
        />
      </div>
    </div>
  );
};
