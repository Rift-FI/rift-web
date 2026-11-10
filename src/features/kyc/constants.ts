import COUNTRY_PHONES from "@/lib/country-phones";
import { Country } from "./types";

// Identity checks are only needed for onramp (Paycrest requires the customer's
// verified identity on every onramp order), so only SmileID Biometric KYC
// countries and ID types that Paycrest also accepts (national ID, passport,
// driver's licence, BVN / NIN) are offered. Source: SmileID
// GET https://api.smileidentity.com/v1/services → hosted_web.biometric_kyc
// (checked 2026-11-11). Zambia is supported by SmileID only with TPIN / bank
// account, which Paycrest does not accept, so it is not listed.
export const SMILE_ID_COUNTRIES = new Set(["KE", "NG", "ZA"]);

export const isSmileIDCountry = (code: string) => SMILE_ID_COUNTRIES.has(code);

// Countries offered for identity verification (SmileID-supported only).
export const COUNTRIES: Country[] = COUNTRY_PHONES.filter((c) => SMILE_ID_COUNTRIES.has(c.iso))
  .map((c) => ({
    code: c.iso,
    name: c.countryname,
    flag: c.flag,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// SmileID Biometric KYC ID types per country, limited to ones Paycrest accepts.
export const ID_TYPES_BY_COUNTRY: Record<string, string[]> = {
  KE: ["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE"],
  NG: ["BVN", "NIN_V2", "NIN", "NIN_SLIP", "V_NIN", "DRIVERS_LICENSE"],
  ZA: ["NATIONAL_ID"],
};
