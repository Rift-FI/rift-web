import { JSX, MouseEvent, useCallback, useEffect, useState } from "react";
import { useLaunchParams, backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDialog } from "../../hooks/dialog";
import { PopOver } from "../../components/global/PopOver";
import { awxbalType, fetchAirWllxBalances } from "../../utils/api/awllx";
import { formatUsd, formatNumber } from "../../utils/formatters";
import ethlogo from "../../assets/images/eth.png";
import { colors } from "../../constants";
import "../../styles/pages/buyom.scss";

type currencyType = "ETH" | "USD" | "HKD";

export default function BuyOm(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { showerrorsnack } = useSnackbar();
  const { openAppDialog } = useAppDialog();

  const [getQty, setGetQty] = useState<string>("");
  const [selectCurrency, setSelectCurrency] = useState<currencyType>("ETH");
  const [awxBalances, setAwxBalances] = useState<awxbalType | null>({
    message: "",
    balances: { HKD: 0, USD: 0 },
  });
  const [currAnchorEl, setCurrAnchorEl] = useState<HTMLDivElement | null>(null);

  const ethbalUsd = Number(localStorage.getItem("ethbalUsd"));
  const ethbal = Number(localStorage.getItem("ethbal"));
  const ethusd = Number(localStorage.getItem("ethvalue"));
  const mantraUsd = Number(localStorage.getItem("mantrausdval"));
  const selectedcurrencyBalance =
    selectCurrency == "ETH"
      ? ethbal
      : selectCurrency == "USD"
      ? Number(awxBalances?.balances?.USD)
      : Number(awxBalances?.balances?.HKD);
  const selectedcurrencyUsdValue =
    selectCurrency == "ETH" ? ethusd : selectCurrency == "USD" ? 1 : 7.79;

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setCurrAnchorEl(event.currentTarget);
  };

  const goBack = () => {
    navigate(-1);
  };

  const onSelectCurrency = (currency: currencyType) => {
    if (currency == "ETH") {
      setSelectCurrency(currency);
      setCurrAnchorEl(null);
    } else if (awxBalances == null) {
      showerrorsnack("Have you imported an Aiwallex API key ?");
      setCurrAnchorEl(null);
    } else {
      setSelectCurrency(currency);
      setCurrAnchorEl(null);
    }
  };

  const onGetAirWlxBalances = useCallback(async () => {
    const keyOwner = initData?.user?.username;
    let token: string | null = localStorage.getItem("token");

    const { balances, status } = await fetchAirWllxBalances(
      token as string,
      keyOwner as string
    );

    if (status !== 404) {
      setAwxBalances(balances);
      localStorage.setItem("userhasawxkey", "true");
    } else {
      openAppDialog("awxkeyimport", "Import your AirWallex Key");
    }
  }, []);

  useEffect(() => {
    onGetAirWlxBalances();
  }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="buyom">
      <p className="title">
        Get OM <br />
        <span>Buy OM using ETH, USD or HKD</span>
      </p>

      <div className="balancectr">
        <div className="currency" onClick={openAssetPopOver}>
          {selectCurrency == "ETH" ? (
            <img src={ethlogo} alt="eth" />
          ) : selectCurrency == "USD" ? (
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
        {selectCurrency == "ETH"
          ? formatNumber(ethbal) + " ETH"
          : selectCurrency == "USD"
          ? formatNumber(awxBalances?.balances?.USD as number) + " USD"
          : formatNumber(awxBalances?.balances?.HKD as number) + " HKD"}
        &nbsp;~&nbsp;
        {selectCurrency == "ETH"
          ? formatUsd(ethbalUsd)
          : selectCurrency == "USD"
          ? formatUsd(awxBalances?.balances?.USD as number)
          : formatUsd(Number(awxBalances?.balances?.HKD) / 7.79)}
      </p>
      <PopOver anchorEl={currAnchorEl} setAnchorEl={setCurrAnchorEl}>
        {
          <div className="select_currency">
            <div className="img_desc" onClick={() => onSelectCurrency("ETH")}>
              <img src={ethlogo} alt="asset" />

              <p className="desc">
                ETH <br /> <span>{formatNumber(ethbal)}</span>
              </p>
            </div>

            <div className="img_desc" onClick={() => onSelectCurrency("USD")}>
              <span className="flag">🇺🇸</span>

              <p className="desc">
                USD <br />
                <span>
                  {awxBalances == null
                    ? "Failed to get your balance"
                    : formatNumber(awxBalances?.balances?.USD as number)}
                </span>
              </p>
            </div>

            <div className="img_desc" onClick={() => onSelectCurrency("HKD")}>
              <span className="flag">🇭🇰</span>

              <p className="desc">
                HKD <br />
                <span>
                  {awxBalances == null
                    ? "Failed to get your balance"
                    : formatNumber(awxBalances?.balances?.HKD as number)}
                </span>
              </p>
            </div>

            <p className="asset_tle">Choose an asset to buy OM with</p>
          </div>
        }
      </PopOver>

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
            : formatNumber(
                (Number(getQty) * selectedcurrencyUsdValue) / mantraUsd
              )}
          &nbsp; <em>OM</em>
        </span>
      </p>

      <button
        disabled={Number(getQty) >= selectedcurrencyBalance}
        className="getbuyom"
      >
        Get OM
      </button>
    </section>
  );
}
