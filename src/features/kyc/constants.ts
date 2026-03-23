import COUNTRY_PHONES from "@/lib/country-phones";
import { Country } from "./types";

// Countries that use SmileID for KYC — all others use Sumsub
export const SMILE_ID_COUNTRIES = new Set(["KE", "NG", "UG", "GH", "ZA", "ZM"]);

export const isSmileIDCountry = (code: string) => SMILE_ID_COUNTRIES.has(code);

// All countries — derived from the master country list
export const COUNTRIES: Country[] = COUNTRY_PHONES.map((c) => ({
  code: c.iso,
  name: c.countryname,
  flag: c.flag,
})).sort((a, b) => a.name.localeCompare(b.name));

// ID types supported by Smile ID per country
export const ID_TYPES_BY_COUNTRY: Record<string, string[]> = {
  NG: ["BVN", "NIN", "DRIVERS_LICENSE", "VOTER_ID", "PASSPORT"],
  KE: ["NATIONAL_ID", "PASSPORT", "ALIEN_CARD"],
  ZA: ["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE"],
  GH: ["SSNIT", "VOTER_ID", "PASSPORT", "DRIVERS_LICENSE"],
  // Add more as needed
};
