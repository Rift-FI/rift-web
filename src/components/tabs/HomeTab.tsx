import { Fragment, JSX, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AppBar } from "../AppBar";
import { AssetBalance, WalletAction, WalletBalance } from "../WalletBalance";
import { ArrowDownCircle, ArrowUpCircle, Rotate } from "../../assets/icons";
import {
  getAllBalances,
  balanceType,
  supportedchains,
  tokencategories,
} from "../../utils/api/balances";
import { getUnlockedTokens } from "../../utils/api/airdrop";
import { fetchSupprtedTokensPrices } from "../../utils/coingecko/markets";
import { getSphrUsdcRate } from "../../utils/api/sphere";
import { colors } from "../../constants";
import btclogo from "../../assets/images/logos/btc.png";
import ethlogo from "../../assets/images/logos/eth.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import usdtlogo from "../../assets/images/logos/usdt.png";
import arblogo from "../../assets/images/logos/arbitrum.png";
import dailogo from "../../assets/images/logos/dai.png";
import beralogo from "../../assets/images/logos/bera.png";
import maticlogo from "../../assets/images/logos/matic.png";
import lisklogo from "../../assets/images/logos/lisk.png";
import bnblogo from "../../assets/images/logos/bnb.png";
import optimismlogo from "../../assets/images/logos/optimism.png";
import spherelogo from "../../assets/images/icons/sphere.png";
import "../../styles/components/tabs/hometab.scss";

