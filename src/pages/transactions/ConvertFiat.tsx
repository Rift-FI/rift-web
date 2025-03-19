import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { TextField } from "@mui/material";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { formatNumber, formatUsd } from "../../utils/formatters";
import { BottomButtonContainer } from "../../components/Bottom";
import { SubmitButton } from "../../components/global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import airwallexlogo from "../../assets/images/awx.png";
import "../../styles/pages/transactions/convertfiat.scss";

export default function ConvertFiat(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showsuccesssnack } = useSnackbar();

  const [selectCurrency, setSelectCurrency] = useState<"USD" | "HKD">("USD");
  const [getQty, setGetQty] = useState<string>("");

  const usedusd = localStorage.getItem("usedusd");
  const usedhkd = localStorage.getItem("usedhkd");

  const usdBalance = 2500 - Number(usedusd || 0);
  const hkdBalance = 4800 - Number(usedhkd || 0);

  const selectedcurrencyBalance =
    selectCurrency == "USD" ? usdBalance : hkdBalance;
  const selectedcurrencyUsdValue = selectCurrency == "USD" ? 1 : 7.79;

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onSelectCurrency = (currency: "USD" | "HKD") => {
    setSelectCurrency(currency);
  };

  const onConvertFiat = () => {
    if (selectCurrency == "USD") {
      localStorage.setItem("usedusd", getQty);
    } else {
      localStorage.setItem("usedhkd", getQty);
    }

    const convertusdc = localStorage.getItem("convertusdc");
    const prevconvertusdc = convertusdc == null ? 0 : Number(convertusdc);

    const usdcreceive = formatNumber(Number(getQty) / selectedcurrencyUsdValue);
    localStorage.setItem("convertusdc", String(usdcreceive + prevconvertusdc));

    setGetQty("");
    showsuccesssnack(`Successfully received ${usdcreceive} USDC`);
  };

  useBackButton(goBack);

  return (
    <div id="convertfiat">
      <p className="pagetitle">
        Fiat To Crypto
        <span>Convert your Airwallex balances to USDC</span>
      </p>

      <div className="source_key">
        <img src={airwallexlogo} alt="AirWallex" />
        <p>
          AirWallex Key
          <span>35bo..</span>
        </p>
      </div>

      <div className="select_currency_ctr">
        <div className="select_currency">
          <div
            className="currency_img_desc"
            onClick={() => onSelectCurrency("USD")}
          >
            <div className="flag_balance">
              <span className="flag">🇺🇸</span>

              <p className="desc">
                USD <br />
                <span>{formatNumber(usdBalance)}</span>
              </p>
            </div>

            <div className="radioctr">
              <div
                style={{
                  backgroundColor:
                    selectCurrency == "USD"
                      ? colors.textprimary
                      : colors.primary,
                }}
              ></div>
            </div>
          </div>

          <div
            className="currency_img_desc l_currency"
            onClick={() => onSelectCurrency("HKD")}
          >
            <div className="flag_balance">
              <span className="flag">🇭🇰</span>

              <p className="desc">
                HKD <br />
                <span>{formatNumber(hkdBalance)}</span>
              </p>
            </div>

            <div className="radioctr">
              <div
                style={{
                  backgroundColor:
                    selectCurrency == "HKD"
                      ? colors.textprimary
                      : colors.primary,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="balancectr">
        <div className="currency">
          {selectCurrency == "USD" ? (
            <span className="flag">🇺🇸</span>
          ) : (
            <span className="flag">🇭🇰</span>
          )}

          <p>{selectCurrency}</p>
        </div>

        <div className="inpuctr">
          <TextField
            variant="standard"
            fullWidth
            value={getQty}
            onChange={(ev) => setGetQty(ev.target.value)}
            placeholder={`Amount (${selectCurrency})`}
            type="number"
            slotProps={{
              input: {
                disableUnderline: true,
                style: {
                  height: "3.75rem",
                },
              },
            }}
            sx={{
              "& .MuiInputBase-input": {
                color:
                  Number(getQty) >= selectedcurrencyBalance
                    ? colors.danger
                    : colors.textprimary,
              },
              "& .MuiInputBase-input::placeholder": {
                color: colors.textsecondary,
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: 0,
                border: "none",
                boxShadow: "none",
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "none",
                },
                "&::placeholder": {
                  color: colors.textsecondary,
                },
              },
            }}
          />
        </div>
      </div>

      <p className="fiatbal">
        {selectCurrency == "USD"
          ? formatNumber(usdBalance) + " USD"
          : formatNumber(hkdBalance) + " HKD"}
        &nbsp;~&nbsp;
        {selectCurrency == "USD"
          ? formatUsd(usdBalance)
          : formatUsd(hkdBalance / 7.79)}
      </p>

      <p
        className="omamount"
        style={{
          color: Number(getQty) >= selectedcurrencyBalance ? colors.danger : "",
        }}
      >
        You Get
        <br />
        <span
          style={{
            color:
              Number(getQty) >= selectedcurrencyBalance ? colors.danger : "",
          }}
        >
          {Number(getQty) == 0
            ? "0"
            : formatNumber(Number(getQty) / selectedcurrencyUsdValue)}
          &nbsp; <em>USDC</em>
        </span>
      </p>

      <BottomButtonContainer>
        <SubmitButton
          text="Get USDC"
          icon={
            <FaIcon
              faIcon={faArrowsRotate}
              color={getQty == "" ? colors.textsecondary : colors.textprimary}
            />
          }
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "1.5rem",
            backgroundColor: getQty == "" ? colors.divider : colors.success,
          }}
          isDisabled={getQty == ""}
          onclick={onConvertFiat}
        />
      </BottomButtonContainer>
    </div>
  );
}
