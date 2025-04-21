import { CSSProperties, JSX, useState } from "react";
import { useAppDrawer } from "@/hooks/drawer";
import { useSnackbar } from "@/hooks/snackbar";
import { BottomButtonContainer } from "../Bottom";
import { SubmitButton } from "../global/Buttons";
import { colors } from "@/constants";
import { HorizontalDivider } from "../global/Divider";
import "@/styles/pages/polymarket/tradeyesno.scss";

type tradetype = "buy" | "sell";
type tradeoption = "yes" | "no";

export const TradeYesNo = (): JSX.Element => {
  const { closeAppDrawer, keyToshare, secretPurpose } = useAppDrawer(); // keytoshare : market id >> secretpurpose : indicates buy yes or no
  const { showsuccesssnack } = useSnackbar();
  const defaulttradeoption: tradeoption = secretPurpose as tradeoption;

  const [tradeType, setTradeType] = useState<tradetype>("buy");
  const [tradeOption, setTradeOption] =
    useState<tradeoption>(defaulttradeoption);
  const [tradelimitPrice, setTradeLimitPrice] = useState<string>("");
  const [tradeShares, setTradeShares] = useState<string>("");

  const onIncreaseTradeLimitPrice = () => {
    if (Number(tradelimitPrice) !== 99) {
      setTradeLimitPrice((prevprice) => String(Number(prevprice) + 1));
    }
  };

  const onDecreaseTradeLimitPrice = () => {
    if (tradelimitPrice !== "" && Number(tradelimitPrice) !== 1) {
      setTradeLimitPrice((prevprice) => String(Number(prevprice) - 1));
    }
  };

  const calcTradeTotal = (): number => {
    if (tradelimitPrice == "" || tradeShares == "") {
      return 0;
    } else {
      return Math.floor((Number(tradeShares) / 100) * Number(tradelimitPrice));
    }
  };

  const onTradeMarketShares = () => {
    showsuccesssnack(`You successfully traded ${tradeOption} shares`);
    closeAppDrawer();
  };

  return (
    <div id="tradeyesno">
      <div className="buy_sell_actions">
        <button
          className={tradeType == "buy" ? "active" : ""}
          onClick={() => setTradeType("buy")}
        >
          Buy
        </button>
        <button
          className={tradeType == "sell" ? "active" : ""}
          onClick={() => setTradeType("sell")}
        >
          Sell
        </button>
      </div>

      <div className="tradeoptions">
        <SubmitButton
          text={`Yes ${13}¢`}
          sxstyles={{
            ...buttonstyles,
            backgroundColor:
              tradeOption == "yes" ? colors.success : colors.divider,
          }}
          onclick={() => setTradeOption("yes")}
        />

        <SubmitButton
          text={`No ${90}¢`}
          sxstyles={{
            ...buttonstyles,
            backgroundColor:
              tradeOption == "no" ? colors.danger : colors.divider,
          }}
          onclick={() => setTradeOption("no")}
        />
      </div>

      <div className="tradeform">
        <div className="limitprice">
          <p>Limit Price</p>

          <div className="ctr">
            <button onClick={onDecreaseTradeLimitPrice}>-</button>

            <span>
              <input
                type="text"
                inputMode="numeric"
                step={1}
                min={1}
                max={99}
                minLength={1}
                maxLength={2}
                placeholder="0"
                value={tradelimitPrice}
                onChange={(e) => setTradeLimitPrice(e.target.value)}
                id="inputlimitprice"
              />
              ¢
            </span>

            <button onClick={onIncreaseTradeLimitPrice}>+</button>
          </div>
        </div>

        <HorizontalDivider
          sxstyles={{ height: "0.125rem", margin: "0.75rem 0" }}
        />

        <div className="limitprice">
          <p>Shares</p>

          <div className="ctr">
            <input
              type="text"
              inputMode="numeric"
              minLength={1}
              maxLength={10}
              placeholder="0"
              value={tradeShares}
              onChange={(e) => setTradeShares(e.target.value)}
              id="sharesinput"
            />
          </div>
        </div>

        <HorizontalDivider
          sxstyles={{ height: "0.125rem", marginTop: "0.75rem" }}
        />
      </div>

      <div className="total_towin">
        <p>
          Total <span>${calcTradeTotal()}</span>
        </p>

        <p>
          To Win <span>${tradeShares == "" ? 0 : tradeShares}</span>
        </p>
      </div>

      <BottomButtonContainer>
        <SubmitButton
          text={`${tradeType} ${tradeOption}`}
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "0.5rem",
            color: colors.textprimary,
            textTransform: "capitalize",
            backgroundColor: colors.accent,
          }}
          onclick={onTradeMarketShares}
        />
      </BottomButtonContainer>
    </div>
  );
};

const buttonstyles: CSSProperties = {
  width: "49%",
  borderRadius: "0.5rem",
  fontFamily: "Raleway, serif",
  textTransform: "capitalize",
  color: colors.textprimary,
};
