import { CSSProperties, JSX, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppDrawer } from "@/hooks/drawer";
import { useSnackbar } from "@/hooks/snackbar";
import { fetchMarketByConditionId } from "@/utils/polymarket/markets";
import { createOrder } from "@/utils/polymarket/orders";
import { BottomButtonContainer } from "../Bottom";
import { SubmitButton } from "../global/Buttons";
import { colors } from "@/constants";
import { HorizontalDivider } from "../global/Divider";
import "@/styles/pages/polymarket/tradeyesno.scss";

type tradetype = "BUY" | "SELL";

export const TradeYesNo = (): JSX.Element => {
  const { keyToshare, secretPurpose, closeAppDrawer } = useAppDrawer(); // keytoshare : market id >> secretpurpose : indicates buy yes or no
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const defaulttradeoption = secretPurpose as string;

  const [tradeType, setTradeType] = useState<tradetype>("BUY");
  const [tradeOption, setTradeOption] = useState<string>(defaulttradeoption);
  const [tradelimitPrice, setTradeLimitPrice] = useState<string>("");
  const [tradeShares, setTradeShares] = useState<string>("");

  const { data: conditiondata, isFetching: marketdatapending } = useQuery({
    queryKey: ["marketbyconditionid"],
    queryFn: () => fetchMarketByConditionId(keyToshare as string),
  });

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

  const { mutate: onTradeMarketShares, isPending: buysharespending } =
    useMutation({
      mutationFn: () =>
        createOrder(
          tradeOption == conditiondata?.data?.tokens[0]?.outcome
            ? (conditiondata?.data?.tokens[0]?.token_id as string)
            : (conditiondata?.data?.tokens[1]?.token_id as string), //tokenid
          Number(tradelimitPrice) / 100, //price
          tradeType, //side : BUY | SELL
          Number(tradeShares) //size
        )
          .then((res) => {
            console.log(res);

            if (res?.data?.orderID) {
              showsuccesssnack(`You successfully traded ${tradeOption}`);
              closeAppDrawer();
            }
          })
          .catch((err) => {
            console.log(err);
            showerrorsnack("Sorry, an error occurred, please try again");
          }),
    });

  return (
    <div id="tradeyesno">
      <div className="buy_sell_actions">
        <button
          className={tradeType == "BUY" ? "active" : ""}
          onClick={() => setTradeType("BUY")}
        >
          Buy
        </button>
        <button
          className={tradeType == "SELL" ? "active" : ""}
          onClick={() => setTradeType("SELL")}
        >
          Sell
        </button>
      </div>

      <div className="tradeoptions">
        <SubmitButton
          text={`${conditiondata?.data?.tokens[0]?.outcome} ${conditiondata?.data?.tokens[0]?.price} ¢`}
          sxstyles={{
            ...buttonstyles,
            backgroundColor:
              tradeOption == conditiondata?.data?.tokens[0]?.outcome
                ? colors.success
                : colors.divider,
          }}
          isDisabled={marketdatapending}
          isLoading={marketdatapending}
          onclick={() =>
            setTradeOption(conditiondata?.data?.tokens[0]?.outcome as string)
          }
        />

        <SubmitButton
          text={`${conditiondata?.data?.tokens[1]?.outcome} ${conditiondata?.data?.tokens[1]?.price} ¢`}
          sxstyles={{
            ...buttonstyles,
            backgroundColor:
              tradeOption == conditiondata?.data?.tokens[1]?.outcome
                ? colors.danger
                : colors.divider,
          }}
          isDisabled={marketdatapending}
          isLoading={marketdatapending}
          onclick={() =>
            setTradeOption(conditiondata?.data?.tokens[1]?.outcome as string)
          }
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

      <HorizontalDivider
        sxstyles={{ height: "0.125rem", margin: "0.75rem 0" }}
      />

      <p className="descritption">
        {marketdatapending ? "- - -" : conditiondata?.data?.description}
      </p>

      <BottomButtonContainer>
        <SubmitButton
          text={`${tradeType} ${tradeOption}`}
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "0.5rem",
            fontWeight: "600",
            textTransform: "capitalize",
            color: colors.textprimary,
            backgroundColor: colors.accent,
          }}
          isLoading={marketdatapending || buysharespending}
          isDisabled={marketdatapending || buysharespending}
          onclick={() => onTradeMarketShares()}
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
