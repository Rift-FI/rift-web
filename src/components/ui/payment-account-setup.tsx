import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSmartphone, FiCreditCard, FiShoppingBag, FiX } from "react-icons/fi";
import { toast } from "sonner";
import ActionButton from "./action-button";
import useCountryDetection, { SupportedCurrency } from "@/hooks/data/use-country-detection";
import useDesktopDetection from "@/hooks/use-desktop-detection";

export type PaymentAccountType = "MOBILE" | "PAYBILL" | "BUY_GOODS";

export interface PaymentAccountData {
  accountIdentifier: string;
  accountNumber?: string;
  accountName?: string;
  institution: string;
  type?: PaymentAccountType;
  currency: SupportedCurrency;
  bankCode?: string;
}

// Providers/institutions by currency
const PROVIDERS: Record<string, { name: string; type: "mobile" | "bank" | "pix" }[]> = {
  KES: [
    { name: "Safaricom", type: "mobile" },
    { name: "Airtel", type: "mobile" },
  ],
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

// Currency to country name
const CURRENCY_COUNTRY: Record<string, string> = {
  KES: "Kenya",
  NGN: "Nigeria",
  UGX: "Uganda",
  TZS: "Tanzania",
  CDF: "DR Congo",
  MWK: "Malawi",
  BRL: "Brazil",
};

// Currencies that are supported for withdrawal account setup
const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["KES", "NGN", "UGX", "TZS", "CDF", "MWK", "BRL"];

interface PaymentAccountSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentAccount: string) => void;
  currentPaymentAccount?: string;
  selectedCurrency?: SupportedCurrency;
}

