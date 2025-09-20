import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";

export default function RecipientInput() {
  const { paymentData, updatePaymentData, setCurrentStep } = usePay();
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [accountNumber, setAccountNumber] = useState(""); // Only for PAYBILL
  const [accountName, setAccountName] = useState(""); // Optional display name

  const handleBack = () => {
    setCurrentStep("amount");
  };

  // Format phone number to 07... format
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If starts with 254, convert to 07 format
    if (cleaned.startsWith('254')) {
      const localPart = cleaned.substring(3);
      if (localPart.startsWith('7')) {
        return '07' + localPart.substring(1);
      }
      if (localPart.startsWith('1')) {
        return '01' + localPart.substring(1);
      }
    }
    
    // If starts with +254, remove + and convert
    if (phone.startsWith('+254')) {
      return formatPhoneNumber(cleaned);
    }
    
    // If starts with 7 (9 digits), add 07
    if (cleaned.startsWith('7') && cleaned.length === 9) {
      return '07' + cleaned.substring(1);
    }
    
    // If starts with 1 (9 digits), add 01  
    if (cleaned.startsWith('1') && cleaned.length === 9) {
      return '01' + cleaned.substring(1);
    }
    
    // If already in 07... or 01... format, keep as is
    if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
      return cleaned;
    }
    
    // Default: return cleaned number
    return cleaned;
  };

  const handleNext = () => {
    if (!accountIdentifier.trim()) return;
    if (paymentData.type === "PAYBILL" && !accountNumber.trim()) return;

    // Format phone number for MOBILE type
    const formattedIdentifier = paymentData.type === "MOBILE" 
      ? formatPhoneNumber(accountIdentifier.trim())
      : accountIdentifier.trim();

    const recipient = {
      accountIdentifier: formattedIdentifier,
      ...(paymentData.type === "PAYBILL" && { accountNumber: accountNumber.trim() }),
      ...(accountName.trim() && { accountName: accountName.trim() }),
      institution: "Safaricom" as const,
      type: paymentData.type!,
      currency: "KES" as const,
    };

    updatePaymentData({ recipient });
    setCurrentStep("confirmation");
  };

  const isValidInput = () => {
    if (!accountIdentifier.trim()) return false;
    if (paymentData.type === "PAYBILL" && !accountNumber.trim()) return false;
    return true;
  };

  const getInputLabels = () => {
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
  };

  const labels = getInputLabels();

  const getPaymentTypeLabel = () => {
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
  };

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col h-full p-4"
    >
      <div className="flex items-center justify-between mb-8">
        <button onClick={handleBack} className="p-2">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">{getPaymentTypeLabel()}</h1>
        <div className="w-5 h-5" /> {/* Placeholder for alignment */}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium mb-2">Enter Details</h2>
        <p className="text-text-subtle">
          {paymentData.type === "MOBILE" && "Enter the mobile number to send money to"}
          {paymentData.type === "PAYBILL" && "Enter the paybill and account details"}
          {paymentData.type === "BUY_GOODS" && "Enter the till number to pay to"}
        </p>
      </div>

      {/* Amount Summary */}
      <div className="bg-surface-subtle rounded-lg p-4 mb-6">
        <div className="text-center">
          <p className="text-text-subtle text-sm">Amount to Pay</p>
          <p className="text-2xl font-bold">KSh {(paymentData.amount || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto space-y-4">
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
            autoFocus
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

      <div className="mt-auto">
        <ActionButton
          onClick={handleNext}
          disabled={!isValidInput()}
          className="w-full"
        >
          Review Payment
        </ActionButton>
      </div>
    </motion.div>
  );
}