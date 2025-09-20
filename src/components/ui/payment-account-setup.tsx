import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSmartphone, FiCreditCard, FiShoppingBag, FiX } from "react-icons/fi";
import { toast } from "sonner";
import ActionButton from "./action-button";

export type PaymentAccountType = "MOBILE" | "PAYBILL" | "BUY_GOODS";

export interface PaymentAccountData {
  accountIdentifier: string;
  accountNumber?: string;
  accountName?: string;
  institution: "Safaricom";
  type: PaymentAccountType;
  currency: "KES";
}

interface PaymentAccountSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentAccount: string) => void;
  currentPaymentAccount?: string;
}

export default function PaymentAccountSetup({
  isOpen,
  onClose,
  onSave,
  currentPaymentAccount,
}: PaymentAccountSetupProps) {
  const [selectedType, setSelectedType] = useState<PaymentAccountType | null>(null);
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // Parse current payment account if exists
  const currentAccount = currentPaymentAccount ? 
    (() => {
      try {
        return JSON.parse(currentPaymentAccount) as PaymentAccountData;
      } catch {
        return null;
      }
    })() : null;

  // Format phone number to 07... format
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('254')) {
      const localPart = cleaned.substring(3);
      if (localPart.startsWith('7')) {
        return '07' + localPart.substring(1);
      }
      if (localPart.startsWith('1')) {
        return '01' + localPart.substring(1);
      }
    }
    
    if (phone.startsWith('+254')) {
      return formatPhoneNumber(cleaned);
    }
    
    if (cleaned.startsWith('7') && cleaned.length === 9) {
      return '07' + cleaned.substring(1);
    }
    
    if (cleaned.startsWith('1') && cleaned.length === 9) {
      return '01' + cleaned.substring(1);
    }
    
    if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
      return cleaned;
    }
    
    return cleaned;
  };

  const handleSave = () => {
    if (!selectedType || !accountIdentifier.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedType === "PAYBILL" && !accountNumber.trim()) {
      toast.error("Account number is required for Paybill");
      return;
    }

    // Format phone number for MOBILE type
    const formattedIdentifier = selectedType === "MOBILE" 
      ? formatPhoneNumber(accountIdentifier.trim())
      : accountIdentifier.trim();

    const paymentAccountData: PaymentAccountData = {
      accountIdentifier: formattedIdentifier,
      ...(selectedType === "PAYBILL" && { accountNumber: accountNumber.trim() }),
      ...(accountName.trim() && { accountName: accountName.trim() }),
      institution: "Safaricom",
      type: selectedType,
      currency: "KES",
    };

    const paymentAccountString = JSON.stringify(paymentAccountData);
    onSave(paymentAccountString);
    onClose();
    
    // Reset form
    setSelectedType(null);
    setAccountIdentifier("");
    setAccountNumber("");
    setAccountName("");
  };

  const getTypeLabel = (type: PaymentAccountType) => {
    switch (type) {
      case "MOBILE": return "Mobile Number";
      case "PAYBILL": return "Paybill";
      case "BUY_GOODS": return "Buy Goods";
    }
  };

  const getTypeIcon = (type: PaymentAccountType) => {
    switch (type) {
      case "MOBILE": return <FiSmartphone className="w-5 h-5" />;
      case "PAYBILL": return <FiCreditCard className="w-5 h-5" />;
      case "BUY_GOODS": return <FiShoppingBag className="w-5 h-5" />;
    }
  };

  const getInputLabels = () => {
    switch (selectedType) {
      case "MOBILE":
        return {
          primary: "Mobile Number",
          primaryPlaceholder: "0712 345 678",
          secondary: null,
        };
      case "PAYBILL":
        return {
          primary: "Paybill Number",
          primaryPlaceholder: "400200",
          secondary: "Account Number",
        };
      case "BUY_GOODS":
        return {
          primary: "Till Number",
          primaryPlaceholder: "123456",
          secondary: null,
        };
      default:
        return { primary: "", primaryPlaceholder: "", secondary: null };
    }
  };

  const labels = getInputLabels();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            className="relative w-full max-w-md bg-app-background rounded-t-xl p-6 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Setup Withdrawal Account</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-subtle rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Current Account Display */}
            {currentAccount && (
              <div className="bg-surface-subtle rounded-lg p-4 mb-6">
                <p className="text-sm text-text-subtle mb-2">Current Withdrawal Account</p>
                <div className="flex items-center gap-3">
                  {getTypeIcon(currentAccount.type)}
                  <div>
                    <p className="font-medium">{getTypeLabel(currentAccount.type)}</p>
                    <p className="text-sm text-text-subtle">
                      {currentAccount.accountIdentifier}
                      {currentAccount.accountNumber && ` - ${currentAccount.accountNumber}`}
                      {currentAccount.accountName && ` (${currentAccount.accountName})`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selectedType ? (
              /* Type Selection */
              <div className="space-y-3">
                <p className="text-text-subtle mb-4">Choose account type for instant withdrawals:</p>
                
                {(["MOBILE", "PAYBILL", "BUY_GOODS"] as PaymentAccountType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="w-full p-4 bg-surface-subtle hover:bg-surface rounded-lg transition-colors flex items-center gap-4 text-left"
                  >
                    <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
                      {getTypeIcon(type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{getTypeLabel(type)}</h3>
                      <p className="text-sm text-text-subtle">
                        {type === "MOBILE" && "Send to mobile number"}
                        {type === "PAYBILL" && "Pay to business number"}
                        {type === "BUY_GOODS" && "Pay to till number"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Account Details Form */
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  {getTypeIcon(selectedType)}
                  <h3 className="text-lg font-medium">{getTypeLabel(selectedType)}</h3>
                  <button
                    onClick={() => setSelectedType(null)}
                    className="ml-auto text-accent-primary text-sm"
                  >
                    Change
                  </button>
                </div>

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
                    className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
                      placeholder="Account number"
                      className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                  </div>
                )}

                {/* Account Name (Optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Account Name <span className="text-text-subtle">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>

                {/* Save Button */}
                <ActionButton
                  onClick={handleSave}
                  className="w-full mt-6"
                >
                  Save Withdrawal Account
                </ActionButton>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}