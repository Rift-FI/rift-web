import { JSX, MouseEvent, useState } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { TextField } from "@mui/material";
import { fetchAirWllxBalances } from "../../utils/api/awllx";
import { useBackButton } from "../../hooks/backbutton";
import { useAppDialog } from "../../hooks/dialog";
import { useSnackbar } from "../../hooks/snackbar";
import { fetchMyKeys, getkeysType, keyType } from "../../utils/api/keys";
import { PopOver, PopOverAlt } from "../../components/global/PopOver";
import { ChevronLeft } from "../../assets/icons/actions";
import airwallex from "../../assets/images/awx.png";
import { colors } from "../../constants";
import "../../styles/pages/deposit/depositfromawx.scss";

export default function DepositFromAwx(): JSX.Element {
  const navigate = useNavigate();
  const { initData } = useLaunchParams();
  const { target } = useParams();
  const { openAppDialog } = useAppDialog();
  const { showerrorsnack } = useSnackbar();

  const [anchorEl, setanchorEl] = useState<HTMLDivElement | null>(null);
  const [currencyAnchorEl, setCurrencyAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [selectKey, setSelectKey] = useState<string>("");
  const [selectCurrency, setSelectCurrency] = useState<"USD" | "HKD">("HKD");
  const [selectCurrencyAmount, setSelectCurrencyAmount] = useState<string>("");
  const [receipient, setReceipient] = useState<string>("");

  const { data: airwallexData } = useQuery({
    queryKey: ["airwallexbalances"],
    queryFn: () => fetchAirWllxBalances(initData?.user?.username as string),
  });
  const { data } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  let allKeys = data as getkeysType;
  let mykeys: keyType[] = allKeys?.keys?.map((_key: string) =>
    JSON.parse(_key)
  );
  let myAwxKeys = mykeys?.filter((key) => key.purpose !== "OPENAI");

  const openPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setanchorEl(event.currentTarget);
  };

  const openCurrencyPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setCurrencyAnchorEl(event.currentTarget);
  };

  const onimportAwx = () => {
    openAppDialog("awxkeyimport", "Import AirWallex API Key");
  };

  const onSubmitDeposit = () => {
    showerrorsnack("Feature coming soon");
  };

  const goBack = () => {
    navigate("/deposit");
  };

  useBackButton(goBack);

  return (
    <section id="depositfromawx">
      <p className="title_desc">
        Deposit from airwallex
        <span>
          Use your Airwallex balances to deposit USCD to&nbsp;
          {target === "me" ? "your wallet" : "another wallet"}
        </span>
      </p>

      {airwallexData?.status !== 404 && (
        <p className="api_keys">Choose an Airwallex API Key</p>
      )}

      {airwallexData?.status == 404 ? (
        <>
          <p className="message">
            An Airwallex key allows you to view your USD & HKD balances and buy
            OM (using USD/HKD)
          </p>

          <div className="airwallex" onClick={onimportAwx}>
            <span>Import AirWallex Key</span>
            <img src={airwallex} alt="airwallex" />
          </div>
        </>
      ) : (
        <>
          <div className="secretselector" onClick={openPopOver}>
            <div className="img_desc">
              <img src={airwallex} alt="secret" />

              <p className="desc">
                {selectKey == ""
                  ? "Please choose a key"
                  : selectKey.substring(0, 16) + "..."}
              </p>
            </div>

            <span className="inv_icon">
              <ChevronLeft width={6} height={11} color={colors.textsecondary} />
            </span>
          </div>
          <PopOver anchorEl={anchorEl} setAnchorEl={setanchorEl}>
            {
              <div className="select_secrets">
                {myAwxKeys?.map((_key, index) => (
                  <div
                    key={index}
                    className="img_desc"
                    onClick={() => {
                      setSelectKey(_key?.value);
                      setanchorEl(null);
                    }}
                  >
                    <img src={airwallex} alt="secret" />

                    <p className="desc">
                      API KEY <br />
                      <span>{_key?.value?.substring(0, 23) + "..."}</span>
                    </p>
                  </div>
                ))}

                <p className="asset_tle">
                  Select the AirWallex Key you would like to use
                </p>
              </div>
            }
          </PopOver>
        </>
      )}

      {airwallexData?.status !== 404 && selectKey !== "" && (
        <>
          <p className="balances">Available Balances</p>
          <div className="available_balances">
            <div className="currencybalance">
              <div className="flag_symbol">
                <span className="flag">🇭🇰</span>
                <p className="symbol">HKD</p>
              </div>

              <div className="avail_total">
                <p className="avail">
                  {airwallexData?.balances?.balances?.HKD.toFixed(2) || 0}
                </p>
                <span>HKD</span>
              </div>
            </div>

            <div className="currencybalance">
              <div className="flag_symbol">
                <span className="flag">🇺🇸</span>
                <p className="symbol">USD</p>
              </div>

              <div className="avail_total">
                <p className="avail">
                  {airwallexData?.balances?.balances?.USD.toFixed(2) || 0}
                </p>
                <span>USD</span>
              </div>
            </div>
          </div>

          <p className="balances">Amount to deposit</p>
          <div className="amounttodeposit">
            <input
              type="text"
              inputMode="numeric"
              className="currencyamount"
              placeholder={`200 ${selectCurrency}`}
              max={10}
              maxLength={10}
              value={selectCurrencyAmount}
              onChange={(e) => setSelectCurrencyAmount(e.target.value)}
            />

            <div onClick={openCurrencyPopOver} className="currencyselector">
              <span>
                {selectCurrency == "HKD" ? "🇭🇰" : "🇺🇸"} {selectCurrency}
              </span>
            </div>
            <PopOverAlt
              anchorEl={currencyAnchorEl}
              setAnchorEl={setCurrencyAnchorEl}
            >
              <div className="select_currency">
                <div
                  className="initial"
                  onClick={() => {
                    setSelectCurrency("HKD");
                    setCurrencyAnchorEl(null);
                  }}
                >
                  <span>🇭🇰 HKD</span>
                </div>

                <div
                  onClick={() => {
                    setSelectCurrency("USD");
                    setCurrencyAnchorEl(null);
                  }}
                >
                  <span>🇺🇸 USD</span>
                </div>

                <p className="text">Choose a currency</p>
              </div>
            </PopOverAlt>
          </div>

          {target === "other" && (
            <div className="receipient">
              <p className="ttle">
                Receipient <br />
                <span>You can use their Telegram username</span>
              </p>

              <TextField
                value={receipient}
                onChange={(ev) => setReceipient(ev.target.value)}
                label="Receipient"
                placeholder="telegram username"
                fullWidth
                variant="outlined"
                autoComplete="off"
                type="text"
                sx={{
                  marginTop: "0.75rem",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: colors.divider,
                    },
                    "& input": {
                      color: colors.textprimary,
                    },
                    "&::placeholder": {
                      color: colors.textsecondary,
                      opacity: 1,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.textsecondary,
                    fontSize: "0.875rem",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: colors.accent,
                  },
                }}
              />
            </div>
          )}
        </>
      )}

      <button
        disabled={airwallexData?.status == 404 || selectKey == ""}
        onClick={onSubmitDeposit}
        className="submitdeposit"
      >
        {selectKey == "" ? "Deposit" : `Deposit with ${selectCurrency}`}
      </button>
    </section>
  );
}
