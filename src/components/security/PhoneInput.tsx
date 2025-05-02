import {
  CSSProperties,
  Dispatch,
  JSX,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { PopOver } from "../global/PopOver";
import "../../styles/components/security/phoneinput.scss";

type countrycode = { countryname: string; flag: string; code: string };

interface props {
  setPhoneVal: Dispatch<SetStateAction<string>>;
  sxstyles?: CSSProperties;
}

export const PhoneInput = ({ setPhoneVal, sxstyles }: props): JSX.Element => {
  const [selectCallCode, setSelectCallCode] = useState<countrycode>(
    countryCodes[0]
  );
  const [countryCodesAnchorEl, setCountryCodesAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [localPhoneval, setlocaPhonelVal] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [filteredCountries, setFilteredCountries] =
    useState<countrycode[]>(countryCodes);

  useEffect(() => {
    // Format phone number with country code for Twilio
    // This ensures the phone number is in E.164 format (+[country code][number])
    const value = `${selectCallCode?.code}${localPhoneval}`;
    setPhoneVal(value);
  }, [localPhoneval, selectCallCode, setPhoneVal]);

  // Filter countries based on search term
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredCountries(countryCodes);
      return;
    }

    const filtered = countryCodes.filter(
      (country) =>
        country.countryname.toLowerCase().includes(searchValue.toLowerCase()) ||
        country.code.includes(searchValue)
    );

    setFilteredCountries(filtered);
  }, [searchValue]);

  // Handle phone number input and ensure only digits are entered
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits
    const digitsOnly = input.replace(/\D/g, "");
    setlocaPhonelVal(digitsOnly);
  };

  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <div className="phoneinput" style={sxstyles}>
      <div
        className="countryselect"
        onClick={(e) => setCountryCodesAnchorEl(e.currentTarget)}
      >
        <span className="country-flag">{selectCallCode?.flag}</span>
        <span className="country-code">{selectCallCode?.code}</span>
        <span className="dropdown-arrow">▼</span>
      </div>
      <PopOver
        anchorEl={countryCodesAnchorEl}
        setAnchorEl={setCountryCodesAnchorEl}
      >
        <div className="countrycodes">
          <p className="desc">Choose a Country</p>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search country or code..."
              value={searchValue}
              onChange={handleSearchInput}
              className="search-input"
            />
          </div>

          <div className="countries-list">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country_code, index) => (
                <button
                  key={country_code?.code + index}
                  onClick={() => {
                    setSelectCallCode(country_code);
                    setCountryCodesAnchorEl(null);
                    setSearchValue("");
                  }}
                  className="country-option"
                >
                  <span className="country-info">
                    <span className="country-flag">{country_code?.flag}</span>
                    <span className="country-name">
                      {country_code?.countryname}
                    </span>
                  </span>

                  <span className="country-code">{country_code?.code}</span>
                </button>
              ))
            ) : (
              <div className="no-results">No matches found</div>
            )}
          </div>
        </div>
      </PopOver>

      <input
        type="text"
        inputMode="tel"
        placeholder="Enter phone number"
        max={10}
        maxLength={15}
        value={localPhoneval}
        onChange={handlePhoneInput}
        aria-label="Phone number"
        className="phone-input"
      />
    </div>
  );
};

