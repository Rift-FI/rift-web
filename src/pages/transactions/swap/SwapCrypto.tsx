import { JSX, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useBackButton } from "../../../hooks/backbutton";
import { useSnackbar } from "../../../hooks/snackbar";
import { getAllBalances } from "../../../utils/api/balances";
import { formatNumber } from "../../../utils/formatters";
import { fetchSupprtedTokensPrices } from "../../../utils/coingecko/markets";
import { swapTokensNormal, swapTokensGassless } from "../../../utils/api/swap";
import { PopOver } from "../../../components/global/PopOver";
import { RadioButtonWithIcons } from "../../../components/global/Radios";
import { networks, token } from "./NetworkPicker";
import { Gas, GasOff, Rotate } from "../../../assets/icons";
import { colors } from "../../../constants";
import { Loading } from "../../../assets/animations";
import btclogo from "../../../assets/images/logos/btc.png";
import arbitrumlogo from "../../../assets/images/logos/arbitrum.png";
import baselogo from "../../../assets/images/logos/base.png";
import tetherlogo from "../../../assets/images/logos/usdt.png";
import avaxlogo from "../../../assets/images/logos/avalanche-avax.png";
import ethlogo from "../../../assets/images/logos/eth.png";
import usdclogo from "../../../assets/images/logos/usdc.png";
import usdtlogo from "../../../assets/images/logos/usdt.png";
import arblogo from "../../../assets/images/logos/arbitrum.png";
import dailogo from "../../../assets/images/logos/dai.png";
import beralogo from "../../../assets/images/logos/bera.png";
import maticlogo from "../../../assets/images/logos/matic.png";
import lisklogo from "../../../assets/images/logos/lisk.png";
import bnblogo from "../../../assets/images/logos/bnb.png";
import optimismlogo from "../../../assets/images/logos/optimism.png";
import "../../../styles/pages/transactions/swap/swapcrypto.scss";

