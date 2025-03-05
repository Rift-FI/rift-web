import { JSX, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { formatUsd } from "../../utils/formatters";
import { assetType } from "../lend/CreateLendAsset";
import { SubmitButton } from "../../components/global/Buttons";
import { colors } from "../../constants";
import { QuickActions, CheckAlt, Info } from "../../assets/icons/actions";
import premiuum from "../../assets/images/icons/premium.png";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import hkdalogo from "../../assets/images/hkda.png";
import wusdlogo from "../../assets/images/wusd.png";
import "../../styles/pages/premiums/spherepremium.scss";

// Extended asset type to include WUSD
type PaymentAssetType = assetType | "WUSD";

export default function SpherePremium(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { showerrorsnack } = useSnackbar();

  const [selectedCurrency, setSelectedCurrency] = useState<PaymentAssetType>("HKDA");

  const goBack = () => {
    // Check if we have a returnPath query parameter
    const queryParams = new URLSearchParams(location.search);
    const returnPath = queryParams.get('returnPath');
    
    if (returnPath === 'defi') {
      // Return to the Premium page with the returnPath preserved
      navigate(`/premiums?returnPath=${returnPath}`);
    } else {
      // Default behavior
      navigate("/premiums");
    }
  };

  const onConfirmSubscription = () => {
    showerrorsnack("Feature coming soon");
  };

  const getPrice = () => {
    const basePrice = 3; // Only monthly option now
    // Apply 10% discount for HKDA and WUSD
    if (selectedCurrency === "HKDA" || selectedCurrency === "WUSD") {
      return basePrice * 0.9;
    }
    return basePrice;
  };

  const handleCurrencySelect = (currency: PaymentAssetType) => {
    setSelectedCurrency(currency);
  };

  useBackButton(goBack);

  const currencies: Array<{type: PaymentAssetType, logo: string, name: string}> = [
    { type: "OM", logo: mantralogo, name: "Mantra Token" },
    { type: "USDC", logo: usdclogo, name: "USD Coin" },
    { type: "HKDA", logo: hkdalogo, name: "HKDA" },
    { type: "WUSD", logo: wusdlogo, name: "WUSD" },
    { type: "BTC", logo: btclogo, name: "Bitcoin" },
    { type: "ETH", logo: ethlogo, name: "Ethereum" }
  ];

  // Check if selected currency is eligible for discount
  const hasDiscount = selectedCurrency === "HKDA" || selectedCurrency === "WUSD";

  return (
    <section id="payment-options">
      <div className="payment-header">
        <h1>Complete Your Subscription</h1>
        <div className="subscription-details">
          <div className="product-info">
            <div className="product-icon">
              <img src={premiuum} alt="Sphere Premium" />
            </div>
            <div className="product-details">
              <h2>Sphere Premium</h2>
              <p>Monthly Subscription</p>
            </div>
          </div>
          <div className="price-tag">
            <span className="original-price">{formatUsd(3)}</span>
            {hasDiscount && (
              <span className="discounted-price">{formatUsd(getPrice())}</span>
            )}
          </div>
        </div>
      </div>

      <div className="payment-methods">
        <h3>Select Payment Method</h3>
        
        <div className="currency-options">
          {currencies.map((currency) => (
            <div 
              key={currency.type}
              className={`currency-card ${selectedCurrency === currency.type ? 'selected' : ''} ${(currency.type === "HKDA" || currency.type === "WUSD") ? 'discount-available' : ''}`}
              onClick={() => handleCurrencySelect(currency.type)}
            >
              <div className="currency-icon">
                <img src={currency.logo} alt={currency.type} />
              </div>
              <div className="currency-info">
                <h4>{currency.type}</h4>
                <p>{currency.name}</p>
              </div>
              {selectedCurrency === currency.type && (
                <div className="selected-indicator">
                  <CheckAlt width={12} height={12} color={colors.success} />
                </div>
              )}
              {(currency.type === "HKDA" || currency.type === "WUSD") && (
                <div className="discount-badge">
                  10% OFF
                </div>
              )}
            </div>
          ))}
        </div>

        {hasDiscount && (
          <div className="discount-info">
            <Info width={14} height={14} color={colors.accent} />
            <p>You're saving {formatUsd(3 * 0.1)} with {selectedCurrency}</p>
          </div>
        )}
      </div>

      <div className="payment-summary">
        <div className="summary-row">
          <span>Subscription</span>
          <span>{formatUsd(3)} / month</span>
        </div>
        {hasDiscount && (
          <div className="summary-row discount">
            <span>Discount (10%)</span>
            <span>-{formatUsd(3 * 0.1)} / month</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Total</span>
          <span>{formatUsd(getPrice())} / month</span>
        </div>
      </div>

      <div className="confirm-button-container">
        <SubmitButton
          text={`Subscribe for ${formatUsd(getPrice())} / month`}
          icon={<QuickActions width={12} height={12} color={colors.textprimary} />}
          sxstyles={{
            width: "100%",
            gap: "0.5rem",
            height: "2.65rem",
            borderRadius: "0.5rem",
          }}
          onclick={onConfirmSubscription}
        />
      </div>
    </section>
  );
}
