import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FiChevronRight, FiSearch } from "react-icons/fi";
import { COUNTRIES } from "../constants";
import { Country } from "../types";
import ActionButton from "@/components/ui/action-button";
import useDesktopDetection from "@/hooks/use-desktop-detection";

interface Props {
  onSelect: (country: Country) => void;
  onBack?: () => void;
}

export default function NationalitySelector({ onSelect, onBack }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);
  const isDesktop = useDesktopDetection();

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleContinue = () => {
    if (selected) onSelect(selected);
  };

  // Desktop layout — centered card with proper width
  if (isDesktop) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col w-full h-full items-center justify-center p-8"
      >
        <div className="w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden" style={{ maxHeight: "min(680px, 80vh)" }}>
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
              >
                &larr; Back
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">Verify Your Identity</h1>
            <p className="text-gray-500 mt-1">
              Select your nationality to continue with identity verification
            </p>
          </div>

          {/* Search */}
          <div className="px-8 pb-4">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for your country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-base transition-all"
              />
            </div>
          </div>

          {/* Countries grid */}
          <div className="flex-1 overflow-y-auto px-8 pb-4 min-h-0">
            <div className="grid grid-cols-2 gap-2">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelected(country)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    selected?.code === country.code
                      ? "border-accent-primary bg-accent-primary/5 shadow-sm"
                      : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{country.name}</p>
                    <p className="text-xs text-gray-400">{country.code}</p>
                  </div>
                  {selected?.code === country.code && (
                    <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {filteredCountries.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg mb-1">No countries found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50">
            <div className="max-w-xs mx-auto">
              <ActionButton
                onClick={handleContinue}
                disabled={!selected}
                className="w-full p-[0.625rem] rounded-xl gap-1"
              >
                Continue <FiChevronRight className="text-lg" />
              </ActionButton>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Mobile layout
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
            &larr; Back
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
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
          {filteredCountries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No countries found</p>
            </div>
          )}
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