export const HomeTab = (): JSX.Element => {
  const navigate = useNavigate();

  const [networkFilter, setNetworkFilter] = useState<supportedchains | null>(
    null
  );
  const [tokensCategoryFilter, setTokensCategoryCategory] =
    useState<tokencategories | null>(null);
  const [displayTokens, setDisplayTokens] = useState<balanceType[] | null>(
    null
  );

  const { data: allbalances, isPending: balancesloading } = useQuery({
    queryKey: ["allbalances"],
    queryFn: getAllBalances,
  });

  const { data: sphereusdcrate, isPending: sphereusdcfetching } = useQuery({
    queryKey: ["sphereusdcrate"],
    queryFn: getSphrUsdcRate,
  });

  const { data: unlockedtokens, isPending: unlockedtokensfetching } = useQuery({
    queryKey: ["unlockedTokens"],
    queryFn: getUnlockedTokens,
  });

  const { data: tokenprices, isPending: tokenpricesPending } = useQuery({
    queryKey: ["tokenprices"],
    queryFn: fetchSupprtedTokensPrices,
  });

  const combinedBalances = Object.values(allbalances?.data || []).flat();
  let sortedBalances: balanceType[] = combinedBalances?.sort((a, b) => {
    if (Number(a.balance) === 0 && Number(b.balance) !== 0) return 1;
    if (Number(a.balance) !== 0 && Number(b.balance) === 0) return -1;

    return Number(b.balance) - Number(a.balance);
  });

  const onFilterTokensCategory = (filter: tokencategories) => {
    if (tokensCategoryFilter == filter) {
      setDisplayTokens(null);
      setTokensCategoryCategory(null);
    } else {
      const filteredtokens = sortedBalances?.filter(
        (_token) => _token?.category == filter || _token?.chain == networkFilter
      );
      setDisplayTokens(filteredtokens);
      setTokensCategoryCategory(filter);
    }
  };

  const onFilterNetwork = (filter: supportedchains) => {
    if (networkFilter == filter) {
      setDisplayTokens(null);
      setNetworkFilter(null);
    } else {
      const filteredtokens = sortedBalances?.filter(
        (_token) =>
          _token?.chain == filter || _token?.category == tokensCategoryFilter
      );

      setDisplayTokens(filteredtokens);
      setNetworkFilter(filter);
    }
  };

  const goToSendCryptoMethods = () => {
    navigate("/send-crypto-methods/ETH/send");
  };

  const goToDepositCrypto = () => {
    navigate("/deposit/ETH");
  };

  const goToSwap = () => {
    navigate("/swap-network");
  };

  const goToAsset = (symbol: string, network: string, balance: string) => {
    const coingeckoId =
      symbol == "ETH" ||
      symbol == "WETH" ||
      symbol == "WSTETH" ||
      symbol == "RETH" ||
      symbol == "CBETH"
        ? "ethereum"
        : symbol == "WBTC" || symbol == "CBBTC" || symbol == "TBTC"
        ? "wrapped-bitcoin"
        : symbol == "ARB"
        ? "arbitrum"
        : symbol == "BERA" || symbol == "WBERA"
        ? "berachain-bera"
        : symbol == "DAI"
        ? "dai"
        : symbol == "USDC" || symbol == "USDC.e"
        ? "usd-coin"
        : symbol == "USDT"
        ? "tether"
        : symbol == "OP"
        ? "optimism"
        : symbol == "MATIC"
        ? "matic-network"
        : symbol == "LSK"
        ? "lisk"
        : "binancecoin";

    navigate(`/assets/${coingeckoId}/${network}/${symbol}/${balance}`);
  };

  const aggregateBalancesUsd = (): number => {
    const ethBalances = allbalances?.data?.ethereum;
    const arbBalances = allbalances?.data?.arbitrum;
    const baseBalances = allbalances?.data?.base;
    const beraBalances = allbalances?.data?.berachain;
    const bnbBalances = allbalances?.data?.bnb;
    const optimismBalances = allbalances?.data?.optimism;
    const polBalances = allbalances?.data?.polygon;
    const liskBalances = allbalances?.data?.lisk;

    const ethTotal = ethBalances?.reduce((total, balance) => {
      const multipllier: number =
        balance?.symbol == "ETH" ||
        balance?.symbol == "WETH" ||
        balance?.symbol == "WSTETH" ||
        balance?.symbol == "RETH" ||
        balance?.symbol == "CBETH"
          ? Number(tokenprices?.ethereum?.usd)
          : balance?.symbol == "WBTC" ||
            balance?.symbol == "CBBTC" ||
            balance?.symbol == "TBTC"
          ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
          : balance?.symbol == "ARB"
          ? Number(tokenprices?.arbitrum?.usd)
          : balance?.symbol == "BERA" || balance?.symbol == "WBERA"
          ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
          : balance?.symbol == "DAI"
          ? Number(tokenprices?.dai?.usd)
          : balance?.symbol == "USDC" || balance?.symbol == "USDC.e"
          ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
          : balance?.symbol == "USDT"
          ? Number(tokenprices?.tether?.usd)
          : balance?.symbol == "OP"
          ? Number(tokenprices?.optimism?.usd)
          : balance?.symbol == "MATIC"
          ? Number(tokenprices && tokenprices["matic-network"]?.usd)
          : balance?.symbol == "LSK"
          ? Number(tokenprices?.lisk?.usd)
          : Number(tokenprices?.binancecoin?.usd);

      const tokenUsdBal = Number(balance?.balance) * multipllier;
      return total + tokenUsdBal;
    }, 0);

    const arbTotal = arbBalances?.reduce((total, balance) => {
      const multipllier: number =
        balance?.symbol == "ETH" ||
        balance?.symbol == "WETH" ||
        balance?.symbol == "WSTETH" ||
        balance?.symbol == "RETH" ||
        balance?.symbol == "CBETH"
          ? Number(tokenprices?.ethereum?.usd)
          : balance?.symbol == "WBTC" ||
            balance?.symbol == "CBBTC" ||
            balance?.symbol == "TBTC"
          ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
          : balance?.symbol == "ARB"
          ? Number(tokenprices?.arbitrum?.usd)
          : balance?.symbol == "BERA" || balance?.symbol == "WBERA"
          ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
          : balance?.symbol == "DAI"
          ? Number(tokenprices?.dai?.usd)
          : balance?.symbol == "USDC" || balance?.symbol == "USDC.e"
          ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
          : balance?.symbol == "USDT"
          ? Number(tokenprices?.tether?.usd)
          : balance?.symbol == "OP"
          ? Number(tokenprices?.optimism?.usd)
          : balance?.symbol == "MATIC"
          ? Number(tokenprices && tokenprices["matic-network"]?.usd)
          : balance?.symbol == "LSK"
          ? Number(tokenprices?.lisk?.usd)
          : Number(tokenprices?.binancecoin?.usd);

      const tokenUsdBal = Number(balance?.balance) * multipllier;
      return total + tokenUsdBal;
    }, 0);

    const baseTotal = baseBalances?.reduce((total, balance) => {
      const multipllier: number =
        balance?.symbol == "ETH" ||
        balance?.symbol == "WETH" ||
        balance?.symbol == "WSTETH" ||
        balance?.symbol == "RETH" ||
        balance?.symbol == "CBETH"
          ? Number(tokenprices?.ethereum?.usd)
          : balance?.symbol == "WBTC" ||
            balance?.symbol == "CBBTC" ||
            balance?.symbol == "TBTC"
          ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
          : balance?.symbol == "ARB"
          ? Number(tokenprices?.arbitrum?.usd)
          : balance?.symbol == "BERA" || balance?.symbol == "WBERA"
          ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
          : balance?.symbol == "DAI"
          ? Number(tokenprices?.dai?.usd)
          : balance?.symbol == "USDC" || balance?.symbol == "USDC.e"
          ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
          : balance?.symbol == "USDT"
          ? Number(tokenprices?.tether?.usd)
          : balance?.symbol == "OP"
          ? Number(tokenprices?.optimism?.usd)
          : balance?.symbol == "MATIC"
          ? Number(tokenprices && tokenprices["matic-network"]?.usd)
          : balance?.symbol == "LSK"
          ? Number(tokenprices?.lisk?.usd)
          : Number(tokenprices?.binancecoin?.usd);

      const tokenUsdBal = Number(balance?.balance) * multipllier;
      return total + tokenUsdBal;
    }, 0);

    const beraTotal = beraBalances?.reduce((total, balance) => {
      const multipllier: number =
        balance?.symbol == "ETH" ||
        balance?.symbol == "WETH" ||
        balance?.symbol == "WSTETH" ||
        balance?.symbol == "RETH" ||
        balance?.symbol == "CBETH"
          ? Number(tokenprices?.ethereum?.usd)
          : balance?.symbol == "WBTC" ||
            balance?.symbol == "CBBTC" ||
            balance?.symbol == "TBTC"
          ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
          : balance?.symbol == "ARB"
          ? Number(tokenprices?.arbitrum?.usd)
          : balance?.symbol == "BERA" || balance?.symbol == "WBERA"
          ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
          : balance?.symbol == "DAI"
          ? Number(tokenprices?.dai?.usd)
          : balance?.symbol == "USDC" || balance?.symbol == "USDC.e"
          ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
          : balance?.symbol == "USDT"
          ? Number(tokenprices?.tether?.usd)
          : balance?.symbol == "OP"
          ? Number(tokenprices?.optimism?.usd)
          : balance?.symbol == "MATIC"
          ? Number(tokenprices && tokenprices["matic-network"]?.usd)
          : balance?.symbol == "LSK"
          ? Number(tokenprices?.lisk?.usd)
          : Number(tokenprices?.binancecoin?.usd);

      const tokenUsdBal = Number(balance?.balance) * multipllier;
      return total + tokenUsdBal;
    }, 0);

    const bnbTotal = bnbBalances?.reduce((total, balance) => {
      const multipllier: number =
        balance?.symbol == "ETH" ||
        balance?.symbol == "WETH" ||
        balance?.symbol == "WSTETH" ||
        balance?.symbol == "RETH" ||
        balance?.symbol == "CBETH"
          ? Number(tokenprices?.ethereum?.usd)
          : balance?.symbol == "WBTC" ||
            balance?.symbol == "CBBTC" ||
            balance?.symbol == "TBTC"
          ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
          : balance?.symbol == "ARB"
          ? Number(tokenprices?.arbitrum?.usd)
          : balance?.symbol == "BERA" || balance?.symbol == "WBERA"
          ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
          : balance?.symbol == "DAI"
          ? Number(tokenprices?.dai?.usd)
          : balance?.symbol == "USDC" || balance?.symbol == "USDC.e"
          ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
          : balance?.symbol == "USDT"
          ? Number(tokenprices?.tether?.usd)
          : balance?.symbol == "OP"
          ? Number(tokenprices?.optimism?.usd)
          : balance?.symbol == "MATIC"
          ? Number(tokenprices && tokenprices["matic-network"]?.usd)
          : balance?.symbol == "LSK"
          ? Number(tokenprices?.lisk?.usd)
          : Number(tokenprices?.binancecoin?.usd);

      const tokenUsdBal = Number(balance?.balance) * multipllier;
      return total + tokenUsdBal;
    }, 0);

    const optimismTotal = optimismBalances?.reduce((total, balance) => {
      const multipllier: number =
        balance?.symbol == "ETH" ||
        balance?.symbol == "WETH" ||
        balance?.symbol == "WSTETH" ||
        balance?.symbol == "RETH" ||
        balance?.symbol == "CBETH"
          ? Number(tokenprices?.ethereum?.usd)
          : balance?.symbol == "WBTC" ||
            balance?.symbol == "CBBTC" ||
            balance?.symbol == "TBTC"
          ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
          : balance?.symbol == "ARB"
          ? Number(tokenprices?.arbitrum?.usd)
          : balance?.symbol == "BERA" || balance?.symbol == "WBERA"
          ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
          : balance?.symbol == "DAI"
          ? Number(tokenprices?.dai?.usd)
          : balance?.symbol == "USDC" || balance?.symbol == "USDC.e"
          ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
          : balance?.symbol == "USDT"
          ? Number(tokenprices?.tether?.usd)
          : balance?.symbol == "OP"
          ? Number(tokenprices?.optimism?.usd)
          : balance?.symbol == "MATIC"
          ? Number(tokenprices && tokenprices["matic-network"]?.usd)
          : balance?.symbol == "LSK"
          ? Number(tokenprices?.lisk?.usd)
          : Number(tokenprices?.binancecoin?.usd);

      const tokenUsdBal = Number(balance?.balance) * multipllier;
      return total + tokenUsdBal;
    }, 0);

    const polTotal = polBalances?.reduce((total, balance) => {
      const multipllier: number =
        balance?.symbol == "ETH" ||
        balance?.symbol == "WETH" ||
        balance?.symbol == "WSTETH" ||
        balance?.symbol == "RETH" ||
        balance?.symbol == "CBETH"
          ? Number(tokenprices?.ethereum?.usd)
          : balance?.symbol == "WBTC" ||
            balance?.symbol == "CBBTC" ||
            balance?.symbol == "TBTC"
          ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
          : balance?.symbol == "ARB"
          ? Number(tokenprices?.arbitrum?.usd)
          : balance?.symbol == "BERA" || balance?.symbol == "WBERA"
          ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
          : balance?.symbol == "DAI"
          ? Number(tokenprices?.dai?.usd)
          : balance?.symbol == "USDC" || balance?.symbol == "USDC.e"
          ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
          : balance?.symbol == "USDT"
          ? Number(tokenprices?.tether?.usd)
          : balance?.symbol == "OP"
          ? Number(tokenprices?.optimism?.usd)
          : balance?.symbol == "MATIC"
          ? Number(tokenprices && tokenprices["matic-network"]?.usd)
          : balance?.symbol == "LSK"
          ? Number(tokenprices?.lisk?.usd)
          : Number(tokenprices?.binancecoin?.usd);

      const tokenUsdBal = Number(balance?.balance) * multipllier;
      return total + tokenUsdBal;
    }, 0);

    const liskTotal = liskBalances?.reduce((total, balance) => {
      const multipllier: number =
        balance?.symbol == "ETH" ||
        balance?.symbol == "WETH" ||
        balance?.symbol == "WSTETH" ||
        balance?.symbol == "RETH" ||
        balance?.symbol == "CBETH"
          ? Number(tokenprices?.ethereum?.usd)
          : balance?.symbol == "WBTC" ||
            balance?.symbol == "CBBTC" ||
            balance?.symbol == "TBTC"
          ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
          : balance?.symbol == "ARB"
          ? Number(tokenprices?.arbitrum?.usd)
          : balance?.symbol == "BERA" || balance?.symbol == "WBERA"
          ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
          : balance?.symbol == "DAI"
          ? Number(tokenprices?.dai?.usd)
          : balance?.symbol == "USDC" || balance?.symbol == "USDC.e"
          ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
          : balance?.symbol == "USDT"
          ? Number(tokenprices?.tether?.usd)
          : balance?.symbol == "OP"
          ? Number(tokenprices?.optimism?.usd)
          : balance?.symbol == "MATIC"
          ? Number(tokenprices && tokenprices["matic-network"]?.usd)
          : balance?.symbol == "LSK"
          ? Number(tokenprices?.lisk?.usd)
          : Number(tokenprices?.binancecoin?.usd);

      const tokenUsdBal = Number(balance?.balance) * multipllier;
      return total + tokenUsdBal;
    }, 0);

    const spherebalanceUsd =
      Number(sphereusdcrate?.data?.currentRate || 0) *
      Number((tokenprices && tokenprices["usd-coin"]?.usd) || 0) *
      Number(unlockedtokens?.amount);

    return (
      Number(ethTotal) +
      Number(arbTotal) +
      Number(baseTotal) +
      Number(beraTotal) +
      Number(bnbTotal) +
      Number(optimismTotal) +
      Number(polTotal) +
      Number(liskTotal) +
      spherebalanceUsd
    );
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
    }

    if (backButton.isVisible()) {
      backButton.hide();
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  return (
    <Fragment>
      <AppBar />

      <div id="hometab">
        <WalletBalance
          balancesLoading={
            balancesloading ||
            sphereusdcfetching ||
            unlockedtokensfetching ||
            isNaN(aggregateBalancesUsd())
          }
          totalBalanceUsd={aggregateBalancesUsd()}
        />

        <div className="actions">
          <WalletAction
            icon={<ArrowUpCircle color={colors.textprimary} />}
            text="Send"
            onclick={goToSendCryptoMethods}
          />

          <WalletAction
            icon={<ArrowDownCircle color={colors.textprimary} />}
            text="Deposit"
            onclick={goToDepositCrypto}
          />

          <WalletAction
            icon={<Rotate color={colors.textprimary} />}
            text="Swap"
            onclick={goToSwap}
          />
        </div>

        <div className="filters">
          <button
            onClick={() => onFilterTokensCategory("native")}
            className={tokensCategoryFilter == "native" ? "active" : ""}
          >
            Native Tokens
          </button>

          <button
            onClick={() => onFilterTokensCategory("stablecoin")}
            className={tokensCategoryFilter == "stablecoin" ? "active" : ""}
          >
            Stablecoins
          </button>

          <button
            onClick={() => onFilterTokensCategory("native-wrapped")}
            className={tokensCategoryFilter == "native-wrapped" ? "active" : ""}
          >
            Wrapped
          </button>

          <button
            onClick={() => onFilterTokensCategory("governance")}
            className={tokensCategoryFilter == "governance" ? "active" : ""}
          >
            Governance
          </button>

          <button
            onClick={() => onFilterTokensCategory("staked-eth")}
            className={tokensCategoryFilter == "staked-eth" ? "active" : ""}
          >
            Staked
          </button>

          <button
            onClick={() => onFilterTokensCategory("btc-derivative")}
            className={tokensCategoryFilter == "btc-derivative" ? "active" : ""}
          >
            BTC
          </button>

          <button
            onClick={() => onFilterNetwork("ETHEREUM")}
            className={networkFilter == "ETHEREUM" ? "active" : ""}
          >
            Ethereum Mainnet
          </button>

          <button
            onClick={() => onFilterNetwork("ARBITRUM")}
            className={networkFilter == "ARBITRUM" ? "active" : ""}
          >
            Arbitrum
          </button>

          <button
            onClick={() => onFilterNetwork("BASE")}
            className={networkFilter == "BASE" ? "active" : ""}
          >
            Base
          </button>

          <button
            onClick={() => onFilterNetwork("POLYGON")}
            className={networkFilter == "POLYGON" ? "active" : ""}
          >
            Polygon
          </button>

          <button
            onClick={() => onFilterNetwork("OPTIMISM")}
            className={networkFilter == "OPTIMISM" ? "active" : ""}
          >
            Optimism
          </button>

          <button
            onClick={() => onFilterNetwork("LISK")}
            className={networkFilter == "LISK" ? "active" : ""}
          >
            Lisk
          </button>

          <button
            onClick={() => onFilterNetwork("BNB")}
            className={networkFilter == "BNB" ? "active" : ""}
          >
            BNB
          </button>

          <button
            onClick={() => onFilterNetwork("BERACHAIN")}
            className={networkFilter == "BERACHAIN" ? "active" : ""}
          >
            Berachain
          </button>
        </div>

        {tokensCategoryFilter == null && networkFilter == null && (
          <AssetBalance
            tokenLoading={
              unlockedtokensfetching || sphereusdcfetching || balancesloading
            }
            tokenImage={spherelogo}
            tokenSymbol="Sphere (Non Transferrable)"
            tokenName="Sphere"
            network="SPHR"
            balance={Number(unlockedtokens?.amount)}
            priceUsd={
              Number(sphereusdcrate?.data?.currentRate || 0) *
              Number((tokenprices && tokenprices["usd-coin"]?.usd) || 0)
            }
            onClickHandler={() => {}}
          />
        )}

        {displayTokens == null
          ? sortedBalances?.map((asset) => (
              <AssetBalance
                tokenLoading={balancesloading}
                tokenImage={
                  asset?.symbol == "ETH" ||
                  asset?.symbol == "WETH" ||
                  asset?.symbol == "WSTETH" ||
                  asset?.symbol == "RETH" ||
                  asset?.symbol == "CBETH"
                    ? ethlogo
                    : asset?.symbol == "WBTC" ||
                      asset?.symbol == "CBBTC" ||
                      asset?.symbol == "TBTC"
                    ? btclogo
                    : asset?.symbol == "ARB"
                    ? arblogo
                    : asset?.symbol == "BERA" || asset?.symbol == "WBERA"
                    ? beralogo
                    : asset?.symbol == "DAI"
                    ? dailogo
                    : asset?.symbol == "USDC" || asset?.symbol == "USDC.e"
                    ? usdclogo
                    : asset?.symbol == "USDT"
                    ? usdtlogo
                    : asset?.symbol == "OP"
                    ? optimismlogo
                    : asset?.symbol == "MATIC"
                    ? maticlogo
                    : asset?.symbol == "LSK"
                    ? lisklogo
                    : bnblogo
                }
                tokenName={asset?.symbol}
                tokenSymbol={asset?.symbol}
                network={asset?.chain}
                balance={Number(asset?.balance)}
                priceUsd={
                  asset?.symbol == "ETH" ||
                  asset?.symbol == "WETH" ||
                  asset?.symbol == "WSTETH" ||
                  asset?.symbol == "RETH" ||
                  asset?.symbol == "CBETH"
                    ? Number(tokenprices?.ethereum?.usd)
                    : asset?.symbol == "WBTC" ||
                      asset?.symbol == "CBBTC" ||
                      asset?.symbol == "TBTC"
                    ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
                    : asset?.symbol == "ARB"
                    ? Number(tokenprices?.arbitrum?.usd)
                    : asset?.symbol == "BERA" || asset?.symbol == "WBERA"
                    ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
                    : asset?.symbol == "DAI"
                    ? Number(tokenprices?.dai?.usd)
                    : asset?.symbol == "USDC" || asset?.symbol == "USDC.e"
                    ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
                    : asset?.symbol == "USDT"
                    ? Number(tokenprices?.tether?.usd)
                    : asset?.symbol == "OP"
                    ? Number(tokenprices?.optimism?.usd)
                    : asset?.symbol == "MATIC"
                    ? Number(tokenprices && tokenprices["matic-network"]?.usd)
                    : asset?.symbol == "LSK"
                    ? Number(tokenprices?.lisk?.usd)
                    : Number(tokenprices?.binancecoin?.usd)
                }
                onClickHandler={() =>
                  goToAsset(asset?.symbol, asset?.chain, asset?.balance)
                }
              />
            ))
          : displayTokens?.map((asset) => (
              <AssetBalance
                tokenLoading={balancesloading}
                tokenImage={
                  asset?.symbol == "ETH" ||
                  asset?.symbol == "WETH" ||
                  asset?.symbol == "WSTETH" ||
                  asset?.symbol == "RETH" ||
                  asset?.symbol == "CBETH"
                    ? ethlogo
                    : asset?.symbol == "WBTC" ||
                      asset?.symbol == "CBBTC" ||
                      asset?.symbol == "TBTC"
                    ? btclogo
                    : asset?.symbol == "ARB"
                    ? arblogo
                    : asset?.symbol == "BERA" || asset?.symbol == "WBERA"
                    ? beralogo
                    : asset?.symbol == "DAI"
                    ? dailogo
                    : asset?.symbol == "USDC" || asset?.symbol == "USDC.e"
                    ? usdclogo
                    : asset?.symbol == "USDT"
                    ? usdtlogo
                    : asset?.symbol == "OP"
                    ? optimismlogo
                    : asset?.symbol == "MATIC"
                    ? maticlogo
                    : asset?.symbol == "LSK"
                    ? lisklogo
                    : bnblogo
                }
                tokenName={asset?.symbol}
                tokenSymbol={asset?.symbol}
                network={asset?.chain}
                balance={Number(asset?.balance)}
                priceUsd={
                  asset?.symbol == "ETH" ||
                  asset?.symbol == "WETH" ||
                  asset?.symbol == "WSTETH" ||
                  asset?.symbol == "RETH" ||
                  asset?.symbol == "CBETH"
                    ? Number(tokenprices?.ethereum?.usd)
                    : asset?.symbol == "WBTC" ||
                      asset?.symbol == "CBBTC" ||
                      asset?.symbol == "TBTC"
                    ? Number(tokenprices && tokenprices["wrapped-bitcoin"]?.usd)
                    : asset?.symbol == "ARB"
                    ? Number(tokenprices?.arbitrum?.usd)
                    : asset?.symbol == "BERA" || asset?.symbol == "WBERA"
                    ? Number(tokenprices && tokenprices["berachain-bera"]?.usd)
                    : asset?.symbol == "DAI"
                    ? Number(tokenprices?.dai?.usd)
                    : asset?.symbol == "USDC" || asset?.symbol == "USDC.e"
                    ? Number(tokenprices && tokenprices["usd-coin"]?.usd)
                    : asset?.symbol == "USDT"
                    ? Number(tokenprices?.tether?.usd)
                    : asset?.symbol == "OP"
                    ? Number(tokenprices?.optimism?.usd)
                    : asset?.symbol == "MATIC"
                    ? Number(tokenprices && tokenprices["matic-network"]?.usd)
                    : asset?.symbol == "LSK"
                    ? Number(tokenprices?.lisk?.usd)
                    : Number(tokenprices?.binancecoin?.usd)
                }
                onClickHandler={() =>
                  goToAsset(asset?.symbol, asset?.chain, asset?.balance)
                }
              />
            ))}
      </div>
    </Fragment>
  );
};
