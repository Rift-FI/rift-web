import { Dispatch, JSX, SetStateAction, useEffect, useState } from "react";
import { PopOver } from "../global/PopOver";
import "../../styles/components/security/phoneinput.scss";

type countrycode = { countryname: string; flag: string; code: string };

interface props {
  setPhoneVal: Dispatch<SetStateAction<string>>;
}

export const PhoneInput = ({ setPhoneVal }: props): JSX.Element => {
  const [selectCallCode, setSelectCallCode] = useState<countrycode>(
    countryCodes[0]
  );
  const [countryCodesAnchorEl, setCountryCodesAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [localPhoneval, setlocaPhonelVal] = useState<string>("");

  useEffect(() => {
    const value = `${selectCallCode?.code}${localPhoneval}`;
    setPhoneVal(value);
  }, [localPhoneval]);

  return (
    <div className="phoneinput">
      <div
        className="countryselect"
        onClick={(e) => setCountryCodesAnchorEl(e.currentTarget)}
      >
        {selectCallCode?.flag} {selectCallCode?.code}
      </div>
      <PopOver
        anchorEl={countryCodesAnchorEl}
        setAnchorEl={setCountryCodesAnchorEl}
      >
        <div className="countrycodes">
          <p className="desc">Choose a Country</p>

          {countryCodes?.map((country_code) => (
            <button
              onClick={() => {
                setSelectCallCode(country_code);
                setCountryCodesAnchorEl(null);
              }}
            >
              <span>
                {country_code?.flag} {country_code?.countryname}
              </span>

              <span>{country_code?.code}</span>
            </button>
          ))}
        </div>
      </PopOver>

      <input
        type="text"
        inputMode="tel"
        placeholder="87654321"
        max={10}
        maxLength={10}
        value={localPhoneval}
        onChange={(e) => setlocaPhonelVal(e.target.value)}
      />
    </div>
  );
};

const countryCodes: countrycode[] = [
  { countryname: "Hong Kong", flag: "🇭🇰", code: "+852" },
  { countryname: "China", flag: "🇨🇳", code: "+86" },
  { countryname: "United States", flag: "🇺🇸", code: "+1" },
  { countryname: "United Kingdom", flag: "🇬🇧", code: "+44" },
];
