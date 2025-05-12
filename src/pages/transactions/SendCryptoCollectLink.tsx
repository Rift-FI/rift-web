import { JSX, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { openTelegramLink, useLaunchParams } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { createCryptoCollectLink } from "../../utils/api/wallet";
import { CurrencyPicker, TimePicker } from "../../components/global/Radios";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { cryptoassets } from "./SendCryptoMethods";
import { Check, Link } from "../../assets/icons";
import { colors } from "../../constants";
import ethlogo from "../../assets/images/logos/eth.png";
import beralogo from "../../assets/images/logos/bera.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import "../../styles/pages/transactions/sendcryptocollectlink.scss";

export default function SendCryptoCollectLink(): JSX.Element {
  const navigate = useNavigate();
  const { srccurrency, intent } = useParams();
  const { initData } = useLaunchParams();
  const { switchtab } = useTabs();
  const { showerrorsnack } = useSnackbar();
  const { openAppDrawer } = useAppDrawer();

  const initialCurrency: cryptoassets = srccurrency as string as cryptoassets;

  const [selectedCurrency, setSelectedCurrency] =
    useState<cryptoassets>(initialCurrency);
  const [accessAmnt, setAccessAmnt] = useState<string>("");
  const [cryptoAmount, setCryptoAmount] = useState<string>("");
  const [expiryTime, setExpiryTime] = useState<"30m" | "2h" | "24h" | "8700h">(
    "30m"
  );

  const ethBal = localStorage.getItem("ethbal");
  const ethBalUsd = localStorage.getItem("ethbalusd");
  const ethUsdValue = localStorage.getItem("ethvalue");
  const polygonUsdcBal = localStorage.getItem("polygonusdcbal");
  const beraUsdcBal = localStorage.getItem("berausdcbal");
  const beraBal = localStorage.getItem("berabal");
  const wberaBalUsd = localStorage.getItem("berabalusd");
  const wberaUsdValue = localStorage.getItem("berapriceusd");
  const usdcUsdValue = localStorage.getItem("usdcusdprice");
  const txverified = localStorage.getItem("txverified");
  const prev_page = localStorage.getItem("prev_page");

  const assetUsdValue =
    selectedCurrency == "ETH"
      ? Number(ethUsdValue || 0)
      : selectedCurrency == "WBERA"
      ? Number(wberaUsdValue || 0)
      : Number(usdcUsdValue);

  const goBack = () => {
    if (prev_page == null) {
      switchtab("home");
      navigate("/app");
    } else if (prev_page == "send-options") {
      navigate(`/send-crypto-methods/${srccurrency}/${intent}`);
    } else {
      navigate(prev_page);
    }
  };

  const errorInUSDVal = (): boolean => {
    const usdBalance =
      selectedCurrency === "WBERA"
        ? Number(wberaBalUsd || 0)
        : selectedCurrency === "ETH"
        ? Number(ethBalUsd || 0)
        : selectedCurrency === "USDC"
        ? Number(polygonUsdcBal || 0)
        : selectedCurrency === "WUSDC"
        ? Number(beraUsdcBal || 0)
        : 0;

    const accessAmntNum = Number(accessAmnt);
    return accessAmntNum > usdBalance;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createCryptoCollectLink(expiryTime, cryptoAmount, selectedCurrency)
        .then((res) => {
          if (res?.token) {
            localStorage.removeItem("txverified");
            const shareUrl = res?.token + `%26intent=${intent}`;
            openTelegramLink(
              `https://t.me/share/url?url=${shareUrl}&text=Click to collect ${accessAmnt} USD from ${
                initData?.user?.username || initData?.user?.id
              }`
            );
          } else {
            showerrorsnack("Failed to create link, please try again");
          }
        })
        .catch(() => {
          showerrorsnack("Failed to create link, please try again");
        }),
  });

  const onCreateLink = () => {
    if (accessAmnt == "" || cryptoAmount == "" || errorInUSDVal()) {
      showerrorsnack("Please enter a valid amount");
    } else if (txverified == null) {
      openAppDrawer("verifytxwithotp");
    } else {
      mutate();
    }
  };

  useBackButton(goBack);

  return (
    <section id="sendcryptocollectlink">
      <p className="title_desc">
        Send Via Link
        <span>Send crypto using a secure Sphere link</span>
      </p>

      <div className="currencies">
        <CurrencyPicker
          image={ethlogo}
          title="Ethereum"
          description={`ETH (${ethBal})`}
          ischecked={selectedCurrency == "ETH"}
          onclick={() => setSelectedCurrency("ETH")}
        />

        <CurrencyPicker
          image={beralogo}
          title="Berachain"
          description={`WBERA (${beraBal})`}
          ischecked={selectedCurrency == "WBERA"}
          onclick={() => setSelectedCurrency("WBERA")}
        />

        <CurrencyPicker
          image={usdclogo}
          title="USDC (Polygon)"
          description={`USDC (${polygonUsdcBal})`}
          ischecked={selectedCurrency == "USDC"}
          onclick={() => setSelectedCurrency("USDC")}
        />

        <CurrencyPicker
          image={usdclogo}
          title="USDC (Berachain)"
          description={`USDC.e (${beraUsdcBal})`}
          ischecked={selectedCurrency == "WUSDC"}
          onclick={() => setSelectedCurrency("WUSDC")}
        />
      </div>

      <div className="inputs">
        <OutlinedTextInput
          inputType="number"
          placeholder="0.00"
          inputlabalel={`Quantity (${
            selectedCurrency == "WBERA"
              ? "BERA"
              : selectedCurrency == "WUSDC"
              ? "USDC.e"
              : selectedCurrency
          })`}
          inputState={accessAmnt == "" ? "" : cryptoAmount}
          setInputState={setCryptoAmount}
          onkeyup={() => {
            const usdValue = Number(cryptoAmount) * assetUsdValue;
            setAccessAmnt(isNaN(usdValue) ? "" : usdValue.toFixed(2));
          }}
          hasError={errorInUSDVal()}
        />

        <OutlinedTextInput
          inputType="number"
          placeholder="0.00"
          inputlabalel="Amount (USD)"
          inputState={cryptoAmount == "" ? "" : accessAmnt}
          setInputState={setAccessAmnt}
          onkeyup={() => {
            const cryptoVal =
              assetUsdValue > 0 ? Number(accessAmnt) / assetUsdValue : 0;
            setCryptoAmount(isNaN(cryptoVal) ? "" : cryptoVal.toFixed(5));
          }}
          hasError={errorInUSDVal()}
        />
      </div>

      <p className="expiry-desc">
        Link Expiry
        <span>Set an expiry time for the link you share</span>
      </p>

      <div className="timepickers">
        <TimePicker
          title="30"
          description="Min"
          ischecked={expiryTime == "30m"}
          onclick={() => setExpiryTime("30m")}
        />
        <TimePicker
          title="2"
          description="Hours"
          ischecked={expiryTime == "2h"}
          onclick={() => setExpiryTime("2h")}
        />
        <TimePicker
          title="1"
          description="Day"
          ischecked={expiryTime == "24h"}
          onclick={() => setExpiryTime("24h")}
        />
        <TimePicker
          title="No Expiry"
          description="Link doesn't expire"
          ischecked={expiryTime == "8700h"}
          onclick={() => setExpiryTime("8700h")}
        />
      </div>

      <div className="actions">
        <button onClick={onCreateLink} disabled={isPending}>
          {txverified == null
            ? "Verify To Create Link"
            : isPending
            ? "Processing..."
            : "Create & Share Link"}
          {txverified == null ? (
            <Check color={colors.textprimary} />
          ) : (
            <Link color={colors.textprimary} />
          )}
        </button>
      </div>
    </section>
  );
}
