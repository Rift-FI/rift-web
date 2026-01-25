import { useState } from "react";
import { motion } from "motion/react";
import { FiChevronRight, FiSearch } from "react-icons/fi";
import { COUNTRIES } from "../constants";
import { Country } from "../types";
import ActionButton from "@/components/ui/action-button";

interface Props {
  onSelect: (country: Country) => void;
  onBack?: () => void;
}

export default function NationalitySelector({ onSelect, onBack }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col w-full h-full min-h-0 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-text-default mb-4"
          >
            ← Back
          </button>
        )}
        <h1 className="text-2xl font-bold mb-2">Verify Your Identity</h1>
        <p className="text-muted-foreground text-sm">
          Select your nationality to continue with identity verification
        </p>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-muted bg-transparent focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* Countries List */}
      <div className="flex-1 overflow-y-auto px-5 min-h-0 pb-4">
        <div className="space-y-2 pb-20">
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              onClick={() => setSelected(country)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
                selected?.code === country.code
                  ? "border-accent-primary bg-accent-primary/10"
                  : "border-muted hover:border-accent-primary/50"
              }`}
            >
              <span className="text-3xl">{country.flag}</span>
              <div className="flex-1 text-left">
                <p className="font-medium">{country.name}</p>
                <p className="text-xs text-muted-foreground">{country.code}</p>
              </div>
              {selected?.code === country.code && (
                <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="flex-shrink-0 p-5 bg-app-background border-t border-muted safe-area-inset-bottom">
        <ActionButton
          onClick={handleContinue}
          disabled={!selected}
          className="w-full p-[0.625rem] rounded-[0.75rem] gap-1"
        >
          Continue <FiChevronRight className="text-lg" />
        </ActionButton>
      </div>
    </motion.div>
  );
}
