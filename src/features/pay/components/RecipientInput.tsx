import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import type { Institution } from "../context";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

// Institutions per currency
const INSTITUTIONS: Record<Exclude<SupportedCurrency, "USD">, string[]> = {
  KES: ["Safaricom"],
  ETB: ["Telebirr"],
  UGX: ["MTN", "Airtel Money"],
  GHS: ["MTN", "AirtelTigo", "Airtel Money"],
  NGN: [], // TBD
};

export default function RecipientInput() {
  const navigate = useNavigate();
  const { paymentData, updatePaymentData, setCurrentStep } = usePay();
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [accountNumber, setAccountNumber] = useState(""); // Only for PAYBILL
  const [accountName, setAccountName] = useState(""); // Optional display name
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const isDesktop = useDesktopDetection();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const isKenya = currency === "KES";

  const handleBack = () => {
    navigate("/app");
  };

  // Format phone number to 07... format (Kenya-specific)
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // If starts with 254, convert to 07 format
    if (cleaned.startsWith("254")) {
      const localPart = cleaned.substring(3);
      if (localPart.startsWith("7")) {
        return "07" + localPart.substring(1);
      }
      if (localPart.startsWith("1")) {
        return "01" + localPart.substring(1);
      }
    }

    // If starts with +254, remove + and convert
    if (phone.startsWith("+254")) {
      return formatPhoneNumber(cleaned);
    }

    // If starts with 7 (9 digits), add 07
    if (cleaned.startsWith("7") && cleaned.length === 9) {
      return "07" + cleaned.substring(1);
    }

    // If starts with 1 (9 digits), add 01
    if (cleaned.startsWith("1") && cleaned.length === 9) {
      return "01" + cleaned.substring(1);
    }

    // If already in 07... or 01... format, keep as is
    if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
      return cleaned;
    }

    // Default: return cleaned number
    return cleaned;
  };

  const handleNext = () => {
    if (!accountIdentifier.trim()) return;
    if (isKenya && paymentData.type === "PAYBILL" && !accountNumber.trim()) return;
    if (!isKenya && !selectedInstitution) return;

    // Format phone number for Kenya MOBILE type
    const formattedIdentifier =
      isKenya && paymentData.type === "MOBILE"
        ? formatPhoneNumber(accountIdentifier.trim())
        : accountIdentifier.trim();

    const recipient: any = {
      accountIdentifier: formattedIdentifier,
      currency: currency,
    };

    if (isKenya) {
      // Kenya: Include type and use Safaricom
      recipient.type = paymentData.type;
      recipient.institution = "Safaricom";
      if (paymentData.type === "PAYBILL") {
        recipient.accountNumber = accountNumber.trim();
      }
    } else {
      // Other countries: Include selected institution, no type
      recipient.institution = selectedInstitution;
    }

    if (accountName.trim()) {
      recipient.accountName = accountName.trim();
    }

    updatePaymentData({ recipient });
    setCurrentStep("confirmation");
  };

  const isValidInput = () => {
    if (!accountIdentifier.trim()) return false;
    if (isKenya && paymentData.type === "PAYBILL" && !accountNumber.trim())
      return false;
    if (!isKenya && !selectedInstitution) return false;
    return true;
  };

  const getInputLabels = () => {
    if (isKenya) {
      switch (paymentData.type) {
        case "MOBILE":
          return {
            primary: "Mobile Number",
            primaryPlaceholder: "0712 345 678",
            secondary: null,
            secondaryPlaceholder: null,
          };
        case "PAYBILL":
          return {
            primary: "Paybill Number",
            primaryPlaceholder: "400200",
            secondary: "Account Number",
            secondaryPlaceholder: "Account number",
          };
        case "BUY_GOODS":
          return {
            primary: "Till Number",
            primaryPlaceholder: "123456",
            secondary: null,
            secondaryPlaceholder: null,
          };
        default:
          return {
            primary: "Account",
            primaryPlaceholder: "",
            secondary: null,
            secondaryPlaceholder: null,
          };
      }
    } else {
      // Non-Kenya countries - users enter without country code
      const placeholders: Record<Exclude<SupportedCurrency, "USD" | "KES">, string> = {
        ETB: "0912345678",  // Ethiopia format
        UGX: "0772345678",  // Uganda format
        GHS: "0241234567",  // Ghana format  
        NGN: "0803456789",  // Nigeria format
      };
      return {
        primary: "Phone Number",
        primaryPlaceholder: placeholders[currency as keyof typeof placeholders] || "Phone number",
        secondary: null,
        secondaryPlaceholder: null,
      };
    }
  };

  const labels = getInputLabels();

  const getPaymentTypeLabel = () => {
    if (isKenya) {
      switch (paymentData.type) {
        case "MOBILE":
          return "Send Money";
        case "PAYBILL":
          return "Paybill Payment";
        case "BUY_GOODS":
          return "Buy Goods Payment";
        default:
          return "Payment";
      }
    } else {
      const countryNames: Record<SupportedCurrency, string> = {
        KES: "Kenya",
        ETB: "Ethiopia",
        UGX: "Uganda",
        GHS: "Ghana",
        NGN: "Nigeria",
        USD: "International",
      };
      return `Send to ${countryNames[currency]}`;
    }
  };

  const content = (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`flex flex-col h-full ${isDesktop ? "p-8" : "p-4"}`}
    >
      {isDesktop ? (
        <div className="w-full max-w-2xl mx-auto">
          {/* Desktop Header */}
          <div className="flex items-center p-6 border-b border-gray-200 mb-6">
            <button
              onClick={handleBack}
              className="mr-4 p-2 rounded-2xl hover:bg-accent-primary/10 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-accent-primary" />
            </button>
            <h1 className="text-xl font-semibold text-text-default">
              {getPaymentTypeLabel()}
            </h1>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-text-default mb-2">Enter Recipient Details</h2>
                <p className="text-text-subtle">
                  {isKenya && paymentData.type === "MOBILE" && "Enter the mobile number to send money to"}
                  {isKenya && paymentData.type === "PAYBILL" && "Enter the paybill and account details"}
                  {isKenya && paymentData.type === "BUY_GOODS" && "Enter the till number to pay to"}
                  {!isKenya && "Enter the phone number and select the provider"}
                </p>
              </div>

              {/* Amount Summary */}
              <div className="bg-white rounded-2xl border-2 border-accent-primary/20 p-6 mb-6">
                <div className="text-center">
                  <p className="text-text-subtle text-sm mb-2">Amount to Send</p>
                  <p className="text-3xl font-bold text-text-default">
                    {currencySymbol} {(paymentData.amount || 0).toLocaleString()} ({currency})
                  </p>
                </div>
              </div>

              <div className="w-full space-y-4">
        {/* Institution Selector (Non-Kenya only) */}
        {!isKenya && currency !== "USD" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
            >
              <option value="">Select provider</option>
              {INSTITUTIONS[currency as keyof typeof INSTITUTIONS]?.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Primary Input (Mobile/Paybill/Till Number) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {labels.primary} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={accountIdentifier}
            onChange={(e) => setAccountIdentifier(e.target.value)}
            placeholder={labels.primaryPlaceholder}
            className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
            autoFocus={isKenya} // Only autofocus for Kenya (since others need to select institution first)
          />
        </div>

        {/* Secondary Input (Account Number for Paybill) */}
        {labels.secondary && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {labels.secondary} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={labels.secondaryPlaceholder}
              className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
            />
          </div>
        )}

        {/* Optional Account Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Account Name <span className="text-text-subtle">(optional)</span>
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g., John Doe"
            className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
          />
            </div>
          </div>

          {/* Desktop Button */}
          <div className="mt-8">
            <button
              onClick={handleNext}
              disabled={!isValidInput()}
              className="w-full max-w-sm mx-auto flex items-center justify-center py-3.5 px-6 rounded-xl font-semibold bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={handleBack} className="p-2">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">{getPaymentTypeLabel()}</h1>
        <div className="w-5 h-5" />
      </div>

      {/* Mobile Content */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium mb-2">Enter Recipient Details</h2>
        <p className="text-text-subtle">
          {isKenya && paymentData.type === "MOBILE" && "Enter the mobile number to send money to"}
          {isKenya && paymentData.type === "PAYBILL" && "Enter the paybill and account details"}
          {isKenya && paymentData.type === "BUY_GOODS" && "Enter the till number to pay to"}
          {!isKenya && "Enter the phone number and select the provider"}
        </p>
      </div>

      {/* Mobile Amount Summary */}
      <div className="bg-surface-subtle rounded-lg p-4 mb-6">
        <div className="text-center">
          <p className="text-text-subtle text-sm">Amount to Send</p>
          <p className="text-2xl font-bold">
            {currencySymbol} {(paymentData.amount || 0).toLocaleString()} ({currency})
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto space-y-4">
        {/* Mobile Institution Selector */}
        {!isKenya && currency !== "USD" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
            >
              <option value="">Select provider</option>
              {INSTITUTIONS[currency as keyof typeof INSTITUTIONS]?.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mobile Primary Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {labels.primary} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={accountIdentifier}
            onChange={(e) => setAccountIdentifier(e.target.value)}
            placeholder={labels.primaryPlaceholder}
            className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
            autoFocus={isKenya}
          />
        </div>

        {/* Mobile Secondary Input */}
        {labels.secondary && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {labels.secondary} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={labels.secondaryPlaceholder}
              className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
            />
          </div>
        )}

        {/* Mobile Optional Account Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Account Name <span className="text-text-subtle">(optional)</span>
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g., John Doe"
            className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
          />
        </div>
      </div>

      {/* Mobile Button */}
      <div className="mt-auto">
        <ActionButton
          onClick={handleNext}
          disabled={!isValidInput()}
          className="w-full rounded-2xl"
        >
          Review Payment
        </ActionButton>
      </div>
    </>
  )}
</motion.div>
);

  return (
    <div className="h-full flex flex-col">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="lg" className="h-full">
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}
