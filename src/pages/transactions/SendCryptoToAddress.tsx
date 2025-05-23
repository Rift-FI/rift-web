import { JSX, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { getAllBalances } from "../../utils/api/balances";
import { numberFormat, formatNumber } from "../../utils/formatters";
import { CurrencyPicker } from "../../components/global/Radios";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { ArrowUpCircle, Check } from "../../assets/icons";
import { Loading } from "../../assets/animations";
import { colors } from "../../constants";
import ethlogo from "../../assets/images/logos/eth.png";
import beralogo from "../../assets/images/logos/bera.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import "../../styles/pages/transactions/sendcryptotoaddress.scss";

export default function SendCryptoToAddress(): JSX.Element {
  const navigate = useNavigate();
  const { srccurrency, intent } = useParams();
  const { switchtab } = useTabs();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDrawer } = useAppDrawer();
  const { showTxStatusBar, txStatusBarVisible, transactionStatus } =
    useTransactionStatus();

  const initialCurrency: cryptoassets = srccurrency as string as cryptoassets;

  const [selectedCurrency, setSelectedCurrency] =
    useState<cryptoassets>(initialCurrency);
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [cryptoAmount, setCryptoAmount] = useState<string>("");

  const txverified = localStorage.getItem("txverified");
  const prev_page = localStorage.getItem("prev_page");

  const { data: allbalances } = useQuery({
    queryKey: ["allbalances"],
    queryFn: getAllBalances,
  });

  const ethbalance = formatNumber(
    Number(allbalances?.data?.ethereum[0]?.balance) || 0
  );
  const wberabalance = formatNumber(
    Number(allbalances?.data?.berachain[1]?.balance) || 0
  );
  const usdcbalance = formatNumber(
    Number(allbalances?.data?.polygon[1]?.balance) || 0
  );
  const berausdcbalance = formatNumber(
    Number(allbalances?.data?.berachain[2]?.balance) || 0
  );

  const { mutate: _mutateSendEth, isPending: sendethPending } = useMutation({
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

  const { mutate: _mutateSendUsdc, isPending: sendusdcPending } = useMutation({
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

  const { mutate: _mutateSendWusdc, isPending: sendberausdcPending } =
    useMutation({
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

  const { mutate: _mutateSendWbera, isPending: sendwberaPending } = useMutation(
    {
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
    }
  );

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

  const onSendToAddress = () => {
    if (receiverAddress == "" || cryptoAmount == "") {
      showerrorsnack("Please enter a valid address & amount");
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

  useEffect(() => {
    if (txStatusBarVisible && transactionStatus == "PROCESSED") {
      showsuccesssnack("The transaction was completed successfully");
    }
  }, [txStatusBarVisible, transactionStatus]);

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
          description={`ETH (${ethbalance})`}
          ischecked={selectedCurrency == "ETH"}
          onclick={() => setSelectedCurrency("ETH")}
        />

        <CurrencyPicker
          image={beralogo}
          title="Berachain"
          description={`WBERA (${wberabalance})`}
          ischecked={selectedCurrency == "WBERA"}
          onclick={() => setSelectedCurrency("WBERA")}
        />

        <CurrencyPicker
          image={usdclogo}
          title="USDC (Polygon)"
          description={`USDC (${usdcbalance})`}
          ischecked={selectedCurrency == "USDC"}
          onclick={() => setSelectedCurrency("USDC")}
        />

        <CurrencyPicker
          image={usdclogo}
          title="USDC (Berachain)"
          description={`USDC.e (${berausdcbalance})`}
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
          inputState={cryptoAmount}
          setInputState={setCryptoAmount}
        />
      </div>

      <div className="actions">
        <button
          onClick={onSendToAddress}
          disabled={
            sendethPending ||
            sendusdcPending ||
            sendberausdcPending ||
            sendwberaPending ||
            (txStatusBarVisible && transactionStatus == "PENDING")
          }
        >
          {sendethPending ||
          sendusdcPending ||
          sendberausdcPending ||
          sendwberaPending ? (
            <Loading width="1.25rem" height="1.25rem" />
          ) : txverified == null ? (
            <>
              Verify To Send <Check color={colors.textprimary} />
            </>
          ) : (
            <>
              Send
              <ArrowUpCircle color={colors.textprimary} />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
