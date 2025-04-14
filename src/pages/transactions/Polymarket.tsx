import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { HorizontalDivider } from "../../components/global/Divider";
import { SubmitButton } from "../../components/global/Buttons";
import polymarketlogo from "../../assets/images/icons/polymarket.png";
import "../../styles/pages/transactions/polymarket.scss";
import { formatUsdSimple } from "../../utils/formatters";
import { useSnackbar } from "../../hooks/snackbar";

export default function Polymarket(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showerrorsnack } = useSnackbar();

  const [trade, setTrade] = useState<"undecided" | "yes" | "no">("undecided");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [shares, setShares] = useState<string>("");

  const onSubmitTrade = () => {
    showerrorsnack("Trading coming soon...");
  };

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="polymarket">
      <p className="question">March 2025 Temperature Increase (ºC)</p>

      <div className="form">
        <div className="price">
          <img src={polymarketlogo} alt="polymarket" />
          <span>&lt;1.20</span>
        </div>

        <HorizontalDivider />

        <div className="actions">
          <SubmitButton
            text="Yes 0.4¢"
            sxstyles={{
              width: "46%",
            }}
            onclick={() => setTrade("yes")}
          />
          <SubmitButton
            text="No 99¢"
            sxstyles={{
              width: "46%",
            }}
            onclick={() => setTrade("no")}
          />
        </div>
        <div className="limit_price">
          <span>Limit Price</span>
          <input
            type="number"
            placeholder="45 ¢"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
          />
        </div>

        <HorizontalDivider sxstyles={{ width: "unset", margin: "0.5rem" }} />

        <div className="limit_price">
          <span>Shares</span>
          <input
            type="number"
            placeholder="0"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
          />
        </div>

        <HorizontalDivider sxstyles={{ width: "unset", margin: "0.5rem" }} />

        <p className="to_win">
          Win
          <span>
            {shares == ""
              ? formatUsdSimple(0)
              : formatUsdSimple(Number(shares))}
          </span>
        </p>

        <div className="submit_ctr">
          <SubmitButton
            text="Trade"
            isDisabled={trade == "undecided"}
            onclick={onSubmitTrade}
          />
        </div>
      </div>

      <p className="rules">
        This market will resolve to the value reported by the Global Land-Ocean
        Temperature Index for March 2025 when it is released. Otherwise, this
        market will resolve to "No". An anomaly of a named bracket for March
        2025 is necessary and sufficient to resolve this market to "Yes"
        immediately once the data becomes available regardless of whether the
        figure for March 2025 is later revised. The primary resolution source
        for this market will be the figure found in the table titled "GLOBAL
        Land-Ocean Temperature Index in 0.01 degrees Celsius" under the column
        "March" in the row "2025"
        (https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.txt). If
        NASA's "Global Temperature Index" is rendered permanently unavailable,
        other information from NASA may be used. If no information for March
        2025 is provided by NASA by June 1, 2025, 11:59 PM ET, this market will
        resolve "Yes".
      </p>
    </section>
  );
}
