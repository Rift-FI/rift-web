import { JSX, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { formatUsd } from "../../utils/formatters";
import { QuickActions, CheckAlt, Info } from "../../assets/icons/actions";
import premiuum from "../../assets/images/icons/premium.png";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import hkdalogo from "../../assets/images/hkda.png";
import wusdlogo from "../../assets/images/wusd.png";

// Redefine PaymentAssetType directly using allowed string literals
// type PaymentAssetType = assetType | "WUSD"; // Old definition
type PaymentAssetType = "OM" | "USDC" | "HKDA" | "WUSD" | "BTC" | "ETH";

export default function SpherePremium(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { showerrorsnack } = useSnackbar();

  const [selectedCurrency, setSelectedCurrency] =
    useState<PaymentAssetType>("HKDA");

  const goBack = () => {
    const queryParams = new URLSearchParams(location.search);
    const returnPath = queryParams.get("returnPath");

    if (returnPath === "defi") {
      navigate(`/premiums?returnPath=${returnPath}`);
    } else {
      navigate("/premiums");
    }
  };

  const onConfirmSubscription = () => {
    showerrorsnack("Feature coming soon");
  };

  const getPrice = () => {
    const basePrice = 3;
    return selectedCurrency === "HKDA" || selectedCurrency === "WUSD"
      ? basePrice * 0.9
      : basePrice;
  };

  const handleCurrencySelect = (currency: PaymentAssetType) => {
    setSelectedCurrency(currency);
  };

  const currencies: Array<{
    type: PaymentAssetType;
    logo: string;
    name: string;
  }> = [
    { type: "OM", logo: mantralogo, name: "Mantra Token" },
    { type: "USDC", logo: usdclogo, name: "USD Coin" },
    { type: "HKDA", logo: hkdalogo, name: "HKDA" },
    { type: "WUSD", logo: wusdlogo, name: "WUSD" },
    { type: "BTC", logo: btclogo, name: "Bitcoin" },
    { type: "ETH", logo: ethlogo, name: "Ethereum" },
  ];

  const hasDiscount =
    selectedCurrency === "HKDA" || selectedCurrency === "WUSD";

  useBackButton(goBack);

  return (
    <section className="h-screen overflow-y-scroll bg-[#0e0e0e] px-4 py-6 pb-24">
      {/* Header Section */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg mb-6">
        <h1 className="text-[#f6f7f9] text-2xl font-bold mb-6">
          Complete Your Subscription
        </h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ffb386]/10 flex items-center justify-center">
              <img src={premiuum} alt="Sphere Premium" className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-[#f6f7f9] text-lg font-semibold">
                Sphere Premium
              </h2>
              <p className="text-gray-400 text-sm">Monthly Subscription</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm line-through mb-1">
              ${formatUsd(3).replace("$", "")}
            </div>
            {hasDiscount && (
              <div className="text-[#ffb386] text-lg font-bold">
                ${formatUsd(getPrice()).replace("$", "")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg mb-6">
        <h3 className="text-[#f6f7f9] text-lg font-semibold mb-4">
          Select Payment Method
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currencies.map((currency) => (
            <div
              key={currency.type}
              onClick={() => handleCurrencySelect(currency.type)}
              className={`relative flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                selectedCurrency === currency.type
                  ? "bg-[#2a2a2a] border border-[#ffb386]/20"
                  : "bg-[#2a2a2a] hover:bg-[#2a2a2a]/80"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#212121] flex items-center justify-center">
                <img
                  src={currency.logo}
                  alt={currency.type}
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-[#f6f7f9] font-medium">{currency.type}</h4>
                <p className="text-gray-400 text-sm">{currency.name}</p>
              </div>
              {selectedCurrency === currency.type && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <CheckAlt width={16} height={16} color="#7be891" />
                </div>
              )}
              {(currency.type === "HKDA" || currency.type === "WUSD") && (
                <div className="absolute -top-2 -right-2 bg-[#ffb386] text-[#0e0e0e] text-xs font-bold px-2 py-1 rounded-full">
                  10% OFF
                </div>
              )}
            </div>
          ))}
        </div>

        {hasDiscount && (
          <div className="flex items-center gap-2 mt-4 bg-[#ffb386]/10 text-[#ffb386] p-3 rounded-xl">
            <Info width={16} height={16} color="#ffb386" />
            <p className="text-sm">
              You're saving ${formatUsd(3 * 0.1).replace("$", "")} with{" "}
              {selectedCurrency}
            </p>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg mb-20">
        <div className="space-y-4">
          <div className="flex justify-between text-[#f6f7f9]">
            <span>Subscription</span>
            <span>${formatUsd(3).replace("$", "")} / month</span>
          </div>
          {hasDiscount && (
            <div className="flex justify-between text-[#ffb386]">
              <span>Discount (10%)</span>
              <span>-${formatUsd(3 * 0.1).replace("$", "")} / month</span>
            </div>
          )}
          <div className="flex justify-between text-[#f6f7f9] text-lg font-bold pt-4 border-t border-[#2a2a2a]">
            <span>Total</span>
            <span>${formatUsd(getPrice()).replace("$", "")} / month</span>
          </div>
        </div>
      </div>

      {/* Subscribe Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0e0e0e]">
        <button
          onClick={onConfirmSubscription}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#ffb386] text-[#0e0e0e] rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <QuickActions width={16} height={16} color="#0e0e0e" />
          <span>
            Subscribe for ${formatUsd(getPrice()).replace("$", "")} / month
          </span>
        </button>
      </div>
    </section>
  );
}
