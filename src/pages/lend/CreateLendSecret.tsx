import { JSX, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { lendmyKey } from "../../utils/api/keys";
import { CurrencyPicker, TimePicker } from "../../components/global/Radios";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { cryptoassets } from "../transactions/SendCryptoMethods";
import { Loading } from "../../assets/animations";
import { Clipboard } from "../../assets/icons";
import { colors } from "../../constants";
import ethlogo from "../../assets/images/logos/eth.png";
import beralogo from "../../assets/images/logos/bera.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import openailogo from "../../assets/images/logos/openai.png";
import "../../styles/pages/createlendsecret.scss";

export default function CreateLendSecret(): JSX.Element {
  const navigate = useNavigate();
  const { purpose, value } = useParams();
  const { switchtab } = useTabs();
  const { openAppDrawerWithKey } = useAppDrawer();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();

  const [selectedCurrency, setSelectedCurrency] = useState<cryptoassets>("ETH");
  const [expiryTime, setExpiryTime] = useState<"30m" | "2h" | "24h" | "8700h">(
    "30m"
  );
  const [secretFee, setSecretFee] = useState<string>("");
  const [receipient, setReceipient] = useState<string>("");

  const ethusdvalue = localStorage.getItem("ethpriceusd");
  const berausdvalue = localStorage.getItem("berausdcbal");
  const usdcusdvalue = localStorage.getItem("usdcusdprice");

  const amountInUSD =
    selectedCurrency == "WBERA"
      ? Number(secretFee) * Number(berausdvalue)
      : selectedCurrency == "ETH"
      ? Number(secretFee) * Number(ethusdvalue)
      : Number(secretFee) * Number(usdcusdvalue);

  const { mutate: onLendKey, isPending: lendloading } = useMutation({
    mutationFn: () =>
      lendmyKey(
        value as string,
        receipient,
        expiryTime,
        purpose as string,
        secretFee,
        selectedCurrency,
        String(amountInUSD)
      )
        .then((res) => {
          if (res?.data && secretFee == "0") {
            showsuccesssnack("Key was shared successfully");
          } else if (res?.data && secretFee !== "0") {
            openAppDrawerWithKey("sendlendlink", res?.data, "Key"); // action : link : Key or Crypto
          } else {
            showerrorsnack("Failed to lend key, please try again");
          }
        })
        .catch(() => {
          showerrorsnack("Failed to lend key, please try again");
        }),
  });

  const goBack = () => {
    switchtab("keys");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="createlendsecret">
      <div className="key-ctr">
        <p>
          {purpose} Key <span>{value?.substring(0, 5)}***</span>
        </p>

        <img src={openailogo} alt="open-ai" />
      </div>

      <p className="section-title">
        Receipient
        <span>Lend keys via Telegram</span>
      </p>

      <OutlinedTextInput
        inputType="text"
        inputState={receipient}
        setInputState={setReceipient}
        inputlabalel="Telegram ID"
        placeholder="telegram id"
      />

      <p className="section-title currency-title">
        Payment Option & Fee
        <span>Choose how you would like to be paid for your key</span>
      </p>

      <div className="currencies">
        <CurrencyPicker
          image={ethlogo}
          title="Ethereum"
          description="ETH"
          ischecked={selectedCurrency == "ETH"}
          onclick={() => setSelectedCurrency("ETH")}
        />

        <CurrencyPicker
          image={beralogo}
          title="Berachain"
          description="WBERA"
          ischecked={selectedCurrency == "WBERA"}
          onclick={() => setSelectedCurrency("WBERA")}
        />

        <CurrencyPicker
          image={usdclogo}
          title="USDC (Polygon)"
          description="USDC"
          ischecked={selectedCurrency == "USDC"}
          onclick={() => setSelectedCurrency("USDC")}
        />

        <CurrencyPicker
          image={usdclogo}
          title="USDC (Berachain)"
          description="USDC.e"
          ischecked={selectedCurrency == "WUSDC"}
          onclick={() => setSelectedCurrency("WUSDC")}
        />
      </div>

      <OutlinedTextInput
        inputType="number"
        inputState={secretFee}
        setInputState={setSecretFee}
        inputlabalel={`Fee (${
          selectedCurrency == "WUSDC" ? "USDC.e" : selectedCurrency
        })`}
        placeholder={`2 ${
          selectedCurrency == "WUSDC" ? "USDC.e" : selectedCurrency
        }`}
      />

      <p className="section-title expiry-title">
        Key Expiry
        <span>
          How long would you like the receipient to have access to the key ?
        </span>
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
        <button onClick={() => onLendKey()}>
          {lendloading ? (
            <Loading width="1.25rem" height="1.25rem" />
          ) : (
            <>
              Lend Key <Clipboard color={colors.textprimary} />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
