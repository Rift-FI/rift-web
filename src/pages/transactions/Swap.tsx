import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { formatNumber } from "../../utils/formatters";
import { Rotate } from "../../assets/icons";
import { colors } from "../../constants";
import ethlogo from "../../assets/images/logos/eth.png";
import "../../styles/pages/transactions/swapcrypto.scss";

type SwapAssetType = "OM" | "USDC" | "HKDA" | "WUSD" | "BTC" | "ETH";

export default function SwapCrypto(): JSX.Element {
  const navigate = useNavigate();

  const [sellCurrency, setSellCurrency] = useState<SwapAssetType>("HKDA");
  const [receiveCurrency, setReceiveCurrency] = useState<SwapAssetType>("USDC");
  const [sellCurrencyValue, setSellCurrencyValue] = useState<string>("");
  const [receiveCurrencyValue, setReceiveCurrencyValue] = useState<number>(0);

  // my balances
  const hkda_balance = 0;
  const usdc_balance = 0;
  const wusd_balance = 0;
  const om_balance = Number(localStorage.getItem("mantrabal"));
  const eth_balance = Number(localStorage.getItem("ethbal"));
  const btc_balance = Number(localStorage.getItem("btcbal"));

  // usd value
  const hkda_usd_value = 0.13;
  const usdc_usd_value = 0.9;
  const wusd_usd_value = 0.9;
  const om_usd_value = Number(localStorage.getItem("mantrausdval"));
  const eth_usd_value = Number(localStorage.getItem("ethvalue"));
  const btc_usd_value = Number(localStorage.getItem("btcvalue"));

  const display_balance =
    sellCurrency == "BTC"
      ? btc_balance
      : sellCurrency == "ETH"
      ? eth_balance
      : sellCurrency == "HKDA"
      ? hkda_balance
      : sellCurrency == "OM"
      ? om_balance
      : sellCurrency == "USDC"
      ? usdc_balance
      : wusd_balance;

  const onFindReceiveQty = () => {
    const sell_currency_usd_value =
      sellCurrency == "BTC"
        ? btc_usd_value
        : sellCurrency == "ETH"
        ? eth_usd_value
        : sellCurrency == "HKDA"
        ? hkda_usd_value
        : sellCurrency == "OM"
        ? om_usd_value
        : sellCurrency == "USDC"
        ? usdc_usd_value
        : wusd_usd_value;
    const receive_currency_usd_value =
      receiveCurrency == "BTC"
        ? btc_usd_value
        : receiveCurrency == "ETH"
        ? eth_usd_value
        : receiveCurrency == "HKDA"
        ? hkda_usd_value
        : receiveCurrency == "OM"
        ? om_usd_value
        : receiveCurrency == "USDC"
        ? usdc_usd_value
        : wusd_usd_value;

    const receive_amount =
      (Number(sellCurrencyValue) * sell_currency_usd_value) /
      receive_currency_usd_value;
    setReceiveCurrencyValue(receive_amount);
  };

  const onSwitchCurency = () => {
    setSellCurrency(receiveCurrency);
    setReceiveCurrency(sellCurrency);

    onFindReceiveQty();
  };

  const onMaxOut = () => {
    sellCurrency == "BTC"
      ? setSellCurrencyValue(String(btc_balance))
      : sellCurrency == "ETH"
      ? setSellCurrencyValue(String(eth_balance))
      : sellCurrency == "HKDA"
      ? setSellCurrencyValue(String(hkda_balance))
      : sellCurrency == "OM"
      ? setSellCurrencyValue(String(om_balance))
      : sellCurrency == "USDC"
      ? setSellCurrencyValue(String(usdc_balance))
      : setSellCurrencyValue(String(wusd_balance));

    onFindReceiveQty();
  };

  const goBack = () => {
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="swapcrypto" className="bg-[#0e0e0e] h-screen">
      <div className="sellcurr_ctr">
        <div className="curr_balance">
          <div className="curr">
            {sellCurrency == "HKDA" ? (
              <span className="currency_icon">🇭🇰</span>
            ) : (
              <img src={ethlogo} alt={sellCurrency} />
            )}
            <span className="font-bold text-sm text-gray-400">
              {sellCurrency}
            </span>
          </div>

          <p className="font-bold text-sm text-gray-400 flex gap-1">
            <span>{formatNumber(display_balance)}</span>&nbsp;
            {sellCurrency}
          </p>
        </div>

        <div className="input_ctr">
          <input
            type="text"
            inputMode="numeric"
            placeholder={`0.0 ${sellCurrency}`}
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
          {receiveCurrency == "HKDA" ? (
            <span className="currency_icon">🇭🇰</span>
          ) : (
            <img src={ethlogo} alt={receiveCurrency} />
          )}
          <span className="font-bold text-sm text-gray-400">
            {receiveCurrency}
          </span>
        </div>

        <div className="receive_qty">
          <p className="qty">
            {formatNumber(receiveCurrencyValue)} <span>{receiveCurrency}</span>
          </p>
          <p className="receive_title">Receive</p>
        </div>
      </div>

      <button disabled={sellCurrencyValue == "" || receiveCurrencyValue == 0}>
        Swap
      </button>
    </section>
  );
}
