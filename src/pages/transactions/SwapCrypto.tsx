import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { formatNumber } from "../../utils/formatters";
import { cryptoassets } from "./SendCryptoMethods";
import { Rotate } from "../../assets/icons";
import { colors } from "../../constants";
import ethlogo from "../../assets/images/logos/eth.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import beralogo from "../../assets/images/logos/bera.png";
import "../../styles/pages/transactions/swapcrypto.scss";

export default function SwapCrypto(): JSX.Element {
  const navigate = useNavigate();

  const [sellCurrency, setSellCurrency] = useState<cryptoassets>("WUSDC");
  const [receiveCurrency, setReceiveCurrency] = useState<cryptoassets>("ETH");
  const [sellCurrencyValue, setSellCurrencyValue] = useState<string>("");
  const [receiveCurrencyValue, setReceiveCurrencyValue] = useState<number>(0);

  // my balances
  const eth_balance = Number(localStorage.getItem("ethbal") ?? 0);
  const bera_balance = Number(localStorage.getItem("berabal") ?? 0);
  const pol_usdc_balance = Number(localStorage.getItem("polygonusdcbal") ?? 0);
  const bera_usdc_balance = Number(localStorage.getItem("berausdcbal") ?? 0);

  // usd value
  const eth_usd_value = Number(localStorage.getItem("ethvalue") ?? 0);
  const bera_usd_value = Number(localStorage.getItem("berapriceusd") ?? 0);
  const usdc_usd_price = Number(localStorage.getItem("usdcusdprice") ?? 0);

  const display_balance =
    sellCurrency == "ETH"
      ? eth_balance
      : sellCurrency == "WBERA"
      ? bera_balance
      : sellCurrency == "USDC"
      ? pol_usdc_balance
      : bera_usdc_balance;

  const onFindReceiveQty = () => {
    const sell_currency_usd_value =
      sellCurrency == "ETH"
        ? eth_usd_value
        : sellCurrency == "WBERA"
        ? bera_usd_value
        : usdc_usd_price;

    const receive_currency_usd_value =
      receiveCurrency == "ETH"
        ? eth_usd_value
        : receiveCurrency == "WBERA"
        ? bera_usd_value
        : usdc_usd_price;

    const receive_amount =
      (Number(sellCurrencyValue) * sell_currency_usd_value) /
      receive_currency_usd_value;
    setReceiveCurrencyValue(Number(receive_amount.toFixed(4)));
  };

  const onSwitchCurency = () => {
    setSellCurrency(receiveCurrency);
    setReceiveCurrency(sellCurrency);

    onFindReceiveQty();
  };

  const onMaxOut = () => {
    sellCurrency == "ETH"
      ? setSellCurrencyValue(String(eth_balance))
      : sellCurrency == "WBERA"
      ? setSellCurrencyValue(String(bera_balance))
      : sellCurrency == "USDC"
      ? setSellCurrencyValue(String(pol_usdc_balance))
      : setSellCurrencyValue(String(bera_usdc_balance));

    onFindReceiveQty();
  };

  const goBack = () => {
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="swapcrypto">
      <div className="sellcurr_ctr">
        <div className="curr_balance">
          <div className="curr">
            <img
              src={
                sellCurrency == "ETH"
                  ? ethlogo
                  : sellCurrency == "WBERA"
                  ? beralogo
                  : usdclogo
              }
              alt={sellCurrency}
            />

            <span className="currency_name">
              {sellCurrency == "WUSDC" ? "USDC.e" : sellCurrency}
            </span>
          </div>

          <p>
            <span>{formatNumber(display_balance)}</span>&nbsp;
            {sellCurrency == "WUSDC" ? "USDC.e" : sellCurrency}
          </p>
        </div>

        <div className="input_ctr">
          <input
            type="text"
            inputMode="numeric"
            placeholder={`0.0 ${
              sellCurrency == "WUSDC" ? "USDC.e" : sellCurrency
            }`}
            autoFocus
            value={sellCurrencyValue}
            onChange={(e) => setSellCurrencyValue(e.target.value)}
            onKeyUp={onFindReceiveQty}
          />
          <span className="sell_title">Sell</span>
          <button onClick={onMaxOut} className="max_out">
            Max
          </button>
        </div>
      </div>

      <div key={sellCurrency} className="switch_currenncy">
        <button onClick={onSwitchCurency}>
          <Rotate color={colors.primary} />
        </button>
      </div>

      <div className="receivecurr_ctr">
        <div className="curr">
          <img
            src={
              receiveCurrency == "ETH"
                ? ethlogo
                : receiveCurrency == "WBERA"
                ? beralogo
                : usdclogo
            }
            alt={receiveCurrency}
          />

          <span className="currency_name">
            {receiveCurrency == "WUSDC" ? "USDC.e" : receiveCurrency}
          </span>
        </div>

        <div className="receive_qty">
          <p className="qty">
            {formatNumber(receiveCurrencyValue)} <span>{receiveCurrency}</span>
          </p>
          <p className="receive_title">Receive</p>
        </div>
      </div>

      <button
        className="submit-swap"
        disabled={sellCurrencyValue == "" || receiveCurrencyValue == 0}
      >
        Swap <Rotate color={colors.textprimary} />
      </button>
    </section>
  );
}
