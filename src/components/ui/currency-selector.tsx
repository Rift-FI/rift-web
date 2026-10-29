import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  available: boolean;
}

const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    flag: "🇰🇪",
    available: true,
  },
  {
    code: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
    flag: "🇳🇬",
    available: true,
  },
  {
    code: "UGX",
    name: "Ugandan Shilling",
    symbol: "USh",
    flag: "🇺🇬",
    available: true,
  },
  {
    code: "TZS",
    name: "Tanzanian Shilling",
    symbol: "TSh",
    flag: "🇹🇿",
    available: true,
  },
  {
    code: "CDF",
    name: "Congolese Franc",
    symbol: "FC",
    flag: "🇨🇩",
    available: true,
  },
  {
    code: "MWK",
    name: "Malawian Kwacha",
    symbol: "MK",
    flag: "🇲🇼",
    available: true,
  },
  {
    code: "BRL",
    name: "Brazilian Real",
    symbol: "R$",
    flag: "🇧🇷",
    available: true,
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    flag: "🌍",
    available: true,
  },
];

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: Currency) => void;
  className?: string;
}

export default function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  className = "",
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentCurrency = SUPPORTED_CURRENCIES.find(
    (c) => c.code === selectedCurrency
  ) || SUPPORTED_CURRENCIES[0];

  const handleCurrencySelect = (currency: Currency) => {
    if (currency.available) {
      onCurrencyChange(currency);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Display currency: ${currentCurrency.code}`}
        className={`flex items-center gap-2 h-9 px-3 bg-white rounded-md border border-border hover:border-text-default/25 transition-colors duration-150 cursor-pointer ${className}`}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted hidden sm:inline">Currency</span>
        <span className="font-semibold text-[13px] tabular-nums">{currentCurrency.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div role="listbox" className="absolute top-full right-0 mt-1.5 w-64 max-h-[60vh] overflow-y-auto bg-white border border-border rounded-md shadow-lg z-50 py-1">
          {SUPPORTED_CURRENCIES.filter(currency => currency.available).map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencySelect(currency)}
              role="option"
              aria-selected={currency.code === selectedCurrency}
              className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-surface-subtle cursor-pointer ${
                currency.code === selectedCurrency ? "bg-accent-primary/8" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex w-11 justify-center rounded-sm border px-1 py-0.5 text-[11px] font-semibold tracking-[0.04em] ${currency.code === selectedCurrency ? "border-accent-primary/30 text-accent-primary" : "border-border text-text-default"}`}>{currency.code}</span>
                <span className="text-[13px] text-text-muted">{currency.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { SUPPORTED_CURRENCIES };