export default function PaymentAccountSetup({
  isOpen,
  onClose,
  onSave,
  currentPaymentAccount,
  selectedCurrency: homepageSelectedCurrency,
}: PaymentAccountSetupProps) {
  const { data: countryInfo } = useCountryDetection();
  const isDesktop = useDesktopDetection();

  const [localSelectedCurrency, setLocalSelectedCurrency] = useState<SupportedCurrency>("KES");
  const [selectedType, setSelectedType] = useState<PaymentAccountType | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [showCountryMismatchPrompt, setShowCountryMismatchPrompt] = useState(false);
  const [suggestedCurrency, setSuggestedCurrency] = useState<SupportedCurrency | null>(null);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  const currentAccount = currentPaymentAccount
    ? (() => {
        try {
          return JSON.parse(currentPaymentAccount) as PaymentAccountData;
        } catch {
          return null;
        }
      })()
    : null;

  // Check for country mismatch
  useEffect(() => {
    if (isOpen && currentAccount) {
      const currentCurrency = currentAccount.currency;
      let detectedCurrency: SupportedCurrency | null = null;

      if (
        homepageSelectedCurrency &&
        homepageSelectedCurrency !== currentCurrency &&
        SUPPORTED_CURRENCIES.includes(homepageSelectedCurrency)
      ) {
        detectedCurrency = homepageSelectedCurrency;
      } else {
        const stored = localStorage.getItem("selected_currency");
        if (
          stored &&
          stored !== currentCurrency &&
          SUPPORTED_CURRENCIES.includes(stored as SupportedCurrency)
        ) {
          detectedCurrency = stored as SupportedCurrency;
        } else if (
          countryInfo &&
          countryInfo.currency !== currentCurrency &&
          SUPPORTED_CURRENCIES.includes(countryInfo.currency)
        ) {
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

  // Set default currency
  useEffect(() => {
    if (homepageSelectedCurrency && SUPPORTED_CURRENCIES.includes(homepageSelectedCurrency)) {
      setLocalSelectedCurrency(homepageSelectedCurrency);
    } else {
      const stored = localStorage.getItem("selected_currency");
      if (stored && SUPPORTED_CURRENCIES.includes(stored as SupportedCurrency)) {
        setLocalSelectedCurrency(stored as SupportedCurrency);
      } else if (countryInfo && SUPPORTED_CURRENCIES.includes(countryInfo.currency)) {
        setLocalSelectedCurrency(countryInfo.currency);
      }
    }
  }, [countryInfo, homepageSelectedCurrency]);

  useEffect(() => {
    if (!isOpen) {
      setIsSwitchingAccount(false);
      setShowCountryMismatchPrompt(false);
    }
  }, [isOpen]);

  const formatKenyanPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("254")) {
      const localPart = cleaned.substring(3);
      if (localPart.startsWith("7")) return "07" + localPart.substring(1);
      if (localPart.startsWith("1")) return "01" + localPart.substring(1);
    }
    if (phone.startsWith("+254")) return formatKenyanPhoneNumber(cleaned);
    if (cleaned.startsWith("7") && cleaned.length === 9) return "07" + cleaned.substring(1);
    if (cleaned.startsWith("1") && cleaned.length === 9) return "01" + cleaned.substring(1);
    if (cleaned.startsWith("07") || cleaned.startsWith("01")) return cleaned;
    return cleaned;
  };

  const selectedProvider = selectedInstitution
    ? PROVIDERS[localSelectedCurrency]?.find((p) => p.name === selectedInstitution)
    : null;

  const needsAccountName =
    selectedProvider?.type === "bank" || localSelectedCurrency === "NGN";

  const handleSave = () => {
    // Kenya flow
    if (localSelectedCurrency === "KES") {
      if (!selectedType || !accountIdentifier.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (selectedType === "PAYBILL" && !accountNumber.trim()) {
        toast.error("Account number is required for Paybill");
        return;
      }

      const formattedIdentifier =
        selectedType === "MOBILE"
          ? formatKenyanPhoneNumber(accountIdentifier.trim())
          : accountIdentifier.trim();

      const data: PaymentAccountData = {
        accountIdentifier: formattedIdentifier,
        ...(selectedType === "PAYBILL" && { accountNumber: accountNumber.trim() }),
        ...(accountName.trim() && { accountName: accountName.trim() }),
        institution: selectedInstitution || "Safaricom",
        type: selectedType,
        currency: localSelectedCurrency,
      };

      onSave(JSON.stringify(data));
      onClose();
      resetForm();
      return;
    }

    // BRL PIX flow
    if (localSelectedCurrency === "BRL") {
      if (!accountIdentifier.trim()) {
        toast.error("Please enter your PIX key");
        return;
      }

      const data: PaymentAccountData = {
        accountIdentifier: accountIdentifier.trim(),
        institution: "Pix",
        type: "MOBILE",
        currency: "BRL",
      };

      onSave(JSON.stringify(data));
      onClose();
      resetForm();
      return;
    }

    // All other currencies
    if (!selectedInstitution || !accountIdentifier.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (needsAccountName && !accountName.trim()) {
      toast.error("Account name is required for bank transfers");
      return;
    }

    const data: PaymentAccountData = {
      accountIdentifier: accountIdentifier.trim(),
      ...(accountName.trim() && { accountName: accountName.trim() }),
      institution: selectedInstitution,
      type: "MOBILE",
      currency: localSelectedCurrency,
    };

    onSave(JSON.stringify(data));
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
          return { primary: "Mobile Number", primaryPlaceholder: "0712 345 678" };
        case "PAYBILL":
          return { primary: "Paybill Number", primaryPlaceholder: "400200" };
        case "BUY_GOODS":
          return { primary: "Till Number", primaryPlaceholder: "123456" };
      }
    }

    if (localSelectedCurrency === "BRL") {
      return { primary: "PIX Key", primaryPlaceholder: "email, CPF, phone, or random key" };
    }

    if (localSelectedCurrency === "NGN") {
      return { primary: "Account Number", primaryPlaceholder: "0123456789" };
    }

    const placeholders: Record<string, string> = {
      UGX: "0771234567",
      TZS: selectedProvider?.type === "bank" ? "1234567890" : "0651234567",
      CDF: "0991234567",
      MWK: selectedProvider?.type === "bank" ? "1234567890" : "0881234567",
    };

    return {
      primary: selectedProvider?.type === "bank" ? "Account Number" : "Phone Number",
      primaryPlaceholder: placeholders[localSelectedCurrency] || "Phone number",
    };
  };

  const availableProviders = PROVIDERS[localSelectedCurrency] || [];
  const isKenyaFlow = localSelectedCurrency === "KES";
  const isBrazilFlow = localSelectedCurrency === "BRL";
  const showCurrencySelector = !currentAccount && !isSwitchingAccount;

  const getCountryName = (currency: SupportedCurrency) =>
    CURRENCY_COUNTRY[currency] || currency;

  // Unsupported currency
  if (!SUPPORTED_CURRENCIES.includes(localSelectedCurrency)) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center md:left-[calc((100vw-28rem)/2)] md:right-[calc((100vw-28rem)/2)]">
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
                <button onClick={onClose} className="p-2 hover:bg-surface-subtle rounded-full transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center py-8">
                <p className="text-text-subtle mb-4">Withdrawals are not yet available in your region.</p>
                <p className="text-sm text-text-subtle">Please check back later or contact support.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  const labels = getInputLabels();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex ${isDesktop ? "items-center justify-center" : "items-end justify-center"}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.95 } : { y: "100%" }}
            animate={isDesktop ? { opacity: 1, scale: 1 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95 } : { y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            className={`relative w-full max-w-md bg-app-background ${isDesktop ? "rounded-xl" : "rounded-t-xl"} p-6 max-h-[80vh] overflow-y-auto ${isDesktop ? "" : "pb-24"} shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Setup Withdrawal Account</h2>
              <button onClick={onClose} className="p-2 hover:bg-surface-subtle rounded-full transition-colors">
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
                        : `We detected you are in ${getCountryName(suggestedCurrency)}`}
                    </h3>
                    <p className="text-sm text-text-subtle mb-4">
                      Your current withdrawal account is set up for {getCountryName(currentAccount.currency)}.{" "}
                      Would you like to switch to a {getCountryName(suggestedCurrency)} withdrawal account?
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
                          onClose();
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

            {(!showCountryMismatchPrompt || isSwitchingAccount) && (
              <>
                {/* Currency Selector (only for new accounts) */}
                {showCurrencySelector && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Select Country</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <button
                          key={currency}
                          onClick={() => {
                            setLocalSelectedCurrency(currency);
                            setSelectedType(null);
                            setSelectedInstitution(null);
                            setAccountIdentifier("");
                            setAccountNumber("");
                            setAccountName("");
                          }}
                          className={`p-3 rounded-lg border transition-colors text-left ${
                            localSelectedCurrency === currency
                              ? "bg-accent-primary/10 border-accent-primary"
                              : "bg-surface-subtle border-surface hover:bg-surface"
                          }`}
                        >
                          <span className="font-medium">{CURRENCY_COUNTRY[currency]}</span>
                          <span className="text-xs text-text-subtle ml-1">({currency})</span>
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

                {/* Brazil PIX Flow */}
                {isBrazilFlow && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <FiSmartphone className="w-5 h-5" />
                      <h3 className="text-lg font-medium">PIX Payment</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        PIX Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={accountIdentifier}
                        onChange={(e) => setAccountIdentifier(e.target.value)}
                        placeholder="email, CPF, phone, or random key"
                        className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      />
                      <p className="text-xs text-text-subtle mt-1">Your PIX key can be an email, CPF, phone number, or random key</p>
                    </div>
                    <ActionButton onClick={handleSave} className="w-full mt-6">
                      Save Withdrawal Account
                    </ActionButton>
                  </div>
                )}

                {/* Other Countries - Institution Selection */}
                {!isKenyaFlow && !isBrazilFlow && !selectedInstitution && (
                  <div className="space-y-3">
                    <p className="text-text-subtle mb-4">
                      Choose your {availableProviders.some((p) => p.type === "bank") ? "provider" : "mobile money provider"}:
                    </p>
                    {availableProviders.map((provider) => (
                      <button
                        key={provider.name}
                        onClick={() => setSelectedInstitution(provider.name)}
                        className="w-full p-4 bg-surface-subtle hover:bg-surface rounded-lg transition-colors flex items-center gap-4 text-left"
                      >
                        <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
                          {provider.type === "bank" ? <FiCreditCard className="w-5 h-5" /> : <FiSmartphone className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-medium">{provider.name}</h3>
                          <p className="text-sm text-text-subtle">
                            {provider.type === "bank" ? "Bank transfer" : "Mobile money"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Kenya MOBILE - Institution Selector */}
                {isKenyaFlow && selectedType === "MOBILE" && !selectedInstitution && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                      <button onClick={() => setSelectedType(null)} className="text-accent-primary text-sm">Back</button>
                    </div>
                    <p className="text-text-subtle mb-4">Select your mobile money provider:</p>
                    {availableProviders.map((provider) => (
                      <button
                        key={provider.name}
                        onClick={() => setSelectedInstitution(provider.name)}
                        className="w-full p-4 bg-surface-subtle hover:bg-surface rounded-lg transition-colors flex items-center gap-4 text-left"
                      >
                        <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
                          <FiSmartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{provider.name}</h3>
                          <p className="text-sm text-text-subtle">Mobile money</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Account Details Form (Kenya with type+institution selected OR other countries with institution selected) */}
                {((isKenyaFlow && selectedType && (selectedType !== "MOBILE" || selectedInstitution)) || (!isKenyaFlow && !isBrazilFlow && selectedInstitution)) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <FiSmartphone className="w-5 h-5" />
                      <h3 className="text-lg font-medium">
                        {isKenyaFlow ? `${getTypeLabel(selectedType!)}${selectedInstitution ? ` - ${selectedInstitution}` : ''}` : selectedInstitution}
                      </h3>
                      <button
                        onClick={() => {
                          if (isKenyaFlow) setSelectedType(null);
                          else setSelectedInstitution(null);
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

                    {/* Account Number for Paybill */}
                    {isKenyaFlow && selectedType === "PAYBILL" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Account Number <span className="text-red-500">*</span>
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

                    {/* Account Name (required for bank, optional otherwise) */}
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
                        className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      />
                    </div>

                    <ActionButton onClick={handleSave} className="w-full mt-6">
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
