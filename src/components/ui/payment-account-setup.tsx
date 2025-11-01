import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSmartphone, FiCreditCard, FiShoppingBag, FiX } from "react-icons/fi";
import { toast } from "sonner";
import ActionButton from "./action-button";
import useCountryDetection, { SupportedCurrency } from "@/hooks/data/use-country-detection";

export type PaymentAccountType = "MOBILE" | "PAYBILL" | "BUY_GOODS";

export interface PaymentAccountData {
  accountIdentifier: string;
  accountNumber?: string;
  accountName?: string;
  institution: string;
  type?: PaymentAccountType;
  currency: SupportedCurrency;
}

// Mobile money providers by country
const MOBILE_MONEY_PROVIDERS: Record<SupportedCurrency, string[]> = {
  KES: ["Safaricom"], // Kenya (keep existing flow)
  ETB: ["Telebirr"], // Ethiopia
  UGX: ["MTN", "Airtel Money"], // Uganda
  GHS: ["MTN", "AirtelTigo", "Airtel Money"], // Ghana
  NGN: [], // Nigeria - pending
  USD: [], // USD - not applicable
};

interface PaymentAccountSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentAccount: string) => void;
  currentPaymentAccount?: string;
  selectedCurrency?: SupportedCurrency; // Currency selected on homepage
}

