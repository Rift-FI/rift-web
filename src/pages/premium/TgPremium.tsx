import { JSX, MouseEvent, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../../hooks/snackbar";
import { formatUsd } from "../../utils/formatters";
import { assetType } from "../lend/CreateLendAsset";
import { CurrencyPopOver } from "../../components/global/PopOver";
import { Telegram } from "../../assets/icons/actions";
import { colors } from "../../constants";
import premiuum from "../../assets/images/icons/premium.png";
import "../../styles/pages/premiums/tgpremium.scss";

export default function TelegramPremium(): JSX.Element {
  const navigate = useNavigate();
  const { showerrorsnack } = useSnackbar();

  const [premiumDuration, setPremiumDuration] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const [selectCurrency, setSelectCurrency] = useState<assetType>("HKDA");
  const [currencyAnchorEl, setCurrencyAnchorEl] =
    useState<HTMLDivElement | null>(null);

  const goBack = () => {
    navigate("/premiums");
  };

  const openCurrencyPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setCurrencyAnchorEl(event.currentTarget);
  };

  const onGetPremium = () => {
    showerrorsnack("Feature coming soon");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="tgpremium">
      <p className="title">
        Premium <span>/ Telegram</span>
      </p>

      <div className="icon_ctr">
        <span className="icon">
          <img src={premiuum} alt="premium" />
        </span>
        <div className="img">
          <Telegram color={colors.accent} />
        </div>
      </div>

      <p className="updgrade_downgrade">
        Get Telegram Premium <span>Telegram Premium</span>
      </p>

      <div className="duration">
        <p className="cost">
          {premiumDuration == "monthly" ? formatUsd(3.99) : formatUsd(29.99)}
          &nbsp;
          <span>/ {premiumDuration == "monthly" ? "month" : "year"}</span>
        </p>

        <p className="save">
          Save<span> 39% </span>with the Yearly subscription
        </p>

        <div className="buttons">
          <button
            className={premiumDuration == "monthly" ? "sel_duration" : ""}
            onClick={() => setPremiumDuration("monthly")}
          >
            Monthly
          </button>
          <button
            className={premiumDuration == "yearly" ? "sel_duration" : ""}
            onClick={() => setPremiumDuration("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="cta_ctr">
        <div className="pay_options">
          <p>
            Payment Options
            <span>Choose a payment method</span>
          </p>

          <div className="currency_picker" onClick={openCurrencyPopOver}>
            {selectCurrency}
          </div>
          <CurrencyPopOver
            anchorEl={currencyAnchorEl}
            setAnchorEl={setCurrencyAnchorEl}
            setCurrency={setSelectCurrency}
          />
        </div>

        <div className="total">
          <p>Total</p>
          <span>
            {premiumDuration == "monthly" ? formatUsd(3.99) : formatUsd(28.99)}
          </span>
        </div>

        <button className="getpremium" onClick={onGetPremium}>
          Get Telegram Premium
        </button>
      </div>
    </section>
  );
}
