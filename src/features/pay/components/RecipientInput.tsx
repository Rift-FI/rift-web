import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh",
  NGN: "\u20A6",
  UGX: "USh",
  TZS: "TSh",
  CDF: "FC",
  MWK: "MK",
  BRL: "R$",
  USD: "$",
};

// Institutions per currency with type info
const INSTITUTIONS: Record<string, { name: string; type: "mobile" | "bank" | "pix" }[]> = {
  KES: [{ name: "Safaricom", type: "mobile" }, { name: "Airtel", type: "mobile" }],
  NGN: [
    { name: "Access Bank", type: "bank" },
    { name: "GTBank", type: "bank" },
    { name: "First Bank", type: "bank" },
    { name: "UBA", type: "bank" },
    { name: "Zenith Bank", type: "bank" },
    { name: "Fidelity Bank", type: "bank" },
    { name: "FCMB", type: "bank" },
    { name: "Union Bank", type: "bank" },
    { name: "Polaris Bank", type: "bank" },
    { name: "Stanbic IBTC", type: "bank" },
    { name: "Sterling Bank", type: "bank" },
    { name: "Wema Bank", type: "bank" },
    { name: "Keystone Bank", type: "bank" },
    { name: "Ecobank", type: "bank" },
    { name: "Heritage Bank", type: "bank" },
  ],
  UGX: [
    { name: "MTN", type: "mobile" },
    { name: "Airtel Money", type: "mobile" },
  ],
  TZS: [
    { name: "Tigo Pesa", type: "mobile" },
    { name: "Airtel", type: "mobile" },
    { name: "CRDB Bank", type: "bank" },
    { name: "NMB", type: "bank" },
    { name: "Stanbic", type: "bank" },
    { name: "Bank of Africa", type: "bank" },
  ],
  CDF: [
    { name: "Orange Money", type: "mobile" },
    { name: "Airtel Money", type: "mobile" },
  ],
  MWK: [
    { name: "TNM", type: "mobile" },
    { name: "National Bank of Malawi", type: "bank" },
    { name: "Standard Bank", type: "bank" },
    { name: "FDH Bank", type: "bank" },
    { name: "NBS Bank", type: "bank" },
    { name: "Ecobank", type: "bank" },
  ],
  BRL: [
    { name: "Pix", type: "pix" },
  ],
};

const COUNTRY_NAMES: Record<string, string> = {
  KES: "Kenya",
  NGN: "Nigeria",
  UGX: "Uganda",
  TZS: "Tanzania",
  CDF: "DR Congo",
  MWK: "Malawi",
  BRL: "Brazil",
  USD: "International",
};