// Expanded list of country codes - adding more countries including Uganda
const countryCodes: countrycode[] = [
  { countryname: "United States", flag: "🇺🇸", code: "+1" },
  { countryname: "Kenya", flag: "🇰🇪", code: "+254" },
  { countryname: "Uganda", flag: "🇺🇬", code: "+256" },
  { countryname: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { countryname: "India", flag: "🇮🇳", code: "+91" },
  { countryname: "Nigeria", flag: "🇳🇬", code: "+234" },
  { countryname: "South Africa", flag: "🇿🇦", code: "+27" },
  { countryname: "Rwanda", flag: "🇷🇼", code: "+250" },
  { countryname: "Tanzania", flag: "🇹🇿", code: "+255" },
  { countryname: "Ethiopia", flag: "🇪🇹", code: "+251" },
  { countryname: "Sudan", flag: "🇸🇩", code: "+249" },
  { countryname: "Somalia", flag: "🇸🇴", code: "+252" },
  { countryname: "Democratic Republic of the Congo", flag: "🇨🇩", code: "+243" },
  { countryname: "Zambia", flag: "🇿🇲", code: "+260" },
  { countryname: "Zimbabwe", flag: "🇿🇼", code: "+263" },
  { countryname: "Mozambique", flag: "🇲🇿", code: "+258" },
  { countryname: "China", flag: "🇨🇳", code: "+86" },
  { countryname: "Japan", flag: "🇯🇵", code: "+81" },
  { countryname: "Hong Kong", flag: "🇭🇰", code: "+852" },
  { countryname: "Germany", flag: "🇩🇪", code: "+49" },
  { countryname: "France", flag: "🇫🇷", code: "+33" },
  { countryname: "Canada", flag: "🇨🇦", code: "+1" },
  { countryname: "Australia", flag: "🇦🇺", code: "+61" },
  { countryname: "Brazil", flag: "🇧🇷", code: "+55" },
  { countryname: "Mexico", flag: "🇲🇽", code: "+52" },
  { countryname: "Spain", flag: "🇪🇸", code: "+34" },
  { countryname: "Italy", flag: "🇮🇹", code: "+39" },
  { countryname: "Russia", flag: "🇷🇺", code: "+7" },
  { countryname: "Indonesia", flag: "🇮🇩", code: "+62" },
  { countryname: "Pakistan", flag: "🇵🇰", code: "+92" },
  { countryname: "Bangladesh", flag: "🇧🇩", code: "+880" },
  { countryname: "Philippines", flag: "🇵🇭", code: "+63" },
  { countryname: "Vietnam", flag: "🇻🇳", code: "+84" },
  { countryname: "Thailand", flag: "🇹🇭", code: "+66" },
  { countryname: "Egypt", flag: "🇪🇬", code: "+20" },
  { countryname: "Ghana", flag: "🇬🇭", code: "+233" },
  { countryname: "Morocco", flag: "🇲🇦", code: "+212" },
  { countryname: "Cameroon", flag: "🇨🇲", code: "+237" },
  { countryname: "Ivory Coast", flag: "🇨🇮", code: "+225" },
  { countryname: "Senegal", flag: "🇸🇳", code: "+221" },
  { countryname: "Tunisia", flag: "🇹🇳", code: "+216" },
  { countryname: "Algeria", flag: "🇩🇿", code: "+213" },
  { countryname: "Libya", flag: "🇱🇾", code: "+218" },
  { countryname: "Gambia", flag: "🇬🇲", code: "+220" },
  { countryname: "Liberia", flag: "🇱🇷", code: "+231" },
  { countryname: "Sierra Leone", flag: "🇸🇱", code: "+232" },
  { countryname: "Burkina Faso", flag: "🇧🇫", code: "+226" },
  { countryname: "Guinea", flag: "🇬🇳", code: "+224" },
  { countryname: "Benin", flag: "🇧🇯", code: "+229" },
  { countryname: "Malawi", flag: "🇲🇼", code: "+265" },
  { countryname: "Lesotho", flag: "🇱🇸", code: "+266" },
  { countryname: "Botswana", flag: "🇧🇼", code: "+267" },
  { countryname: "Namibia", flag: "🇳🇦", code: "+264" },
  { countryname: "Turkey", flag: "🇹🇷", code: "+90" },
  { countryname: "Iran", flag: "🇮🇷", code: "+98" },
  { countryname: "United Arab Emirates", flag: "🇦🇪", code: "+971" },
  { countryname: "Saudi Arabia", flag: "🇸🇦", code: "+966" },
  { countryname: "Singapore", flag: "🇸🇬", code: "+65" },
  { countryname: "Malaysia", flag: "🇲🇾", code: "+60" },
  { countryname: "New Zealand", flag: "🇳🇿", code: "+64" },
  { countryname: "Argentina", flag: "🇦🇷", code: "+54" },
  { countryname: "Colombia", flag: "🇨🇴", code: "+57" },
  { countryname: "Peru", flag: "🇵🇪", code: "+51" },
  { countryname: "Chile", flag: "🇨🇱", code: "+56" },
  { countryname: "Sweden", flag: "🇸🇪", code: "+46" },
  { countryname: "Norway", flag: "🇳🇴", code: "+47" },
  { countryname: "Denmark", flag: "🇩🇰", code: "+45" },
  { countryname: "Finland", flag: "🇫🇮", code: "+358" },
  { countryname: "Poland", flag: "🇵🇱", code: "+48" },
  { countryname: "Netherlands", flag: "🇳🇱", code: "+31" },
  { countryname: "Belgium", flag: "🇧🇪", code: "+32" },
  { countryname: "Switzerland", flag: "🇨🇭", code: "+41" },
  { countryname: "Austria", flag: "🇦🇹", code: "+43" },
  { countryname: "Portugal", flag: "🇵🇹", code: "+351" },
  { countryname: "Greece", flag: "🇬🇷", code: "+30" },
  { countryname: "Ireland", flag: "🇮🇪", code: "+353" },
  { countryname: "Czech Republic", flag: "🇨🇿", code: "+420" },
  { countryname: "Slovakia", flag: "🇸🇰", code: "+421" },
  { countryname: "Hungary", flag: "🇭🇺", code: "+36" },
  { countryname: "Ukraine", flag: "🇺🇦", code: "+380" },
  { countryname: "Romania", flag: "🇷🇴", code: "+40" },
  { countryname: "Bulgaria", flag: "🇧🇬", code: "+359" },
  { countryname: "Croatia", flag: "🇭🇷", code: "+385" },
  { countryname: "Serbia", flag: "🇷🇸", code: "+381" },
  { countryname: "Jamaica", flag: "🇯🇲", code: "+1876" },
  { countryname: "Cuba", flag: "🇨🇺", code: "+53" },
  { countryname: "Dominican Republic", flag: "🇩🇴", code: "+1809" },
  { countryname: "Kosovo", flag: "🇽🇰", code: "+383" },
];