export default function PaymentAccountSetup({
  isOpen,
  onClose,
  onSave,
  currentPaymentAccount,
  selectedCurrency: homepageSelectedCurrency,
}: PaymentAccountSetupProps) {
  // Detect user's country via IP
  const { data: countryInfo } = useCountryDetection();
  
  const [localSelectedCurrency, setLocalSelectedCurrency] = useState<SupportedCurrency>("KES");
  const [selectedType, setSelectedType] = useState<PaymentAccountType | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [showCountryMismatchPrompt, setShowCountryMismatchPrompt] = useState(false);
  const [suggestedCurrency, setSuggestedCurrency] = useState<SupportedCurrency | null>(null);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  // Parse current payment account if exists
  const currentAccount = currentPaymentAccount ? 
    (() => {
      try {
        return JSON.parse(currentPaymentAccount) as PaymentAccountData;
      } catch {
        return null;
      }
    })() : null;

  // Check for country mismatch and show prompt
  // Priority: 1. Homepage selected currency, 2. localStorage currency, 3. IP detected country
  useEffect(() => {
    if (isOpen && currentAccount) {
      const currentCurrency = currentAccount.currency;
      let detectedCurrency: SupportedCurrency | null = null;

      // First check if user manually selected a different currency on homepage
      if (homepageSelectedCurrency && 
          homepageSelectedCurrency !== currentCurrency &&
          MOBILE_MONEY_PROVIDERS[homepageSelectedCurrency].length > 0) {
        detectedCurrency = homepageSelectedCurrency;
      }
      // Then check localStorage (user may have selected currency earlier)
      else {
        const stored = localStorage.getItem("selected_currency");
        if (stored && 
            stored !== currentCurrency &&
            stored in MOBILE_MONEY_PROVIDERS && 
            MOBILE_MONEY_PROVIDERS[stored as SupportedCurrency].length > 0) {
          detectedCurrency = stored as SupportedCurrency;
        }
        // Otherwise check IP-detected country
        else if (countryInfo && 
                 countryInfo.currency !== currentCurrency && 
                 MOBILE_MONEY_PROVIDERS[countryInfo.currency].length > 0) {
          detectedCurrency = countryInfo.currency;
        }
      }

      if (detectedCurrency) {
        setSuggestedCurrency(detectedCurrency);
        setShowCountryMismatchPrompt(true);
      } else {
        setShowCountryMismatchPrompt(false);
      }
    }
  }, [isOpen, countryInfo, currentAccount, homepageSelectedCurrency]);

  // Set default currency based on homepage selection, localStorage, or detected country
  useEffect(() => {
    if (homepageSelectedCurrency && MOBILE_MONEY_PROVIDERS[homepageSelectedCurrency].length > 0) {
      setLocalSelectedCurrency(homepageSelectedCurrency);
    } else {
      // Try localStorage
      const stored = localStorage.getItem("selected_currency");
      if (stored && stored in MOBILE_MONEY_PROVIDERS && MOBILE_MONEY_PROVIDERS[stored as SupportedCurrency].length > 0) {
        setLocalSelectedCurrency(stored as SupportedCurrency);
      } else if (countryInfo && MOBILE_MONEY_PROVIDERS[countryInfo.currency].length > 0) {
        setLocalSelectedCurrency(countryInfo.currency);
      }
    }
  }, [countryInfo, homepageSelectedCurrency]);

  // Reset switching state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsSwitchingAccount(false);
      setShowCountryMismatchPrompt(false);
    }
  }, [isOpen]);

  // Format phone number to 07... format for Kenya
  const formatKenyanPhoneNumber = (phone: string) => {
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
      return formatKenyanPhoneNumber(cleaned);
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
    // For Kenya, use existing validation
    if (localSelectedCurrency === "KES") {
      if (!selectedType || !accountIdentifier.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (selectedType === "PAYBILL" && !accountNumber.trim()) {
        toast.error("Account number is required for Paybill");
        return;
      }

      const formattedIdentifier = selectedType === "MOBILE" 
        ? formatKenyanPhoneNumber(accountIdentifier.trim())
        : accountIdentifier.trim();

      const paymentAccountData: PaymentAccountData = {
        accountIdentifier: formattedIdentifier,
        ...(selectedType === "PAYBILL" && { accountNumber: accountNumber.trim() }),
        ...(accountName.trim() && { accountName: accountName.trim() }),
        institution: "Safaricom",
        type: selectedType,
        currency: localSelectedCurrency,
      };

      const paymentAccountString = JSON.stringify(paymentAccountData);
      onSave(paymentAccountString);
      onClose();
      resetForm();
      return;
    }

    // For other countries (Ethiopia, Uganda, Ghana)
    if (!selectedInstitution || !accountIdentifier.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const paymentAccountData: PaymentAccountData = {
      accountIdentifier: accountIdentifier.trim(),
      ...(accountName.trim() && { accountName: accountName.trim() }),
      institution: selectedInstitution,
      currency: localSelectedCurrency,
    };

    const paymentAccountString = JSON.stringify(paymentAccountData);
    onSave(paymentAccountString);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedType(null);
    setSelectedInstitution(null);
    setAccountIdentifier("");
    setAccountNumber("");
    setAccountName("");
    setIsSwitchingAccount(false);
    setShowCountryMismatchPrompt(false);
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
    if (localSelectedCurrency === "KES" && selectedType) {
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
      }
    }

    // For other countries
    return {
      primary: "Phone Number",
      primaryPlaceholder: localSelectedCurrency === "ETB" ? "0911 234 567" :
                         localSelectedCurrency === "UGX" ? "0700 123 456" :
                         localSelectedCurrency === "GHS" ? "0240 123 456" : 
                         "Phone number",
      secondary: null,
    };
  };

  const labels = getInputLabels();

  const availableProviders = MOBILE_MONEY_PROVIDERS[localSelectedCurrency];
  const isKenyaFlow = localSelectedCurrency === "KES";
  const showCurrencySelector = !currentAccount && !isSwitchingAccount; // Only show selector for brand new accounts

  // Get country name by currency
  const getCountryName = (currency: SupportedCurrency) => {
    const countryNames: Record<SupportedCurrency, string> = {
      KES: "Kenya",
      ETB: "Ethiopia",
      UGX: "Uganda",
      GHS: "Ghana",
      NGN: "Nigeria",
      USD: "International",
    };
    return countryNames[currency];
  };

  // Check if currency is supported
  if (localSelectedCurrency === "NGN") {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              className="relative w-full max-w-md bg-app-background rounded-t-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Setup Withdrawal Account</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-subtle rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center py-8">
                <p className="text-text-subtle mb-4">
                  🇳🇬 Withdrawals for Nigeria are coming soon!
                </p>
                <p className="text-sm text-text-subtle">
                  We're working hard to bring this feature to you.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  if (availableProviders.length === 0 || localSelectedCurrency === "USD") {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              className="relative w-full max-w-md bg-app-background rounded-t-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Setup Withdrawal Account</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-subtle rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center py-8">
                <p className="text-text-subtle mb-4">
                  Withdrawals are not yet available in your region.
                </p>
                <p className="text-sm text-text-subtle">
                  Please check back later or contact support.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

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

            {/* Country Mismatch Prompt */}
            {showCountryMismatchPrompt && currentAccount && suggestedCurrency && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🌍</div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">
                      {homepageSelectedCurrency && homepageSelectedCurrency === suggestedCurrency
                        ? `You're viewing ${getCountryName(suggestedCurrency)} prices`
                        : `We detected you are in ${getCountryName(suggestedCurrency)}`
                      }
                    </h3>
                    <p className="text-sm text-text-subtle mb-4">
                      Your current withdrawal account is set up for {getCountryName(currentAccount.currency)}. 
                      {homepageSelectedCurrency && homepageSelectedCurrency === suggestedCurrency
                        ? `Would you like to update your withdrawal account to match?`
                        : `Would you like to switch to a ${getCountryName(suggestedCurrency)} withdrawal account?`
                      }
                    </p>
                    <div className="flex gap-3">
                      <ActionButton
                        onClick={() => {
                          setShowCountryMismatchPrompt(false);
                          setLocalSelectedCurrency(suggestedCurrency);
                          setIsSwitchingAccount(true);
                        }}
                        className="flex-1 py-2 text-sm"
                      >
                        Switch to {suggestedCurrency}
                      </ActionButton>
                      <button
                        onClick={() => {
                          setShowCountryMismatchPrompt(false);
                          setLocalSelectedCurrency(currentAccount.currency);
                          setIsSwitchingAccount(false);
                          onClose(); // Close modal when keeping current account
                        }}
                        className="flex-1 py-2 text-sm bg-surface-subtle hover:bg-surface rounded-lg transition-colors"
                      >
                        Keep {currentAccount.currency}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Current Account Display */}
            {currentAccount && !showCountryMismatchPrompt && !isSwitchingAccount && (
              <div className="bg-surface-subtle rounded-lg p-4 mb-6">
                <p className="text-sm text-text-subtle mb-2">Current Withdrawal Account</p>
                <div className="flex items-center gap-3">
                  <FiSmartphone className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{currentAccount.institution}</p>
                    <p className="text-sm text-text-subtle">
                      {currentAccount.accountIdentifier}
                      {currentAccount.accountNumber && ` - ${currentAccount.accountNumber}`}
                      {currentAccount.accountName && ` (${currentAccount.accountName})`}
                    </p>
                    <p className="text-xs text-text-subtle mt-1">{currentAccount.currency}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Only show form content if not showing country mismatch prompt OR if switching */}
            {(!showCountryMismatchPrompt || isSwitchingAccount) && (
              <>
                {/* Currency Selector (only for new accounts) */}
                {showCurrencySelector && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Select Country</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(MOBILE_MONEY_PROVIDERS) as SupportedCurrency[])
                        .filter(curr => MOBILE_MONEY_PROVIDERS[curr].length > 0 && curr !== "USD")
                        .map((currency) => (
                          <button
                            key={currency}
                        onClick={() => {
                          setLocalSelectedCurrency(currency);
                          setSelectedType(null);
                          setSelectedInstitution(null);
                        }}
                        className={`p-3 rounded-lg border transition-colors ${
                          localSelectedCurrency === currency
                            ? "bg-accent-primary/10 border-accent-primary"
                            : "bg-surface-subtle border-surface hover:bg-surface"
                        }`}
                          >
                            <span className="font-medium">{currency}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Kenya Flow - Account Type Selection */}
                {isKenyaFlow && !selectedType && (
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
            )}

            {/* Other Countries - Institution Selection */}
            {!isKenyaFlow && !selectedInstitution && (
              <div className="space-y-3">
                <p className="text-text-subtle mb-4">Choose your mobile money provider:</p>
                
                {availableProviders.map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setSelectedInstitution(provider)}
                    className="w-full p-4 bg-surface-subtle hover:bg-surface rounded-lg transition-colors flex items-center gap-4 text-left"
                  >
                    <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
                      <FiSmartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{provider}</h3>
                      <p className="text-sm text-text-subtle">
                        Withdraw to {provider} account
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Account Details Form */}
            {(isKenyaFlow ? selectedType : selectedInstitution) && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <FiSmartphone className="w-5 h-5" />
                  <h3 className="text-lg font-medium">
                    {isKenyaFlow ? getTypeLabel(selectedType!) : selectedInstitution}
                  </h3>
                  <button
                    onClick={() => {
                      if (isKenyaFlow) {
                        setSelectedType(null);
                      } else {
                        setSelectedInstitution(null);
                      }
                      setAccountIdentifier("");
                      setAccountNumber("");
                      setAccountName("");
                    }}
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
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
