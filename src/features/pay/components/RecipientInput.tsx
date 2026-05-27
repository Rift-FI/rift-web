import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiArrowLeft, FiSearch, FiCheck, FiX } from "react-icons/fi";
import { usePay } from "../context";
import ActionButton from "@/components/ui/action-button";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";
import { useKenyaBankPaybills } from "@/hooks/data/use-kenya-bank-paybills";

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
  KES: [
    { name: "Safaricom", type: "mobile" },
    { name: "Airtel", type: "mobile" },
    // KES banks are loaded dynamically from /reference/kenya-bank-paybills
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
    // Only mobile-money rails are currently supported for Tanzania off-ramp.
    // M-Pesa and bank transfers are temporarily disabled per integrator
    // limitations — only Airtel Money and Tigo Pesa go through.
    { name: "Tigo Pesa", type: "mobile" },
    { name: "Airtel", type: "mobile" },
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

// Brand-adjacent gradient tints for bank avatars — gives each bank a unique
// feel without needing real logos. Colors stay inside the Rift palette family.
const BANK_AVATAR_TINTS: { bg: string; fg: string; ring: string }[] = [
  { bg: "bg-gradient-to-br from-emerald-400 to-emerald-600", fg: "text-white", ring: "ring-emerald-500/30" },
  { bg: "bg-gradient-to-br from-sky-400 to-sky-600",         fg: "text-white", ring: "ring-sky-500/30" },
  { bg: "bg-gradient-to-br from-violet-400 to-violet-600",   fg: "text-white", ring: "ring-violet-500/30" },
  { bg: "bg-gradient-to-br from-amber-400 to-orange-500",    fg: "text-white", ring: "ring-amber-500/30" },
  { bg: "bg-gradient-to-br from-rose-400 to-rose-600",       fg: "text-white", ring: "ring-rose-500/30" },
  { bg: "bg-gradient-to-br from-indigo-400 to-indigo-600",   fg: "text-white", ring: "ring-indigo-500/30" },
  { bg: "bg-gradient-to-br from-teal-400 to-teal-600",       fg: "text-white", ring: "ring-teal-500/30" },
  { bg: "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600", fg: "text-white", ring: "ring-fuchsia-500/30" },
];

// Hand-picked popular Kenyan banks to surface at the top of the list.
// Matching is case-insensitive substring against bank.name.
const POPULAR_KENYAN_BANKS = ["Equity", "KCB", "Co-op", "Cooperative", "NCBA", "I&M", "Absa", "Standard Chartered", "Stanbic", "Family"];

function bankInitials(name: string): string {
  const cleaned = name.replace(/bank/gi, "").replace(/[^a-zA-Z& ]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function bankTint(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return BANK_AVATAR_TINTS[Math.abs(hash) % BANK_AVATAR_TINTS.length];
}

const normalizeSearch = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

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
  const [bankSearch, setBankSearch] = useState("");
  const isDesktop = useDesktopDetection();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const isKenya = currency === "KES";
  const isBrazil = currency === "BRL";

  const isKenyaBank = currency === "KES" && paymentData.type === "BANK";
  const { data: kenyaBanks = [], isLoading: banksLoading, error: banksError } =
    useKenyaBankPaybills(isKenyaBank);

  const institutions = useMemo(() => {
    const base = INSTITUTIONS[currency] || [];
    if (currency !== "KES") return base;
    return [
      ...base,
      ...kenyaBanks.map((b) => ({ name: b.name, type: "bank" as const })),
    ];
  }, [currency, kenyaBanks]);

  const selectedInst = institutions.find((i) => i.name === selectedInstitution);
  const needsAccountName = selectedInst?.type === "bank" || (isKenya && paymentData.type === "BANK");

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
    if (isKenya && paymentData.type === "BANK" && !selectedInstitution) return;
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
      recipient.type = paymentData.type === "BANK" ? "BANK" : paymentData.type;
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
    if (isKenya && paymentData.type === "BANK" && !selectedInstitution) return false;
    if (!isKenya && !isBrazil && !selectedInstitution) return false;
    if (needsAccountName && !accountName.trim()) return false;
    return true;
  };

  const getInputLabels = () => {
    if (isKenya) {
      switch (paymentData.type) {
        case "MOBILE":
          return { primary: "Mobile Number", primaryPlaceholder: "0712 345 678", secondary: null, secondaryPlaceholder: null };
        case "BANK":
          return { primary: "Account Number", primaryPlaceholder: "1234567890", secondary: null, secondaryPlaceholder: null };
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
        case "BANK": return "Bank Transfer";
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
          <label className="block text-[13px] font-semibold text-text-default mb-2 tracking-[-0.005em]">
            {currency === "NGN" ? "Bank" : "Provider"} <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
            className="w-full h-12 px-4 bg-white border border-surface rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary text-[15px] text-text-default transition-all"
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

      {/* Kenya bank selector (for BANK type) */}
      {isKenya && paymentData.type === "BANK" && (
        <KenyaBankPicker
          banks={kenyaBanks}
          loading={banksLoading}
          error={!!banksError}
          selected={selectedInstitution}
          onSelect={(name) => setSelectedInstitution(name)}
          onClear={() => setSelectedInstitution("")}
          search={bankSearch}
          onSearchChange={setBankSearch}
        />
      )}

      {/* Kenya institution selector (Safaricom/Airtel for MOBILE) */}
      {isKenya && paymentData.type === "MOBILE" && (
        <div>
          <label className="block text-[13px] font-semibold text-text-default mb-2 tracking-[-0.005em]">
            Provider <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {institutions.map((inst) => {
              const active = selectedInstitution === inst.name;
              return (
                <button
                  key={inst.name}
                  type="button"
                  onClick={() => setSelectedInstitution(inst.name)}
                  className={`h-12 flex items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-accent-primary/10 border-accent-primary/60 text-accent-primary shadow-[0_0_0_3px_rgba(46,140,150,0.08)]"
                      : "bg-white border-surface text-text-default hover:border-accent-primary/30"
                  }`}
                >
                  {inst.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Input */}
      <div>
        <label className="block text-[13px] font-semibold text-text-default mb-2 tracking-[-0.005em]">
          {labels.primary} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={accountIdentifier}
          onChange={(e) => setAccountIdentifier(e.target.value)}
          placeholder={labels.primaryPlaceholder}
          className="w-full h-12 px-4 bg-white border border-surface rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary text-[15px] text-text-default placeholder:text-text-subtle/60 transition-all tabular-numeric"
          autoFocus={isKenya || isBrazil}
        />
        {isBrazil && (
          <p className="text-[12px] text-text-subtle/80 mt-1.5">Your PIX key can be email, CPF, phone number, or random key</p>
        )}
      </div>

      {/* Secondary Input (Account Number for Paybill) */}
      {labels.secondary && (
        <div>
          <label className="block text-[13px] font-semibold text-text-default mb-2 tracking-[-0.005em]">
            {labels.secondary} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={labels.secondaryPlaceholder || ""}
            className="w-full h-12 px-4 bg-white border border-surface rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary text-[15px] text-text-default placeholder:text-text-subtle/60 transition-all tabular-numeric"
          />
        </div>
      )}

      {/* Account Name (required for bank transfers, optional otherwise) */}
      {!isBrazil && (
        <div>
          <label className="block text-[13px] font-semibold text-text-default mb-2 tracking-[-0.005em]">
            Account Name{" "}
            {needsAccountName ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="text-text-subtle/70 font-normal">(optional)</span>
            )}
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g., John Doe"
            className="w-full h-12 px-4 bg-white border border-surface rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary text-[15px] text-text-default placeholder:text-text-subtle/60 transition-all"
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
      className={`h-full overflow-y-auto overscroll-contain ${isDesktop ? "p-6 md:p-8" : "p-4 pb-8"}`}
    >
      {isDesktop ? (
        <div className="w-full max-w-3xl mx-auto">
          {/* Desktop Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-text-subtle hover:bg-white hover:text-text-default transition-colors cursor-pointer"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="px-3 py-1.5 rounded-full bg-white border border-surface text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle">
              Step 4 of 5
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div>
              <h1
                className="text-[32px] font-semibold text-text-default leading-[1.1] mb-2 tracking-[-0.02em]"
                style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
              >
                {getPaymentTypeLabel()}
              </h1>
              <p className="text-[15px] text-text-subtle/90 mb-8 max-w-md">
                {isKenya && paymentData.type === "MOBILE" && "Enter the mobile number to send money to."}
                {isKenya && paymentData.type === "BANK" && "Pick a destination bank and enter the recipient account details."}
                {isKenya && paymentData.type === "PAYBILL" && "Enter the paybill and account details."}
                {isKenya && paymentData.type === "BUY_GOODS" && "Enter the till number to pay to."}
                {isBrazil && "Enter the PIX key to send money to."}
                {!isKenya && !isBrazil && currency === "NGN" && "Enter the bank details to send money to."}
                {!isKenya && !isBrazil && currency !== "NGN" && "Enter the details and select the provider."}
              </p>

              {formFields}

              <div className="mt-8">
                <button
                  onClick={handleNext}
                  disabled={!isValidInput()}
                  className="w-full sm:w-auto min-w-[220px] inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold bg-accent-primary text-white shadow-sm hover:bg-accent-primary/92 hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Review Payment
                </button>
              </div>
            </div>

            {/* Summary sidebar (desktop) */}
            <aside className="lg:sticky lg:top-0 space-y-4">
              <div className="bg-white rounded-2xl border border-surface/70 shadow-sm p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle/70 mb-2">
                  Amount to send
                </div>
                <div
                  className="text-[28px] font-semibold text-text-default leading-none tabular-numeric tracking-[-0.02em]"
                  style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
                >
                  {currencySymbol} {(paymentData.amount || 0).toLocaleString()}
                </div>
                <div className="text-[13px] text-text-subtle mt-1">
                  in {currency}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-surface bg-white/60 p-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    i
                  </div>
                  <div className="text-[12px] text-text-subtle leading-relaxed">
                    Double-check the recipient details — most payments are irreversible once sent.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <FiArrowLeft className="w-5 h-5 text-text-default" />
            </button>
            <h1
              className="text-[17px] font-semibold text-text-default tracking-[-0.015em]"
              style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
            >
              {getPaymentTypeLabel()}
            </h1>
            <div className="w-9 h-9" />
          </div>

          {/* Mobile Amount Summary — compact pill */}
          <div className="mb-5 flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-surface/70 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle/70">
                Amount
              </span>
              <span
                className="text-[20px] font-semibold text-text-default leading-tight tabular-numeric tracking-[-0.01em]"
                style={{ fontFamily: '"Clash Display", "Satoshi", sans-serif' }}
              >
                {currencySymbol} {(paymentData.amount || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[12px] font-semibold text-accent-primary bg-accent-primary/10 px-2.5 py-1 rounded-full">
              {currency}
            </span>
          </div>

          {/* Mobile Description */}
          <div className="mb-5">
            <h2 className="text-[15px] font-semibold text-text-default mb-1">Recipient details</h2>
            <p className="text-[13px] text-text-subtle/90 leading-relaxed">
              {isKenya && paymentData.type === "MOBILE" && "Enter the mobile number to send money to."}
              {isKenya && paymentData.type === "BANK" && "Select the destination bank and enter the account details."}
              {isKenya && paymentData.type === "PAYBILL" && "Enter the paybill and account details."}
              {isKenya && paymentData.type === "BUY_GOODS" && "Enter the till number to pay to."}
              {isBrazil && "Enter the PIX key to send money to."}
              {!isKenya && !isBrazil && currency === "NGN" && "Enter the bank details to send money to."}
              {!isKenya && !isBrazil && currency !== "NGN" && "Enter the details and select the provider."}
            </p>
          </div>

          <div className="w-full">
            {formFields}
          </div>

          {/* Mobile Button */}
          <div className="mt-auto pt-5">
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
    <div className="h-full flex flex-col min-h-0">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="lg" className="h-full" noScroll>
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* KenyaBankPicker — collapsed/expanded dropdown-style picker          */
/* When a bank is selected, the list disappears. Click "Change" to     */
/* re-open the picker.                                                 */
/* ─────────────────────────────────────────────────────────────────── */

interface KenyaBank {
  id: string;
  name: string;
}

interface KenyaBankPickerProps {
  banks: KenyaBank[];
  loading: boolean;
  error: boolean;
  selected: string;
  onSelect: (name: string) => void;
  onClear: () => void;
  search: string;
  onSearchChange: (q: string) => void;
}

function KenyaBankPicker({
  banks,
  loading,
  error,
  selected,
  onSelect,
  onClear,
  search,
  onSearchChange,
}: KenyaBankPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedBank = selected ? banks.find((b) => b.name === selected) : null;

  const q = normalizeSearch(search);
  const filtered = banks.filter((b) => normalizeSearch(b.name).includes(q));
  const popular = !search
    ? banks
        .filter((b) =>
          POPULAR_KENYAN_BANKS.some((p) =>
            b.name.toLowerCase().includes(p.toLowerCase())
          )
        )
        .slice(0, 6)
    : [];
  const rest = search ? filtered : banks.filter((b) => !popular.includes(b));

  const handleSelect = (name: string) => {
    onSelect(name);
    onSearchChange("");
    setOpen(false);
  };

  const handleChange = () => {
    onClear();
    onSearchChange("");
    setOpen(true);
  };

  const isExpanded = open || !selectedBank;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <label className="block text-[13px] font-semibold text-text-default tracking-[-0.005em]">
          Select bank <span className="text-red-500">*</span>
        </label>
        {isExpanded && !loading && !error && (
          <span className="text-[11px] text-text-subtle/80 tabular-nums">
            {search
              ? `${filtered.length} match${filtered.length === 1 ? "" : "es"}`
              : `${banks.length} banks`}
          </span>
        )}
      </div>

      {/* Selected state — collapsed */}
      {!isExpanded && selectedBank && (
        <motion.button
          type="button"
          onClick={handleChange}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-accent-primary/40 shadow-[0_0_0_3px_rgba(46,140,150,0.08)] text-left transition-all cursor-pointer hover:border-accent-primary"
        >
          <span
            className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-[12px] font-bold shadow-sm ${
              bankTint(selectedBank.id).bg
            } ${bankTint(selectedBank.id).fg}`}
          >
            {bankInitials(selectedBank.name)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-primary/80 leading-tight">
              Selected bank
            </div>
            <div className="text-[15px] font-semibold text-text-default truncate leading-snug">
              {selectedBank.name}
            </div>
          </div>
          <span className="flex-shrink-0 text-[12px] font-semibold text-accent-primary px-2.5 py-1.5 rounded-lg bg-accent-primary/10">
            Change
          </span>
        </motion.button>
      )}

      {/* Expanded state — full picker */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Search input */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-subtle/70 pointer-events-none" />
            <input
              type="text"
              inputMode="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search e.g. Equity, KCB, I&M..."
              className="w-full h-12 pl-12 pr-11 bg-white border border-surface rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary text-[14px] placeholder:text-text-subtle/60 transition-all"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface text-text-subtle transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-surface/80 bg-white"
                >
                  <div className="w-11 h-11 rounded-2xl bg-surface animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 rounded bg-surface animate-pulse" />
                    <div className="h-2.5 w-16 rounded bg-surface/70 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-5 rounded-2xl border border-red-200 bg-red-50/70 text-[14px] text-red-700 text-center">
              <p className="font-semibold mb-1">Couldn't load bank list</p>
              <p className="text-[12px] text-red-600/80">
                Please check your connection and retry.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-surface bg-white/60 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface flex items-center justify-center">
                <FiSearch className="w-5 h-5 text-text-subtle/60" />
              </div>
              <p className="text-[14px] text-text-default font-semibold">
                No banks found
              </p>
              <p className="text-[12px] text-text-subtle/80 mt-1">
                Try searching for "Equity", "KCB", or "Co-op"
              </p>
            </div>
          ) : (
            <div
              role="listbox"
              aria-label="Select your bank"
              className="max-h-[22rem] overflow-y-auto pr-1 -mr-1 space-y-3"
              style={{ scrollbarWidth: "thin" }}
            >
              {!search && popular.length > 0 && (
                <div>
                  <div className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle/70">
                    Popular
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {popular.map((bank, idx) => (
                      <BankTile
                        key={bank.id}
                        bank={bank}
                        index={idx}
                        onClick={() => handleSelect(bank.name)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {rest.length > 0 && (
                <div>
                  {!search && popular.length > 0 && (
                    <div className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle/70">
                      All banks
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rest.map((bank, idx) => (
                      <BankTile
                        key={bank.id}
                        bank={bank}
                        index={idx + popular.length}
                        onClick={() => handleSelect(bank.name)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function BankTile({
  bank,
  index,
  onClick,
}: {
  bank: KenyaBank;
  index: number;
  onClick: () => void;
}) {
  const tint = bankTint(bank.id);
  return (
    <motion.button
      type="button"
      role="option"
      aria-selected={false}
      onClick={onClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.12), duration: 0.18 }}
      whileTap={{ scale: 0.97 }}
      className="group relative cursor-pointer flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border bg-white border-surface/80 hover:border-accent-primary/40 hover:bg-accent-primary/[0.02] hover:shadow-sm transition-all"
    >
      <span
        className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-[12px] font-bold shadow-sm ${tint.bg} ${tint.fg}`}
      >
        {bankInitials(bank.name)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold text-text-default truncate leading-tight">
          {bank.name}
        </span>
        <span className="block text-[11px] text-text-subtle/80 mt-0.5">
          Direct deposit
        </span>
      </span>
    </motion.button>
  );
}
