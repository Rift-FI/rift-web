import { useState, useMemo } from "react";
import { SavedBeneficiaries } from "@/v2/pages/send/saved";
import type { Beneficiary, BeneficiaryType } from "@/v2/lib/beneficiaries";
import { Monogram, Picker } from "@/v2/ui/picker";


import { usePay } from "../context";
import { Button } from "@/v2/ui";
import { SectionActions } from "@/v2/ui/flow";
import { useCountries } from "@/v2/lib/countries";
import { BeneficiaryStatus, useBeneficiary } from "@/v2/pages/send/beneficiary";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useDesktopDetection from "@/hooks/use-desktop-detection";
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
  const { paymentData, updatePaymentData, setCurrentStep, method } = usePay();
  // Pre-fill when the user comes back to edit a completed section.
  const prev = paymentData.recipient;
  const [accountIdentifier, setAccountIdentifier] = useState(prev?.accountIdentifier ?? "");
  const [accountNumber, setAccountNumber] = useState(prev?.accountNumber ?? ""); // Only for PAYBILL
  const [accountName, setAccountName] = useState(prev?.accountName ?? "");
  const [selectedInstitution, setSelectedInstitution] = useState<string>(prev?.institution && prev.institution !== "Pix" ? prev.institution : "");
  const [bankSearch, setBankSearch] = useState("");
  const [picked, setPicked] = useState<Beneficiary | null>(null);
  const isDesktop = useDesktopDetection();

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const isKenya = currency === "KES";
  const isBrazil = currency === "BRL";

  const isKenyaBank = currency === "KES" && paymentData.type === "BANK";
  const { data: kenyaBanks = [], isLoading: banksLoading, error: banksError } =
    useKenyaBankPaybills(isKenyaBank);

  const { countries } = useCountries();
  const countryRow = countries.find((c) => c.currency === currency);
  const institutions = useMemo(() => {
    const staticList = INSTITUTIONS[currency] || [];
    // Mobile networks come from the live countries list when we have it.
    const networks = countryRow?.rails.mobile.length
      ? countryRow.rails.mobile.map((name) => ({ name, type: "mobile" as const }))
      : staticList.filter((i) => i.type === "mobile");
    const others = staticList.filter((i) => i.type !== "mobile");
    const forMethod = method === "bank" ? others : method === "mobile" ? networks : [...networks, ...others];
    if (currency !== "KES") return forMethod;
    return [...networks, ...kenyaBanks.map((b) => ({ name: b.name, type: "bank" as const }))];
  }, [currency, kenyaBanks, countryRow, method]);

  const selectedInst = institutions.find((i) => i.name === selectedInstitution);

  const handleBack = () => setCurrentStep("country");

  // "Recent & saved" for this rail.
  const savedTypes: BeneficiaryType[] =
    method === "till" || paymentData.type === "BUY_GOODS"
      ? ["till"]
      : method === "paybill" || paymentData.type === "PAYBILL"
        ? ["paybill"]
        : method === "bank" || paymentData.type === "BANK"
          ? ["bank"]
          : method === "mobile"
            ? ["mobile"]
            : ["mobile", "bank"];
  const pickSaved = (b: Beneficiary) => {
    setPicked(b);
    setAccountIdentifier(b.identifier);
    setAccountNumber(b.accountNumber ?? "");
    setAccountName(b.accountName ?? "");
    const inst = b.type === "bank" ? b.bankName : b.network;
    if (inst) setSelectedInstitution(inst);
  };

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


  // Ask the backend who owns this account before any money moves.
  const railType: "mobile" | "till" | "paybill" | "bank" =
    isKenya && paymentData.type === "BUY_GOODS"
      ? "till"
      : isKenya && paymentData.type === "PAYBILL"
        ? "paybill"
        : (isKenya && paymentData.type === "BANK") || selectedInst?.type === "bank"
          ? "bank"
          : "mobile";
  const kenyaBank = kenyaBanks.find((b) => b.name === selectedInstitution);
  const validationInput =
    accountIdentifier.trim() && (railType !== "paybill" || accountNumber.trim()) && (railType !== "bank" || selectedInstitution) && (railType !== "mobile" || isBrazil || selectedInstitution || isKenya)
      ? {
          currency,
          type: railType,
          ...(railType === "mobile" ? { phone: isKenya ? formatPhoneNumber(accountIdentifier.trim()) : accountIdentifier.trim(), network: selectedInstitution || (isKenya ? "Safaricom" : undefined) } : {}),
          ...(railType === "till" ? { till: accountIdentifier.trim() } : {}),
          ...(railType === "paybill" ? { paybill: accountIdentifier.trim(), accountNumber: accountNumber.trim() } : {}),
          ...(railType === "bank" ? { accountNumber: accountIdentifier.trim(), bankCode: kenyaBank?.paybill ?? kenyaBank?.id ?? selectedInstitution } : {}),
        }
      : null;
  const validation = useBeneficiary(isBrazil ? null : validationInput);
  const validatedName = validation.state === "valid" ? validation.name : undefined;
  const needsAccountName = (selectedInst?.type === "bank" || (isKenya && paymentData.type === "BANK")) && !validatedName;

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

    if (validation.state === "checking") return;
    if (validatedName) {
      recipient.accountName = validatedName;
      recipient.validatedName = validatedName;
    } else if (accountName.trim()) {
      recipient.accountName = accountName.trim();
    }

    // Only tag the saved beneficiary if the details weren't edited after picking it.
    const pickedId = prev?.beneficiaryId && !picked ? prev.beneficiaryId : picked?.id;
    const pickedRow = picked ?? null;
    if (pickedId && (!pickedRow || pickedRow.identifier.replace(/\s/g, "") === accountIdentifier.trim().replace(/\s/g, ""))) recipient.beneficiaryId = pickedId;

    updatePaymentData({ recipient });
    setCurrentStep("amount");
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
          <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
            {currency === "NGN" ? "Bank" : "Provider"} <span className="text-danger">*</span>
          </label>
          <Picker
            value={selectedInstitution}
            onChange={setSelectedInstitution}
            label={currency === "NGN" ? "Bank" : "Provider"}
            placeholder={`Select ${currency === "NGN" ? "bank" : "provider"}`}
            testId="institution-picker"
            options={institutions.map((inst) => ({
              value: inst.name,
              label: inst.name,
              description: inst.type === "bank" ? "Bank" : inst.type === "mobile" ? "Mobile money" : undefined,
              icon: <Monogram text={inst.name} />,
            }))}
          />
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
          <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
            Provider <span className="text-danger">*</span>
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
                      ? "bg-accent-primary/10 border-accent-primary/60 text-accent-primary ring-1 ring-accent-primary/30"
                      : "bg-card border-surface text-text-default hover:border-accent-primary/30"
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
        <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
          {labels.primary} <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={accountIdentifier}
          onChange={(e) => setAccountIdentifier(e.target.value)}
          placeholder={labels.primaryPlaceholder}
          className="w-full h-11 px-3 bg-card border border-hairline-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary text-[15px] text-text-default placeholder:text-ink-3 transition-all tabular-numeric"
          autoFocus={isKenya || isBrazil}
        />
        {isBrazil && (
          <p className="text-[12px] text-ink-3 mt-1.5">Your PIX key can be email, CPF, phone number, or random key</p>
        )}
      </div>

      {/* Secondary Input (Account Number for Paybill) */}
      {labels.secondary && (
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
            {labels.secondary} <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={labels.secondaryPlaceholder || ""}
            className="w-full h-11 px-3 bg-card border border-hairline-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary text-[15px] text-text-default placeholder:text-ink-3 transition-all tabular-numeric"
          />
        </div>
      )}

      {/* Account name only when the beneficiary lookup can't supply it (banks). */}
      {!isBrazil && needsAccountName && (
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
            Account Name{" "}
            {needsAccountName ? (
              <span className="text-danger">*</span>
            ) : (
              <span className="text-ink-3 font-normal">(optional)</span>
            )}
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g., John Doe"
            className="w-full h-11 px-3 bg-card border border-hairline-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary text-[15px] text-text-default placeholder:text-ink-3 transition-all"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <SavedBeneficiaries types={savedTypes} currency={currency} selectedId={picked?.id ?? prev?.beneficiaryId} onPick={pickSaved} />
      {formFields}
      <BeneficiaryStatus validation={validation} />
      <SectionActions onBack={handleBack}>
        <Button size="lg" onClick={handleNext} disabled={!isValidInput() || validation.state === "checking"}>
          Continue
        </Button>
      </SectionActions>
    </div>
  );
}

