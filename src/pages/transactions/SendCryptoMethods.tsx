import { JSX, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { RadioButton } from "../../components/global/Radios";
import { ArrowUpCircle } from "../../assets/icons";
import { colors } from "../../constants";
import ethlogo from "../../assets/images/logos/eth.png";
import beralogo from "../../assets/images/logos/bera.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import linkicon from "../../assets/images/icons/link.png";
import walleticon from "../../assets/images/icons/wallet.png";
import "../../styles/pages/transactions/sendcryptomethods.scss";

export type cryptoassets = "ETH" | "WBERA" | "USDC" | "WUSDC";

export default function SendCryptoMethods(): JSX.Element {
  const navigate = useNavigate();
  const { srccurrency, intent } = useParams();
  const { switchtab } = useTabs();

  const prev_page = localStorage.getItem("prev_page");
  const initialCurrency: cryptoassets = srccurrency as string as cryptoassets;

  const [selectedtAsset, setSelectedAsset] =
    useState<cryptoassets>(initialCurrency);
  const [sendMethod, setSendMethod] = useState<"link" | "address">("link");

  const goBack = () => {
    if (prev_page == null) {
      switchtab("home");
      navigate("/app");
    } else if (prev_page === "rewards") {
      switchtab("rewards");
      navigate("/app");
    } else {
      navigate(prev_page);
    }
  };

  const onGoToSend = () => {
    localStorage.setItem("prev_page", "send-options");

    if (sendMethod == "link") {
      navigate(`/sendcollectlink/${selectedtAsset}/${intent}`);
    } else {
      navigate(`/send-crypto/${selectedtAsset}/${intent}`);
    }
  };

  useBackButton(goBack);

  return (
    <section id="sendcryptomethods">
      <p className="title_desc">
        Send Crypto
        <span>
          You can send crypto directly to an address or via secure links
        </span>
      </p>

      <div className="crypto-options">
        <RadioButton
          image={ethlogo}
          title="Ethereum"
          description="ETH"
          ischecked={selectedtAsset == "ETH"}
          onclick={() => setSelectedAsset("ETH")}
        />

        <RadioButton
          image={beralogo}
          title="Berachain"
          description="BERA"
          ischecked={selectedtAsset == "WBERA"}
          onclick={() => setSelectedAsset("WBERA")}
        />

        <RadioButton
          image={usdclogo}
          title="USDC (Polygon)"
          description="USDC"
          ischecked={selectedtAsset == "USDC"}
          onclick={() => setSelectedAsset("USDC")}
        />

        <RadioButton
          image={usdclogo}
          title="USDC (Berachain)"
          description="USDC.e"
          ischecked={selectedtAsset == "WUSDC"}
          onclick={() => setSelectedAsset("WUSDC")}
        />
      </div>

      <p className="send-desc">
        Would you like to send&nbsp;
        <span>
          {selectedtAsset == "WUSDC"
            ? "USDC.e"
            : selectedtAsset == "WBERA"
            ? "BERA"
            : selectedtAsset}
        </span>
        &nbsp;to another address or via a secure Sphere link ?
      </p>

      <div className="send-options">
        <RadioButton
          image={linkicon}
          title="Send via Sphere link"
          description="We will create a secure link for you"
          ischecked={sendMethod == "link"}
          onclick={() => setSendMethod("link")}
        />

        <RadioButton
          image={walleticon}
          title="Send to address"
          description={`Send ${
            selectedtAsset == "WUSDC"
              ? "USDC.e"
              : selectedtAsset == "WBERA"
              ? "BERA"
              : selectedtAsset
          } to another address`}
          ischecked={sendMethod == "address"}
          onclick={() => setSendMethod("address")}
        />
      </div>

      <button onClick={onGoToSend}>
        Send&nbsp;
        {selectedtAsset == "WUSDC"
          ? "USDC.e"
          : selectedtAsset == "WBERA"
          ? "BERA"
          : selectedtAsset}
        <ArrowUpCircle color={colors.textprimary} />
      </button>
    </section>
  );
}
