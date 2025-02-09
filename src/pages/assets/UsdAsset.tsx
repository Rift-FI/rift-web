import { JSX, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { formatNumber, formatUsd } from "../../utils/formatters";
import { Send } from "../../assets/icons/actions";
import { colors } from "../../constants";
import "../../styles/pages/assets/assets.scss";

export default function UsdAsset(): JSX.Element {
  const navigate = useNavigate();
  const { balance } = useParams();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.offClick(goBack);
      backButton.onClick(goBack);
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  return (
    <section id="btc-asset" className="fiat_asset">
      <span className="country_flag">🇺🇸</span>

      <div className="balance">
        <p>{formatUsd(Number(balance))}</p>
        <span>{formatNumber(Number(balance))} USD</span>
      </div>

      <div className="actions">
        <p>Send USD from your Airwallex balance</p>

        <span className="divider" />

        <div className="buttons">
          <button
            className="send"
            onClick={() => navigate(`/send-usd/send/${balance}`)}
          >
            Send USD <Send width={18} height={18} color={colors.textprimary} />
          </button>
        </div>
      </div>
    </section>
  );
}