export default function SwapCrypto(): JSX.Element {
  const navigate = useNavigate();
  const { network } = useParams();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const selectedNetwork = network as string as networks;
  const ethereumTokens: Partial<token>[] = [
    { symbol: "ETH", logo: ethlogo },
    { symbol: "USDC", logo: usdclogo },
    { symbol: "USDT", logo: tetherlogo },
    { symbol: "WETH", logo: ethlogo },
    { symbol: "WBTC", logo: btclogo },
    { symbol: "DAI", logo: dailogo },
    { symbol: "WSTETH", logo: ethlogo },
    { symbol: "RETH", logo: ethlogo },
  ];
  const arbitrumTokens: Partial<token>[] = [
    { symbol: "ARB", logo: arbitrumlogo },
    { symbol: "ETH", logo: ethlogo },
    { symbol: "USDC", logo: usdclogo },
    { symbol: "USDT", logo: tetherlogo },
    { symbol: "WETH", logo: ethlogo },
    { symbol: "WBTC", logo: btclogo },
    { symbol: "DAI", logo: dailogo },
    { symbol: "WSTETH", logo: ethlogo },
    { symbol: "RETH", logo: ethlogo },
    { symbol: "WAVAX", logo: avaxlogo },
    { symbol: "WMATIC", logo: maticlogo },
  ];
  const optimisimToken: Partial<token>[] = [
    { symbol: "ETH", logo: ethlogo },
    { symbol: "WETH", logo: ethlogo },
    { symbol: "OP", logo: optimismlogo },
    { symbol: "WBTC", logo: btclogo },
    { symbol: "USDC", logo: usdclogo },
    { symbol: "USDT", logo: tetherlogo },
    { symbol: "DAI", logo: dailogo },
    { symbol: "WSTETH", logo: ethlogo },
  ];
  const baseTokes: Partial<token>[] = [
    { symbol: "ETH", logo: ethlogo },
    { symbol: "WETH", logo: ethlogo },
    { symbol: "CBBTC", logo: btclogo },
    { symbol: "TBTC", logo: btclogo },
    { symbol: "USDC", logo: usdclogo },
    { symbol: "USDT", logo: tetherlogo },
    { symbol: "DAI", logo: dailogo },
    { symbol: "CBETH", logo: ethlogo },
    { symbol: "WSTETH", logo: ethlogo },
  ];

  const selectedTokens: Partial<token>[] =
    selectedNetwork == "ETHEREUM"
      ? ethereumTokens
      : selectedNetwork == "ARBITRUM"
      ? arbitrumTokens
      : selectedNetwork == "OPTIMISM"
      ? optimisimToken
      : baseTokes;
  const initialSellToken = selectedTokens[0];
  const initialReceiveToken = selectedTokens[0];

  const { data: allbalances, isPending: balancesloading } = useQuery({
    queryKey: ["allbalances"],
    queryFn: getAllBalances,
  });

  const [sellCurrency, setSellCurrency] =
    useState<Partial<token>>(initialSellToken);
  const [receiveCurrency, setReceiveCurrency] =
    useState<Partial<token>>(initialReceiveToken);
  const [sellCurrencyValue, setSellCurrencyValue] = useState<string>("");
  const [receiveCurrencyValue, setReceiveCurrencyValue] = useState<number>(0);
  const [swapType, setSwapType] = useState<"NORMAL" | "GASLESS">("NORMAL");
  const [sellCurrAnchorEl, setSellCurrAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [receiveCurrAnchorEl, setReceiveCurrAnchorEl] =
    useState<HTMLDivElement | null>(null);

  const { data: tokenprices, isPending: tokenpricesPending } = useQuery({
    queryKey: ["tokenprices"],
    queryFn: fetchSupprtedTokensPrices,
  });

  const { mutate: mutateSwapNormal, isPending: normalSwapPending } =
    useMutation({
      mutationFn: () =>
        swapTokensNormal(
          sellCurrency?.symbol as string,
          sellCurrency?.address as string,

          receiveCurrency?.symbol as string,

          sellCurrency?.symbol == "ETH" ||
            sellCurrency?.symbol == "WETH" ||
            sellCurrency?.symbol == "WSTETH" ||
            sellCurrency?.symbol == "RETH" ||
            sellCurrency?.symbol == "CBETH"
            ? sellCurrencyValue
            : "0",
          sellCurrency?.symbol == "ETH" ||
            sellCurrency?.symbol == "WETH" ||
            sellCurrency?.symbol == "WSTETH" ||
            sellCurrency?.symbol == "RETH" ||
            sellCurrency?.symbol == "CBETH"
            ? true
            : false
        )
          .then((res) => {
            if (res?.status == 500) {
              showerrorsnack("Sorry, we could not complete the swap");
            } else {
              setSellCurrencyValue("");
              setReceiveCurrencyValue(0);
              showsuccesssnack("The swap was completed successfully");
            }
          })
          .catch(() => {
            showerrorsnack("Sorry, we could not complete the swap");
          }),
    });

  const { mutate: mutateSwapGassless, isPending: gasslessSwapPending } =
    useMutation({
      mutationFn: () =>
        swapTokensGassless(
          sellCurrency?.symbol == "ETH"
            ? "eth"
            : (sellCurrency?.address as string),
          receiveCurrency?.symbol == "ETH"
            ? "eth"
            : (receiveCurrency?.address as string),
          sellCurrency?.symbol == "ETH" ||
            sellCurrency?.symbol == "WETH" ||
            sellCurrency?.symbol == "WSTETH" ||
            sellCurrency?.symbol == "RETH" ||
            sellCurrency?.symbol == "CBETH"
            ? sellCurrencyValue
            : "0",
          String(receiveCurrencyValue),
          sellCurrency?.symbol == "ETH" ||
            sellCurrency?.symbol == "WETH" ||
            sellCurrency?.symbol == "WSTETH" ||
            sellCurrency?.symbol == "RETH" ||
            sellCurrency?.symbol == "CBETH"
            ? true
            : false,
          receiveCurrency?.symbol == "ETH" ||
            receiveCurrency?.symbol == "WETH" ||
            receiveCurrency?.symbol == "WSTETH" ||
            receiveCurrency?.symbol == "RETH" ||
            receiveCurrency?.symbol == "CBETH"
            ? true
            : false
        )
          .then((res) => {
            if (res?.status == 500) {
              showerrorsnack("Sorry, we could not complete the swap");
            } else {
              setSellCurrencyValue("");
              setReceiveCurrencyValue(0);
              showsuccesssnack("The swap was completed successfully");
            }
          })
          .catch(() => {
            showerrorsnack("Sorry, we could not complete the swap");
          }),
    });

  const onGetTokenEstimates = () => {
    const sellmultipllier: number =
      sellCurrency?.symbol == "ETH" ||
      sellCurrency?.symbol == "WETH" ||
      sellCurrency?.symbol == "WSTETH" ||
      sellCurrency?.symbol == "RETH" ||
      sellCurrency?.symbol == "CBETH"
        ? Number(tokenprices?.ethereum?.usd)
        : sellCurrency?.symbol == "WBTC" ||
          sellCurrency?.symbol == "CBBTC" ||
          sellCurrency?.symbol == "TBTC"
        ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
        : sellCurrency?.symbol == "ARB"
        ? Number(tokenprices?.arbitrum?.usd)
        : sellCurrency?.symbol == "BERA" || sellCurrency?.symbol == "WBERA"
        ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
        : sellCurrency?.symbol == "DAI"
        ? Number(tokenprices?.dai?.usd)
        : sellCurrency?.symbol == "USDC" || sellCurrency?.symbol == "USDC.e"
        ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
        : sellCurrency?.symbol == "USDT"
        ? Number(tokenprices?.tether?.usd)
        : sellCurrency?.symbol == "OP"
        ? Number(tokenprices?.optimism?.usd)
        : sellCurrency?.symbol == "MATIC"
        ? Number(tokenprices && tokenprices["matic-network"]?.usd)
        : sellCurrency?.symbol == "LSK"
        ? Number(tokenprices?.lisk?.usd)
        : Number(tokenprices?.binancecoin?.usd);

    const receivemultipllier: number =
      receiveCurrency?.symbol == "ETH" ||
      receiveCurrency?.symbol == "WETH" ||
      receiveCurrency?.symbol == "WSTETH" ||
      receiveCurrency?.symbol == "RETH" ||
      receiveCurrency?.symbol == "CBETH"
        ? Number(tokenprices?.ethereum?.usd)
        : receiveCurrency?.symbol == "WBTC" ||
          receiveCurrency?.symbol == "CBBTC" ||
          receiveCurrency?.symbol == "TBTC"
        ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
        : receiveCurrency?.symbol == "ARB"
        ? Number(tokenprices?.arbitrum?.usd)
        : receiveCurrency?.symbol == "BERA" ||
          receiveCurrency?.symbol == "WBERA"
        ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
        : receiveCurrency?.symbol == "DAI"
        ? Number(tokenprices?.dai?.usd)
        : receiveCurrency?.symbol == "USDC" ||
          receiveCurrency?.symbol == "USDC.e"
        ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
        : receiveCurrency?.symbol == "USDT"
        ? Number(tokenprices?.tether?.usd)
        : receiveCurrency?.symbol == "OP"
        ? Number(tokenprices?.optimism?.usd)
        : receiveCurrency?.symbol == "MATIC"
        ? Number(tokenprices && tokenprices["matic-network"]?.usd)
        : receiveCurrency?.symbol == "LSK"
        ? Number(tokenprices?.lisk?.usd)
        : Number(tokenprices?.binancecoin?.usd);

    const receiveQty =
      (Number(sellCurrencyValue) * sellmultipllier) / receivemultipllier;

    setReceiveCurrencyValue(receiveQty);
  };

  const onSwitchCurency = () => {
    setSellCurrency(receiveCurrency);
    setReceiveCurrency(sellCurrency);

    onGetTokenEstimates();
  };

  const goBack = () => {
    navigate("/swap-network");
  };

  const onSubmitSwapIntent = () => {
    if (sellCurrencyValue == "" || receiveCurrencyValue == 0) {
      showerrorsnack("Please enter a valid amount to swap");
      return;
    }

    if (swapType == "GASLESS") {
      mutateSwapGassless();
    } else {
      mutateSwapNormal();
    }
  };

  useBackButton(goBack);

  return (
    <section id="swapcrypto">
      <div className="network">
        <img
          src={
            selectedNetwork == "ETHEREUM"
              ? ethlogo
              : selectedNetwork == "ARBITRUM"
              ? arbitrumlogo
              : selectedNetwork == "OPTIMISM"
              ? optimismlogo
              : baselogo
          }
          alt="network"
        />

        <p>
          Swapping on&nbsp;
          <span>
            {selectedNetwork == "ETHEREUM"
              ? "Ethereum Mainnet"
              : selectedNetwork}
          </span>
        </p>
      </div>

      <div className="sellcurr_ctr">
        <div className="curr_balance">
          <div
            className="curr"
            onClick={(e) => setSellCurrAnchorEl(e.currentTarget)}
          >
            <img
              src={
                sellCurrency?.symbol == "ETH" ||
                sellCurrency?.symbol == "WETH" ||
                sellCurrency?.symbol == "WSTETH" ||
                sellCurrency?.symbol == "RETH" ||
                sellCurrency?.symbol == "CBETH"
                  ? ethlogo
                  : sellCurrency?.symbol == "WBTC" ||
                    sellCurrency?.symbol == "CBBTC" ||
                    sellCurrency?.symbol == "TBTC"
                  ? btclogo
                  : sellCurrency?.symbol == "ARB"
                  ? arblogo
                  : sellCurrency?.symbol == "BERA" ||
                    sellCurrency?.symbol == "WBERA"
                  ? beralogo
                  : sellCurrency?.symbol == "DAI"
                  ? dailogo
                  : sellCurrency?.symbol == "USDC" ||
                    sellCurrency?.symbol == "USDC.e"
                  ? usdclogo
                  : sellCurrency?.symbol == "USDT"
                  ? usdtlogo
                  : sellCurrency?.symbol == "OP"
                  ? optimismlogo
                  : sellCurrency?.symbol == "MATIC"
                  ? maticlogo
                  : sellCurrency?.symbol == "LSK"
                  ? lisklogo
                  : bnblogo
              }
              alt={sellCurrency.symbol}
            />

            <span className="currency_name">{sellCurrency.symbol}</span>
          </div>
          <PopOver
            anchorEl={sellCurrAnchorEl}
            setAnchorEl={setSellCurrAnchorEl}
          >
            <div className="sell-receive-tokens-ctr">
              {allbalances?.data?.arbitrum?.map((_token) => (
                <div
                  onClick={() => {
                    setSellCurrency({
                      symbol: _token?.symbol,
                      address: _token?.address as string,
                    });

                    onGetTokenEstimates();
                    setSellCurrAnchorEl(null);
                  }}
                >
                  <img
                    src={
                      _token?.symbol == "ETH" ||
                      _token?.symbol == "WETH" ||
                      _token?.symbol == "WSTETH" ||
                      _token?.symbol == "RETH" ||
                      _token?.symbol == "CBETH"
                        ? ethlogo
                        : _token?.symbol == "WBTC" ||
                          _token?.symbol == "CBBTC" ||
                          _token?.symbol == "TBTC"
                        ? btclogo
                        : _token?.symbol == "ARB"
                        ? arblogo
                        : _token?.symbol == "BERA" || _token?.symbol == "WBERA"
                        ? beralogo
                        : _token?.symbol == "DAI"
                        ? dailogo
                        : _token?.symbol == "USDC" || _token?.symbol == "USDC.e"
                        ? usdclogo
                        : _token?.symbol == "USDT"
                        ? usdtlogo
                        : _token?.symbol == "OP"
                        ? optimismlogo
                        : _token?.symbol == "MATIC"
                        ? maticlogo
                        : _token?.symbol == "LSK"
                        ? lisklogo
                        : bnblogo
                    }
                    alt={_token?.symbol}
                  />
                  <span>{_token?.symbol}</span>
                </div>
              ))}
            </div>
          </PopOver>
        </div>

        <div className="input_ctr">
          <input
            type="text"
            inputMode="numeric"
            placeholder={`0.0 ${sellCurrency.symbol}`}
            autoFocus
            value={sellCurrencyValue}
            onChange={(e) => setSellCurrencyValue(e.target.value)}
            onKeyUp={() => onGetTokenEstimates()}
          />
          <span className="sell_title">Sell</span>
        </div>
      </div>

      <div key={sellCurrency.symbol} className="switch_currenncy">
        <button onClick={onSwitchCurency}>
          <Rotate color={colors.primary} />
        </button>
      </div>

      <div className="receivecurr_ctr">
        <div
          className="curr"
          onClick={(e) => {
            setReceiveCurrAnchorEl(e.currentTarget);
          }}
        >
          <img
            src={
              receiveCurrency?.symbol == "ETH" ||
              receiveCurrency?.symbol == "WETH" ||
              receiveCurrency?.symbol == "WSTETH" ||
              receiveCurrency?.symbol == "RETH" ||
              receiveCurrency?.symbol == "CBETH"
                ? ethlogo
                : receiveCurrency?.symbol == "WBTC" ||
                  receiveCurrency?.symbol == "CBBTC" ||
                  receiveCurrency?.symbol == "TBTC"
                ? btclogo
                : receiveCurrency?.symbol == "ARB"
                ? arblogo
                : receiveCurrency?.symbol == "BERA" ||
                  receiveCurrency?.symbol == "WBERA"
                ? beralogo
                : receiveCurrency?.symbol == "DAI"
                ? dailogo
                : receiveCurrency?.symbol == "USDC" ||
                  receiveCurrency?.symbol == "USDC.e"
                ? usdclogo
                : receiveCurrency?.symbol == "USDT"
                ? usdtlogo
                : receiveCurrency?.symbol == "OP"
                ? optimismlogo
                : receiveCurrency?.symbol == "MATIC"
                ? maticlogo
                : receiveCurrency?.symbol == "LSK"
                ? lisklogo
                : bnblogo
            }
            alt={receiveCurrency.symbol}
          />

          <span className="currency_name">{receiveCurrency.symbol}</span>
        </div>
        <PopOver
          anchorEl={receiveCurrAnchorEl}
          setAnchorEl={setReceiveCurrAnchorEl}
        >
          <div className="sell-receive-tokens-ctr">
            {allbalances?.data?.arbitrum?.map((_token) => (
              <div
                onClick={() => {
                  setReceiveCurrency({
                    symbol: _token?.symbol,
                    address: _token?.address as string,
                  });
                  onGetTokenEstimates();
                  setReceiveCurrAnchorEl(null);
                }}
              >
                <img
                  src={
                    _token?.symbol == "ETH" ||
                    _token?.symbol == "WETH" ||
                    _token?.symbol == "WSTETH" ||
                    _token?.symbol == "RETH" ||
                    _token?.symbol == "CBETH"
                      ? ethlogo
                      : _token?.symbol == "WBTC" ||
                        _token?.symbol == "CBBTC" ||
                        _token?.symbol == "TBTC"
                      ? btclogo
                      : _token?.symbol == "ARB"
                      ? arblogo
                      : _token?.symbol == "BERA" || _token?.symbol == "WBERA"
                      ? beralogo
                      : _token?.symbol == "DAI"
                      ? dailogo
                      : _token?.symbol == "USDC" || _token?.symbol == "USDC.e"
                      ? usdclogo
                      : _token?.symbol == "USDT"
                      ? usdtlogo
                      : _token?.symbol == "OP"
                      ? optimismlogo
                      : _token?.symbol == "MATIC"
                      ? maticlogo
                      : _token?.symbol == "LSK"
                      ? lisklogo
                      : bnblogo
                  }
                  alt={_token?.symbol}
                />

                <span>{_token?.symbol}</span>
              </div>
            ))}
          </div>
        </PopOver>

        <div className="receive_qty">
          <p className="qty">
            {formatNumber(receiveCurrencyValue)}&nbsp;
            <span>{receiveCurrency.symbol}</span>
          </p>
          <p className="receive_title">Receive</p>
        </div>
      </div>

      <div className="tx-type">
        <RadioButtonWithIcons
          icon={<Gas width={20} height={20} color={colors.textprimary} />}
          isRadio
          title="Normal Swap"
          description="You'll have to incurr gas fees"
          ischecked={swapType == "NORMAL"}
          onclick={() => setSwapType("NORMAL")}
        />

        <RadioButtonWithIcons
          icon={<GasOff width={20} height={20} color={colors.textprimary} />}
          isRadio
          title="Gasless Swap"
          description="We will cover gas for you"
          ischecked={swapType == "GASLESS"}
          onclick={() => setSwapType("GASLESS")}
        />
      </div>

      <button className="submit-swap" onClick={onSubmitSwapIntent}>
        {normalSwapPending || gasslessSwapPending ? (
          <Loading width="1.25rem" height="1.25rem" />
        ) : (
          <>
            Swap <Rotate color={colors.textprimary} />
          </>
        )}
      </button>
    </section>
  );
}
