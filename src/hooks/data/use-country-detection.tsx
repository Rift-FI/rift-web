import { useQuery } from "@tanstack/react-query";

export type SupportedCountry = "KE" | "NG" | "UG" | "TZ" | "CD" | "MW" | "BR";
export type SupportedCurrency = "KES" | "NGN" | "UGX" | "TZS" | "CDF" | "MWK" | "BRL" | "USD";

export interface CountryInfo {
  country: SupportedCountry | null;
  currency: SupportedCurrency;
  countryName: string;
}

// Map country codes to their currencies
const COUNTRY_TO_CURRENCY: Record<SupportedCountry, SupportedCurrency> = {
  KE: "KES", // Kenya
  NG: "NGN", // Nigeria
  UG: "UGX", // Uganda
  TZ: "TZS", // Tanzania
  CD: "CDF", // DR Congo
  MW: "MWK", // Malawi
  BR: "BRL", // Brazil
};

const COUNTRY_NAMES: Record<SupportedCountry, string> = {
  KE: "Kenya",
  NG: "Nigeria",
  UG: "Uganda",
  TZ: "Tanzania",
  CD: "DR Congo",
  MW: "Malawi",
  BR: "Brazil",
};

/**
 * Detect user's country based on IP address
 * Uses ipapi.co free API (1000 requests/day, no auth required)
 */
async function detectCountry(): Promise<CountryInfo> {
  try {
    // Check if country is cached in localStorage
    const cachedCountry = localStorage.getItem("detected_country");
    const cachedTimestamp = localStorage.getItem("detected_country_timestamp");
    
    // Cache for 24 hours
    if (cachedCountry && cachedTimestamp) {
      const timeDiff = Date.now() - parseInt(cachedTimestamp);
      const ONE_DAY = 24 * 60 * 60 * 1000;
      
      if (timeDiff < ONE_DAY) {
        const countryCode = cachedCountry as SupportedCountry;
        if (countryCode in COUNTRY_TO_CURRENCY) {
          return {
            country: countryCode,
            currency: COUNTRY_TO_CURRENCY[countryCode],
            countryName: COUNTRY_NAMES[countryCode],
          };
        }
      }
    }

    // Fetch country from IP
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      throw new Error("Failed to detect country");
    }

    const data = await response.json();
    const countryCode = data.country_code as string;

    // Check if country is supported
    if (countryCode && countryCode in COUNTRY_TO_CURRENCY) {
      const supportedCountry = countryCode as SupportedCountry;
      
      // Cache the result
      localStorage.setItem("detected_country", countryCode);
      localStorage.setItem("detected_country_timestamp", Date.now().toString());

      return {
        country: supportedCountry,
        currency: COUNTRY_TO_CURRENCY[supportedCountry],
        countryName: COUNTRY_NAMES[supportedCountry],
      };
    }

    // Country not supported, default to USD
    return {
      country: null,
      currency: "USD",
      countryName: "International",
    };
  } catch (error) {
    
    
    // Fallback to USD on error
    return {
      country: null,
      currency: "USD",
      countryName: "International",
    };
  }
}

/**
 * Hook to detect user's country and currency based on IP
 */
export default function useCountryDetection() {
  return useQuery({
    queryKey: ["country-detection"],
    queryFn: detectCountry,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (formerly cacheTime)
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if we have cached data
  });
}