/* KenyaBankPicker: the shared picker with popular banks first. */

interface KenyaBank {
  id: string;
  name: string;
  paybill?: string;
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

function KenyaBankPicker({ banks, loading, error, selected, onSelect }: KenyaBankPickerProps) {
  const popular = banks.filter((b) => POPULAR_KENYAN_BANKS.some((p) => b.name.toLowerCase().includes(p.toLowerCase())));
  const ordered = [...popular, ...banks.filter((b) => !popular.includes(b))];
  return (
    <div>
      <label htmlFor="kenya-bank" className="mb-1.5 block text-[13px] font-medium text-ink-2">
        Bank
      </label>
      {error ? (
        <p className="rounded-md bg-tint-danger px-3 py-2.5 text-[13px] text-danger">Couldn't load banks. Check your connection and try again.</p>
      ) : (
        <Picker
          id="kenya-bank"
          value={selected}
          onChange={onSelect}
          label="Bank"
          placeholder={loading ? "Loading banks…" : "Choose a bank"}
          disabled={loading}
          searchable
          searchPlaceholder="Search e.g. Equity, KCB, I&M"
          testId="bank-picker"
          options={ordered.map((b) => ({ value: b.name, label: b.name, description: b.paybill ? `Paybill ${b.paybill}` : undefined, keywords: normalizeSearch(b.name), icon: <Monogram text={bankInitials(b.name)} className="h-9 w-9 rounded-xl" /> }))}
        />
      )}
    </div>
  );
}
