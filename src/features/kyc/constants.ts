import { Country } from "./types";

// Common countries for KYC - can be expanded based on your target markets
export const COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
].sort((a, b) => a.name.localeCompare(b.name));

// ID types supported by Smile ID per country
export const ID_TYPES_BY_COUNTRY: Record<string, string[]> = {
  NG: ["BVN", "NIN", "DRIVERS_LICENSE", "VOTER_ID", "PASSPORT"],
  KE: ["NATIONAL_ID", "PASSPORT", "ALIEN_CARD"],
  ZA: ["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE"],
  GH: ["SSNIT", "VOTER_ID", "PASSPORT", "DRIVERS_LICENSE"],
  // Add more as needed
};
