import { JSX, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { cryptoassets } from "./SendCryptoMethods";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { useTransactionStatus } from "../../hooks/txstatus";
import {
  sendEth,
  sendWbera,
  sendPolygonUSDC,
  sendBerachainUsdc,
} from "../../utils/api/wallet";
import { numberFormat } from "../../utils/formatters";
import { CurrencyPicker } from "../../components/global/Radios";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { Check, Link } from "../../assets/icons";
import { colors } from "../../constants";
import ethlogo from "../../assets/images/logos/eth.png";
import beralogo from "../../assets/images/logos/bera.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import "../../styles/pages/transactions/sendcryptotoaddress.scss";

export default function SendCryptoToAddress(): JSX.Element {
  const navigate = useNavigate();
  const { srccurrency, intent } = useParams();
  const { switchtab } = useTabs();
  const { showerrorsnack } = useSnackbar();
  const { openAppDrawer } = useAppDrawer();
  const { showTxStatusBar, txStatusBarVisible, transactionStatus } =
    useTransactionStatus();

  const initialCurrency: cryptoassets = srccurrency as string as cryptoassets;

  const [selectedCurrency, setSelectedCurrency] =
    useState<cryptoassets>(initialCurrency);
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [accessAmnt, setAccessAmnt] = useState<string>("");
  const [cryptoAmount, setCryptoAmount] = useState<string>("");

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

  const { mutate: _mutateSendEth } = useMutation({
    mutationFn: () =>
      sendEth(receiverAddress, cryptoAmount, intent as string)
        .then(() => {
          localStorage.removeItem("txverified");
          showTxStatusBar(
            "PENDING",
            `Send ${numberFormat(Number(cryptoAmount))} ${selectedCurrency}`
          );
        })
        .catch(() => {
          showerrorsnack("Sorry, we couldn't process the transaction");
        }),
  });
  const { mutate: _mutateSendUsdc } = useMutation({
    mutationFn: () =>
      sendPolygonUSDC(receiverAddress, cryptoAmount, intent as string)
        .then(() => {
          localStorage.removeItem("txverified");
          showTxStatusBar(
            "PENDING",
            `Send ${numberFormat(Number(cryptoAmount))} ${selectedCurrency}`
          );
        })
        .catch(() => {
          showerrorsnack("Sorry, we couldn't process the transaction");
        }),
  });
  const { mutate: _mutateSendWusdc } = useMutation({
    mutationFn: () =>
      sendBerachainUsdc(receiverAddress, cryptoAmount, intent as string)
        .then(() => {
          localStorage.removeItem("txverified");
          showTxStatusBar(
            "PENDING",
            `Send ${numberFormat(Number(cryptoAmount))} ${selectedCurrency}`
          );
        })
        .catch(() => {
          showerrorsnack("Sorry, we couldn't process the transaction");
        }),
  });
  const { mutate: _mutateSendWbera } = useMutation({
    mutationFn: () =>
      sendWbera(receiverAddress, cryptoAmount, intent as string)
        .then(() => {
          localStorage.removeItem("txverified");
          showTxStatusBar(
            "PENDING",
            `Send ${numberFormat(Number(cryptoAmount))} ${selectedCurrency}`
          );
        })
        .catch(() => {
          showerrorsnack("Sorry, we couldn't process the transaction");
        }),
  });

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

  const onSendToAddress = () => {
    if (receiverAddress == "" || cryptoAmount == "") {
      showerrorsnack("Please enter a valid address & amount");
      return;
    }

    if (errorInUSDVal()) {
      showerrorsnack("Please try a lower amount");
      return;
    }

    if (txverified == null) {
      openAppDrawer("verifytxwithotp");
      return;
    }

    if (selectedCurrency == "ETH") {
      _mutateSendEth();
      return;
    }

    if (selectedCurrency == "WBERA") {
      _mutateSendWbera();
      return;
    }

    if (selectedCurrency == "USDC") {
      _mutateSendUsdc();
      return;
    }

    if (selectedCurrency == "WUSDC") {
      _mutateSendWusdc();
      return;
    }
  };

  useBackButton(goBack);

  return (
    <section id="sendcryptotoaddress">
      <p className="title_desc">
        Send to address
        <span>Tranfer your crypto to another address</span>
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
          description={`BERA (${beraBal})`}
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

      <div className="address-input">
        <OutlinedTextInput
          inputType="text"
          placeholder="0x123..."
          inputlabalel={`${
            selectedCurrency == "WBERA"
              ? "BERA"
              : selectedCurrency == "WUSDC"
              ? "USDC.e"
              : selectedCurrency
          } Address`}
          inputState={receiverAddress}
          setInputState={setReceiverAddress}
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

      <div className="actions">
        <button
          onClick={onSendToAddress}
          disabled={txStatusBarVisible && transactionStatus == "PENDING"}
        >
          {txverified == null ? "Verify To Send" : "Send"}
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
