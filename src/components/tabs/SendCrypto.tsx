import { Dispatch, JSX, SetStateAction, useState } from "react";
import { useNavigate } from "react-router";
import {
  faLink,
  faAddressBook,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import { assetType } from "../../pages/lend/CreateLendAsset";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";

import { FaIcon } from "../../assets/faicon";

import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import usdclogo from "../../assets/images/labs/usdc.png";

import "../../styles/components/tabs/sendcrypto.scss";

type sendcryptotype = Exclude<assetType, "USD" | "HKD" | "HKDA">;

export const SendCryptoTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [selectCurrency, setSelectCurrency] = useState<sendcryptotype>("OM");
  const [sendOption, setSendOption] = useState<"link" | "address">("link");

  const goBack = () => {
    switchtab("home");
  };

  const onSend = () => {
    if (sendOption == "link") {
      localStorage.setItem("prev_page", "send-options");
      navigate(`/sendcollectlink/${selectCurrency}/send`);
    } else {
      localStorage.setItem("prev_page", "send-options");
      navigate(`/send-crypto/${selectCurrency}/send`);
    }
  };

  useBackButton(goBack);

  return (
    <section id="sendcrypto">
      <div className="header">
        <h1>Send Crypto</h1>
        <p className="subtitle">Choose your preferred method to send crypto</p>
      </div>

      <div className="selector-container">
        <h2>1. Select cryptocurrency</h2>
        <SendCryptoPicker
          selectCrypto={selectCurrency}
          setSelectCrypto={setSelectCurrency}
        />
      </div>

      <div className="method-container">
        <h2>2. Choose sending method</h2>

        <div className="methods">
          <div
            className={`method-card ${sendOption === "link" ? "selected" : ""}`}
            onClick={() => setSendOption("link")}
          >
            <div className="method-icon link-icon">
              <FaIcon faIcon={faLink} color="#ffffff" fontsize={20} />
            </div>
            <div className="method-content">
              <h3>Click-to-Collect Link</h3>
              <p>Recipients claim funds via secure link</p>
              <ul>
                <li>Funds are only deducted when claimed</li>
                <li>No wallet address needed from recipient</li>
              </ul>
            </div>
            <div className="select-indicator">
              {sendOption === "link" && <div className="checkmark">✓</div>}
            </div>
          </div>

          <div
            className={`method-card ${
              sendOption === "address" ? "selected" : ""
            }`}
            onClick={() => setSendOption("address")}
          >
            <div className="method-icon address-icon">
              <FaIcon faIcon={faAddressBook} color="#ffffff" fontsize={20} />
            </div>
            <div className="method-content">
              <h3>To an Address</h3>
              <p>Send directly to a wallet</p>
              <ul>
                <li>Traditional crypto transfer</li>
                <li>Recipient must have a wallet</li>
              </ul>
            </div>
            <div className="select-indicator">
              {sendOption === "address" && <div className="checkmark">✓</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          className="bg-[#ffb386] flex items-center gap-1 p-3 rounded-2xl w-full justify-center"
          onClick={onSend}
        >
          <span>Continue</span>
          <FaIcon faIcon={faAngleRight} color="#000" fontsize={16} />
        </button>
        <p className="text-gray-400 text-xs mt-2 text-center">
          Click to proceed to the next step
        </p>
      </div>
    </section>
  );
};

interface selectorProps {
  selectCrypto: sendcryptotype;
  setSelectCrypto: Dispatch<SetStateAction<sendcryptotype>>;
}

const SendCryptoPicker = ({
  selectCrypto,
  setSelectCrypto,
}: selectorProps): JSX.Element => {
  const cryptoOptions = [
    {
      symbol: "OM",
      name: "Mantra",
      icon: mantralogo,
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      icon: btclogo,
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      icon: ethlogo,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: usdclogo,
    },
  ];

  return (
    <div className="crypto-selector">
      {cryptoOptions.map((crypto) => (
        <div
          key={crypto.symbol}
          className={`crypto-option ${
            selectCrypto === crypto.symbol ? "selected" : ""
          }`}
          onClick={() => setSelectCrypto(crypto.symbol as sendcryptotype)}
        >
          <img src={crypto.icon} alt={crypto.name} />
          <div className="crypto-info">
            <span className="symbol">{crypto.symbol}</span>
            <span className="name">{crypto.name}</span>
          </div>
          <div className="select-circle">
            {selectCrypto === crypto.symbol && (
              <div className="inner-circle"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
