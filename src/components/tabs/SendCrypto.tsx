import { Dispatch, JSX, SetStateAction, useState } from "react";
import { useNavigate } from "react-router";
import { faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";
import { assetType } from "../../pages/lend/CreateLendAsset";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { SubmitButton } from "../global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import usdclogo from "../../assets/images/labs/usdc.png";
import sendtoaddress from "../../assets/images/obhehalfspend.png";
import sendtolink from "../../assets/images/sharewallet.png";
import "../../styles/components/tabs/sendcrypto.scss";

type sendcryptotype = Exclude<assetType, "USD" | "HKD" | "HKDA">;

export const SendCryptoTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [selectCurrency, setSelectCurrency] = useState<sendcryptotype>("OM");
  const [sendOPtion, setSendOPtion] = useState<"link" | "address">("address");

  const goBack = () => {
    switchtab("home");
  };

  const onSend = () => {
    if (sendOPtion == "link") {
      navigate(`/sendcollectlink/${selectCurrency}/send`);
    } else {
      navigate(`/send-crypto/${selectCurrency}/send`);
    }
  };

  useBackButton(goBack);

  return (
    <section id="sendcrypto">
      <p className="send_title">
        Send Crypto
        <span>Send crypto instantly to another address or via Telegram</span>
      </p>

      <SendCryptoPicker
        selectCrypto={selectCurrency}
        setSelectCrypto={setSelectCurrency}
      />

      <p className="description">Choose the crypto to send</p>

      <p className="options_title">
        How would you like to send <span>{selectCurrency}</span> ?
      </p>

      <div
        id={sendOPtion == "address" ? "sendoption" : ""}
        className="send_option"
        onClick={() => setSendOPtion("address")}
      >
        <p>
          To an Address
          <span>Send {selectCurrency} directly to another address</span>
        </p>
        <img src={sendtoaddress} alt="send claim link" />
      </div>

      <div
        id={sendOPtion == "link" ? "sendoption" : ""}
        className="send_option"
        onClick={() => setSendOPtion("link")}
      >
        <p>
          Through a Link
          <span>Create a secure {selectCurrency} link that you can share</span>
        </p>
        <img src={sendtolink} alt="send claim link" />
      </div>

      <SubmitButton
        text={`Send ${selectCurrency}`}
        icon={<FaIcon faIcon={faCircleArrowUp} color={colors.textprimary} />}
        sxstyles={{
          width: "unset",
          position: "absolute",
          bottom: "4.5rem",
          left: "1rem",
          right: "1rem",
          fontWeight: "bold",
        }}
        onclick={onSend}
      />
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
  return (
    <div className="select_currency_ctr">
      <div className="select_currency">
        <div
          className="currency_img_desc"
          onClick={() => setSelectCrypto("OM")}
        >
          <div className="flag_balance">
            <img src={mantralogo} alt="asset" />

            <p className="desc">
              OM <br /> <span>Mantra</span>
            </p>
          </div>

          <div className="radioctr">
            <div
              style={{
                backgroundColor:
                  selectCrypto == "OM" ? colors.textprimary : colors.primary,
              }}
            ></div>
          </div>
        </div>

        <div
          className="currency_img_desc"
          onClick={() => setSelectCrypto("BTC")}
        >
          <div className="flag_balance">
            <img src={btclogo} alt="asset" />

            <p className="desc">
              BTC <br /> <span>Bitcoin</span>
            </p>
          </div>

          <div className="radioctr">
            <div
              style={{
                backgroundColor:
                  selectCrypto == "BTC" ? colors.textprimary : colors.primary,
              }}
            ></div>
          </div>
        </div>

        <div
          className="currency_img_desc"
          onClick={() => setSelectCrypto("ETH")}
        >
          <div className="flag_balance">
            <img src={ethlogo} alt="asset" />

            <p className="desc">
              ETH <br /> <span>Ethereum</span>
            </p>
          </div>

          <div className="radioctr">
            <div
              style={{
                backgroundColor:
                  selectCrypto == "ETH" ? colors.textprimary : colors.primary,
              }}
            ></div>
          </div>
        </div>

        <div
          className="currency_img_desc l_currency"
          onClick={() => setSelectCrypto("USDC")}
        >
          <div className="flag_balance">
            <img src={usdclogo} alt="asset" />

            <p className="desc">
              USDC <br /> <span>USD Coin</span>
            </p>
          </div>

          <div className="radioctr">
            <div
              style={{
                backgroundColor:
                  selectCrypto == "USDC" ? colors.textprimary : colors.primary,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
