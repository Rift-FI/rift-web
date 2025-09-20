interface Country {
  countryname: string;
  flag: string;
  code: string;
}

const COUNTRY_PHONES: Array<Country> = [
  { countryname: "Kenya", flag: "🇰🇪", code: "+254" },
  { countryname: "Tanzania", flag: "🇹🇿", code: "+255" },
  { countryname: "Nigeria", flag: "🇳🇬", code: "+234" },
  { countryname: "Uganda", flag: "🇺🇬", code: "+256" },
  { countryname: "Rwanda", flag: "🇷🇼", code: "+250" },
  { countryname: "South Africa", flag: "🇿🇦", code: "+27" },
];

export default COUNTRY_PHONES;
