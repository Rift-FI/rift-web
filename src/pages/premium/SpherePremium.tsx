import { JSX, MouseEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { formatUsd } from "../../utils/formatters";
import { assetType } from "../lend/CreateLendAsset";
import { CurrencyPopOver } from "../../components/global/PopOver";
import { SubmitButton } from "../../components/global/Buttons";
import { colors } from "../../constants";
import spherelogo from "../../assets/images/sphere.jpg";
import premiuum from "../../assets/images/icons/premium.png";
import "../../styles/pages/premiums/spherepremium.scss";

export default function SpherePremium(): JSX.Element {
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

  useBackButton(goBack);

  return (
    <section id="spherepremium">
      <p className="title">Sphere Premium</p>

      <div className="icon_ctr">
        <span className="icon">
          <img src={premiuum} alt="premium" />
        </span>
        <img className="premium_service" src={spherelogo} alt="Sphere" />
      </div>

      <p className="updgrade_downgrade">
        Upgrade to premium
        <span>Stratosphere Premium</span>
      </p>

      <div className="duration">
        <p className="cost">
          {premiumDuration == "monthly" ? formatUsd(6.05) : formatUsd(57.99)}
          &nbsp;
          <span>/ {premiumDuration == "monthly" ? "month" : "year"}</span>
        </p>

        <p className="save">
          Save<span> 20% </span>with the Yearly subscription
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
            <em
              style={{
                textDecoration: selectCurrency == "HKDA" ? "line-through" : "",
                color: selectCurrency == "HKDA" ? colors.danger : "",
              }}
            >
              {premiumDuration == "monthly"
                ? formatUsd(6.05)
                : formatUsd(57.99)}
            </em>

            {selectCurrency == "HKDA" && (
              <em className="discounted_price">
                {premiumDuration == "monthly"
                  ? formatUsd(6.05 - 6.05 * 0.1)
                  : formatUsd(57.99 - 57.99 * 0.1)}
              </em>
            )}
          </span>
        </div>

        <p className="discount">
          Get <span>10%</span> off when you pay with HKDA
        </p>

        <SubmitButton
          text="Get Sphere Premium"
          sxstyles={{ marginTop: "0.5rem" }}
          onclick={onGetPremium}
        />
      </div>
    </section>
  );
}
