import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { assetType } from "../lend/CreateLendAsset";
import { useBackButton } from "../../hooks/backbutton";
import { formatNumber } from "../../utils/formatters";
import { SubmitButton } from "../../components/global/Buttons";
import { CryptoPopOver } from "../../components/global/PopOver";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import wusdlogo from "../../assets/images/wusd.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import "../../styles/pages/transactions/swapcrypto.scss";

export default function SwapCrypto(): JSX.Element {
  const navigate = useNavigate();

  const [sellCurrency, setSellCurrency] =
    useState<Exclude<assetType, "USD" | "HKD">>("HKDA");
  const [receiveCurrency, setReceiveCurrency] =
    useState<Exclude<assetType, "USD" | "HKD">>("USDC");
  const [sellCurrencyValue, setSellCurrencyValue] = useState<string>("");
  const [receiveCurrencyValue, setReceiveCurrencyValue] = useState<number>(0);
  const [sellCurrencyAnchorEl, setSellCurrencyAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [receiveCurrencyAnchorEl, setReceiveCurrencyAnchorEl] =
    useState<HTMLDivElement | null>(null);

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
          <div
            className="curr"
            onClick={(e) => setSellCurrencyAnchorEl(e.currentTarget)}
          >
            {sellCurrency == "HKDA" ? (
              <span className="currency_icon">🇭🇰</span>
            ) : (
              <img
                src={
                  sellCurrency == "OM"
                    ? mantralogo
                    : sellCurrency == "WUSD"
                    ? wusdlogo
                    : sellCurrency == "USDC"
                    ? usdclogo
                    : sellCurrency == "ETH"
                    ? ethlogo
                    : btclogo
                }
                alt={sellCurrency}
              />
            )}
            <span className="font-bold text-sm text-gray-400">
              {sellCurrency}
            </span>
          </div>
          <CryptoPopOver
            anchorEl={sellCurrencyAnchorEl}
            setAnchorEl={setSellCurrencyAnchorEl}
            setCurrency={setSellCurrency}
          />

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
          <FaIcon faIcon={faArrowsRotate} color={colors.primary} />
        </button>
      </div>

      <div className="receivecurr_ctr">
        <div
          className="curr"
          onClick={(e) => setReceiveCurrencyAnchorEl(e.currentTarget)}
        >
          {receiveCurrency == "HKDA" ? (
            <span className="currency_icon">🇭🇰</span>
          ) : (
            <img
              src={
                receiveCurrency == "OM"
                  ? mantralogo
                  : receiveCurrency == "WUSD"
                  ? wusdlogo
                  : receiveCurrency == "USDC"
                  ? usdclogo
                  : receiveCurrency == "ETH"
                  ? ethlogo
                  : btclogo
              }
              alt={receiveCurrency}
            />
          )}
          <span className="font-bold text-sm text-gray-400">
            {receiveCurrency}
          </span>
        </div>
        <CryptoPopOver
          anchorEl={receiveCurrencyAnchorEl}
          setAnchorEl={setReceiveCurrencyAnchorEl}
          setCurrency={setReceiveCurrency}
        />

        <div className="receive_qty">
          <p className="qty">
            {formatNumber(receiveCurrencyValue)} <span>{receiveCurrency}</span>
          </p>
          <p className="receive_title">Receive</p>
        </div>
      </div>

      <ComingSoon />

      <SubmitButton
        text="Swap"
        icon={
          <FaIcon
            faIcon={faArrowsRotate}
            color={
              sellCurrencyValue == "" || receiveCurrencyValue == 0
                ? colors.textsecondary
                : colors.textprimary
            }
          />
        }
        sxstyles={{
          width: "unset",
          padding: "0.5rem",
          position: "fixed",
          bottom: "1rem",
          left: "1rem",
          right: "1rem",
          borderRadius: "1rem",
        }}
        isDisabled={sellCurrencyValue == "" || receiveCurrencyValue == 0}
        onclick={() => {}}
      />
    </section>
  );
}

export const ComingSoon = (): JSX.Element => {
  return (
    <div className="comingsoon">
      <p>Feature Coming Soon...</p>
    </div>
  );
};