export default function RecipientInput() {
  const { paymentData, updatePaymentData, setCurrentStep } = usePay();
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [accountNumber, setAccountNumber] = useState(""); // Only for PAYBILL
  const [accountName, setAccountName] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const isDesktop = useDesktopDetection();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const isKenya = currency === "KES";
  const isBrazil = currency === "BRL";

  const institutions = INSTITUTIONS[currency] || [];
  const selectedInst = institutions.find((i) => i.name === selectedInstitution);
  const needsAccountName = selectedInst?.type === "bank";

  const handleBack = () => setCurrentStep("amount");

  // Format phone number to 07... format (Kenya-specific)
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("254")) {
      const localPart = cleaned.substring(3);
      if (localPart.startsWith("7")) return "07" + localPart.substring(1);
      if (localPart.startsWith("1")) return "01" + localPart.substring(1);
    }
    if (phone.startsWith("+254")) return formatPhoneNumber(cleaned);
    if (cleaned.startsWith("7") && cleaned.length === 9) return "07" + cleaned.substring(1);
    if (cleaned.startsWith("1") && cleaned.length === 9) return "01" + cleaned.substring(1);
    if (cleaned.startsWith("07") || cleaned.startsWith("01")) return cleaned;
    return cleaned;
  };

  const handleNext = () => {
    if (!accountIdentifier.trim()) return;
    if (isKenya && paymentData.type === "PAYBILL" && !accountNumber.trim()) return;
    if (!isKenya && !isBrazil && !selectedInstitution) return;
    if (needsAccountName && !accountName.trim()) return;

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
      recipient.type = paymentData.type;
      recipient.institution = selectedInstitution || "Safaricom";
      if (paymentData.type === "PAYBILL") {
        recipient.accountNumber = accountNumber.trim();
      }
    } else if (isBrazil) {
      recipient.institution = "Pix";
      recipient.type = "MOBILE";
    } else {
      recipient.institution = selectedInstitution;
      recipient.type = "MOBILE"; // Backend uses MOBILE for all non-Kenya
    }

    if (accountName.trim()) {
      recipient.accountName = accountName.trim();
    }

    updatePaymentData({ recipient });
    setCurrentStep("confirmation");
  };

  const isValidInput = () => {
    if (!accountIdentifier.trim()) return false;
    if (isKenya && paymentData.type === "PAYBILL" && !accountNumber.trim()) return false;
    if (!isKenya && !isBrazil && !selectedInstitution) return false;
    if (needsAccountName && !accountName.trim()) return false;
    return true;
  };

  const getInputLabels = () => {
    if (isKenya) {
      switch (paymentData.type) {
        case "MOBILE":
          return { primary: "Mobile Number", primaryPlaceholder: "0712 345 678", secondary: null, secondaryPlaceholder: null };
        case "PAYBILL":
          return { primary: "Paybill Number", primaryPlaceholder: "400200", secondary: "Account Number", secondaryPlaceholder: "Account number" };
        case "BUY_GOODS":
          return { primary: "Till Number", primaryPlaceholder: "123456", secondary: null, secondaryPlaceholder: null };
        default:
          return { primary: "Account", primaryPlaceholder: "", secondary: null, secondaryPlaceholder: null };
      }
    }

    if (isBrazil) {
      return { primary: "PIX Key", primaryPlaceholder: "email, CPF, phone, or random key", secondary: null, secondaryPlaceholder: null };
    }

    if (currency === "NGN") {
      return { primary: "Account Number", primaryPlaceholder: "0123456789", secondary: null, secondaryPlaceholder: null };
    }

    const isBank = selectedInst?.type === "bank";
    const placeholders: Record<string, string> = {
      UGX: "0771234567",
      TZS: isBank ? "1234567890" : "0651234567",
      CDF: "0991234567",
      MWK: isBank ? "1234567890" : "0881234567",
    };

    return {
      primary: isBank ? "Account Number" : "Phone Number",
      primaryPlaceholder: placeholders[currency] || "Phone number",
      secondary: null,
      secondaryPlaceholder: null,
    };
  };

  const labels = getInputLabels();

  const getPaymentTypeLabel = () => {
    if (isKenya) {
      switch (paymentData.type) {
        case "MOBILE": return "Send Money";
        case "PAYBILL": return "Paybill Payment";
        case "BUY_GOODS": return "Buy Goods Payment";
        default: return "Payment";
      }
    }
    return `Send to ${COUNTRY_NAMES[currency] || currency}`;
  };

  // Shared form fields
  const formFields = (
    <div className="w-full space-y-4">
      {/* Institution Selector (Non-Kenya, Non-Brazil) */}
      {!isKenya && !isBrazil && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {currency === "NGN" ? "Bank" : "Provider"} <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
            className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
          >
            <option value="">Select {currency === "NGN" ? "bank" : "provider"}</option>
            {institutions.map((inst) => (
              <option key={inst.name} value={inst.name}>
                {inst.name}{inst.type === "bank" ? " (Bank)" : inst.type === "mobile" ? " (Mobile)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kenya institution selector (Safaricom/Airtel for MOBILE) */}
      {isKenya && paymentData.type === "MOBILE" && (
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
            {institutions.map((inst) => (
              <option key={inst.name} value={inst.name}>{inst.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Primary Input */}
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
          autoFocus={isKenya || isBrazil}
        />
        {isBrazil && (
          <p className="text-xs text-text-subtle mt-1">Your PIX key can be email, CPF, phone number, or random key</p>
        )}
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
            placeholder={labels.secondaryPlaceholder || ""}
            className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
          />
        </div>
      )}

      {/* Account Name (required for bank transfers, optional otherwise) */}
      {!isBrazil && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Account Name{" "}
            {needsAccountName ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="text-text-subtle">(optional)</span>
            )}
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g., John Doe"
            className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
          />
        </div>
      )}
    </div>
  );

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

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-text-default mb-2">Enter Recipient Details</h2>
                <p className="text-text-subtle">
                  {isKenya && paymentData.type === "MOBILE" && "Enter the mobile number to send money to"}
                  {isKenya && paymentData.type === "PAYBILL" && "Enter the paybill and account details"}
                  {isKenya && paymentData.type === "BUY_GOODS" && "Enter the till number to pay to"}
                  {isBrazil && "Enter the PIX key to send money to"}
                  {!isKenya && !isBrazil && currency === "NGN" && "Enter the bank details to send money to"}
                  {!isKenya && !isBrazil && currency !== "NGN" && "Enter the details and select the provider"}
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

              {formFields}

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
              {isBrazil && "Enter the PIX key to send money to"}
              {!isKenya && !isBrazil && currency === "NGN" && "Enter the bank details to send money to"}
              {!isKenya && !isBrazil && currency !== "NGN" && "Enter the details and select the provider"}
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

          <div className="w-full max-w-sm mx-auto">
            {formFields}
          </div>

          {/* Mobile Button */}
          <div className="mt-auto pt-4">
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
