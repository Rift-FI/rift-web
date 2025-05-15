import { Fragment, JSX, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AppBar } from "../AppBar";
import { AssetBalance, WalletAction, WalletBalance } from "../WalletBalance";
import { ArrowDownCircle, ArrowUpCircle, Rotate } from "../../assets/icons";
import {
  getEthBalance,
  getBeraBalance,
  getPolygonUsdBalance,
  getBeraUsdcBalance,
  getBnbBalances,
  getLiskBalances,
  getArbitrumBalances,
} from "../../utils/api/balances";
import { getUnlockedTokens } from "../../utils/api/airdrop";
import { fetchCoinInfo } from "../../utils/coingecko/markets";
import { getSphrUsdcRate } from "../../utils/api/sphere";
import { colors } from "../../constants";
import spherelogo from "../../assets/images/icons/sphere.png";
import "../../styles/components/tabs/hometab.scss";

export const HomeTab = (): JSX.Element => {
  const navigate = useNavigate();

  const [tokensTypeFilter, setTokensTypeFilter] = useState<
    "all" | "native" | "stable" | "wrapped"
  >("all");

  const { data: ethbalance, isPending: ethbalfetching } = useQuery({
    queryKey: ["ethbalance"],
    queryFn: getEthBalance,
  });

  const { data: berabalance, isPending: berabalfetching } = useQuery({
    queryKey: ["berabalance"],
    queryFn: getBeraBalance,
  });

  const { data: polygonusdcbalance, isPending: polygonusdcfetching } = useQuery(
    {
      queryKey: ["polygonusdcbalance"],
      queryFn: getPolygonUsdBalance,
    }
  );

  const { data: berausdcbalance, isPending: berausdcbalfetching } = useQuery({
    queryKey: ["berausdcbalance"],
    queryFn: getBeraUsdcBalance,
  });

  const { data: bnbbalance, isPending: bnbbalfetching } = useQuery({
    queryKey: ["bnbbalances"],
    queryFn: getBnbBalances,
  });

  const { data: liskbalances, isPending: liskbalfetching } = useQuery({
    queryKey: ["liskbalancess"],
    queryFn: getLiskBalances,
  });

  const { data: arbibalances, isPending: arbibalfetching } = useQuery({
    queryKey: ["arbibalancess"],
    queryFn: getArbitrumBalances,
  });

  const { data: unlockedtokens, isPending: unlockedtokensfetching } = useQuery({
    queryKey: ["unlockedTokens"],
    queryFn: getUnlockedTokens,
  });
  //
  const { data: ethereumInfo, isPending: ethinfofetching } = useQuery({
    queryKey: ["ethinfo"],
    queryFn: () => fetchCoinInfo("ethereum"),
  });

  const { data: usdcInfo, isPending: usdcinfofetching } = useQuery({
    queryKey: ["usdcinfo"],
    queryFn: () => fetchCoinInfo("usd-coin"),
  });

  const { data: tetherInfo, isPending: tetherinfofetching } = useQuery({
    queryKey: ["tetherinfo"],
    queryFn: () => fetchCoinInfo("tether"),
  });

  const { data: beraInfo, isPending: berainfofetching } = useQuery({
    queryKey: ["berachainbera"],
    queryFn: () => fetchCoinInfo("berachain-bera"),
  });

  const { data: liskInfo, isPending: liskinfofetching } = useQuery({
    queryKey: ["liskinfo"],
    queryFn: () => fetchCoinInfo("lisk"),
  });

  const { data: bnbInfo, isPending: bnbinfofetching } = useQuery({
    queryKey: ["bnbinfo"],
    queryFn: () => fetchCoinInfo("binancecoin"),
  });
  //
  const { data: sphereusdcrate, isPending: sphereusdcfetching } = useQuery({
    queryKey: ["sphereusdcrate"],
    queryFn: getSphrUsdcRate,
  });

  const isLoadingAggr: boolean =
    ethbalfetching ||
    berabalfetching ||
    polygonusdcfetching ||
    berausdcbalfetching ||
    unlockedtokensfetching ||
    ethinfofetching ||
    usdcinfofetching ||
    berainfofetching ||
    sphereusdcfetching ||
    liskinfofetching ||
    bnbinfofetching ||
    bnbbalfetching ||
    tetherinfofetching ||
    liskbalfetching ||
    arbibalfetching;

  const ethbalUsd =
    Number(ethbalance?.balance) *
    Number(ethereumInfo?.market_data?.current_price?.usd);
  const berabalUsd =
    Number(berabalance?.data?.balance) *
    Number(beraInfo?.market_data?.current_price?.usd);

  localStorage.setItem("berabal", String(berabalance?.data?.balance));
  localStorage.setItem("berabalusd", String(berabalUsd));
  localStorage.setItem(
    "berapriceusd",
    String(beraInfo?.market_data?.current_price?.usd)
  );
  localStorage.setItem("ethbal", String(ethbalance?.balance));
  localStorage.setItem("ethbalusd", String(ethbalUsd));
  localStorage.setItem(
    "ethpriceusd",
    String(ethereumInfo?.market_data?.current_price?.usd)
  );
  localStorage.setItem(
    "polygonusdcbal",
    String(polygonusdcbalance?.data?.balance)
  );
  localStorage.setItem("berausdcbal", String(berausdcbalance?.data?.balance));
  localStorage.setItem(
    "usdcusdprice",
    String(usdcInfo?.market_data?.current_price?.usd)
  );

  const onFilterTokensType = (filter: "native" | "stable" | "wrapped") => {
    if (tokensTypeFilter == filter) {
      setTokensTypeFilter("all");
    } else {
      setTokensTypeFilter(filter);
    }
  };

  const goToSendCryptoMethods = () => {
    navigate("/send-crypto-methods/ETH/send");
  };

  const goToDepositCrypto = () => {
    navigate("/deposit/ETH");
  };

  const goToEthAsset = () => {
    navigate("/eth-asset/send");
  };

  const goToBeraAsset = () => {
    navigate("/bera-asset/send");
  };

  const goToPolygonUsdcAsset = () => {
    navigate("/polygon-usdc-asset/send");
  };

  const goToBeraUsdcAsset = () => {
    navigate("/bera-usdc-asset/send");
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
          balancesLoading={isLoadingAggr}
          ethBalanceUsd={
            Number(ethbalance?.balance) *
              Number(ethereumInfo?.market_data?.current_price?.usd) || 0
          }
          beraBalanceUsd={
            Number(berabalance?.data?.balance) *
              Number(beraInfo?.market_data?.current_price?.usd) || 0
          }
          polygonUsdcBalanceUsd={
            Number(polygonusdcbalance?.data?.balance) *
              Number(usdcInfo?.market_data?.current_price?.usd) || 0
          }
          beraUsdcbalanceUsd={
            Number(berausdcbalance?.data?.balance) *
              Number(usdcInfo?.market_data?.current_price?.usd) || 0
          }
          sphereBalanceUsd={
            Number(unlockedtokens?.amount) *
              Number(sphereusdcrate?.data?.currentRate) *
              Number(usdcInfo?.market_data?.current_price?.usd) || 0
          }
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
            onclick={() => {}}
          />
        </div>

        <div className="filters">
          <button
            onClick={() => onFilterTokensType("native")}
            className={tokensTypeFilter == "native" ? "active" : ""}
          >
            Native Tokens
          </button>

          <button
            onClick={() => onFilterTokensType("stable")}
            className={tokensTypeFilter == "stable" ? "active" : ""}
          >
            Stablecoins
          </button>
          <button
            onClick={() => onFilterTokensType("wrapped")}
            className={tokensTypeFilter == "wrapped" ? "active" : ""}
          >
            Wrapped
          </button>
        </div>

        {(tokensTypeFilter == "all" || tokensTypeFilter == "native") && (
          <AssetBalance
            tokenLoading={isLoadingAggr}
            tokenImage={ethereumInfo?.image?.large as string}
            tokenName={ethereumInfo?.name as string}
            tokenSymbol={ethereumInfo?.symbol as string}
            dayPriceChange={Number(
              ethereumInfo?.market_data?.price_change_percentage_24h
            )}
            balance={Number(ethbalance?.balance)}
            priceUsd={Number(ethereumInfo?.market_data?.current_price?.usd)}
            onClickHandler={goToEthAsset}
          />
        )}

        {(tokensTypeFilter == "all" ||
          tokensTypeFilter == "native" ||
          tokensTypeFilter == "wrapped") && (
          <AssetBalance
            tokenLoading={isLoadingAggr}
            tokenImage={beraInfo?.image?.large as string}
            tokenName="Berachain"
            tokenSymbol="WBERA"
            dayPriceChange={Number(
              beraInfo?.market_data?.price_change_percentage_24h
            )}
            balance={Number(berabalance?.data?.balance)}
            priceUsd={Number(beraInfo?.market_data?.current_price?.usd)}
            onClickHandler={goToBeraAsset}
          />
        )}

        {(tokensTypeFilter == "all" || tokensTypeFilter == "stable") && (
          <Fragment>
            <AssetBalance
              tokenLoading={isLoadingAggr}
              tokenImage={usdcInfo?.image?.large as string}
              tokenName="USDC (Polygon)"
              tokenSymbol={usdcInfo?.symbol as string}
              dayPriceChange={Number(
                usdcInfo?.market_data?.price_change_percentage_24h
              )}
              balance={Number(polygonusdcbalance?.data?.balance)}
              priceUsd={Number(usdcInfo?.market_data?.current_price?.usd)}
              onClickHandler={goToPolygonUsdcAsset}
            />

            <AssetBalance
              tokenLoading={isLoadingAggr}
              tokenImage={usdcInfo?.image?.large as string}
              tokenName="USDC (Berachain)"
              tokenSymbol="USDC.e"
              dayPriceChange={Number(
                usdcInfo?.market_data?.price_change_percentage_24h
              )}
              balance={Number(berausdcbalance?.data?.balance)}
              priceUsd={Number(usdcInfo?.market_data?.current_price?.usd)}
              onClickHandler={goToBeraUsdcAsset}
            />
          </Fragment>
        )}

        {(tokensTypeFilter == "all" || tokensTypeFilter == "native") && (
          <AssetBalance
            tokenLoading={isLoadingAggr}
            tokenImage={bnbInfo?.image?.large as string}
            tokenName={bnbInfo?.name as string}
            tokenSymbol={bnbInfo?.symbol as string}
            dayPriceChange={Number(
              bnbInfo?.market_data?.price_change_percentage_24h
            )}
            balance={Number(bnbbalance?.balances?.BNB)}
            priceUsd={Number(bnbInfo?.market_data?.current_price?.usd)}
            onClickHandler={() => {}}
          />
        )}

        {(tokensTypeFilter == "all" || tokensTypeFilter == "stable") && (
          <Fragment>
            <AssetBalance
              tokenLoading={isLoadingAggr}
              tokenImage={usdcInfo?.image?.large as string}
              tokenName="USDC (BNB)"
              tokenSymbol={usdcInfo?.symbol as string}
              dayPriceChange={Number(
                usdcInfo?.market_data?.price_change_percentage_24h
              )}
              balance={Number(bnbbalance?.balances?.USDC)}
              priceUsd={Number(usdcInfo?.market_data?.current_price?.usd)}
              onClickHandler={() => {}}
            />

            <AssetBalance
              tokenLoading={isLoadingAggr}
              tokenImage={tetherInfo?.image?.large as string}
              tokenName="USDT (BNB)"
              tokenSymbol={tetherInfo?.symbol as string}
              dayPriceChange={Number(
                tetherInfo?.market_data?.price_change_percentage_24h
              )}
              balance={Number(bnbbalance?.balances?.USDT)}
              priceUsd={Number(tetherInfo?.market_data?.current_price?.usd)}
              onClickHandler={() => {}}
            />
          </Fragment>
        )}

        {(tokensTypeFilter == "all" || tokensTypeFilter == "native") && (
          <AssetBalance
            tokenLoading={isLoadingAggr}
            tokenImage={liskInfo?.image?.large as string}
            tokenName={liskInfo?.name as string}
            tokenSymbol={liskInfo?.symbol as string}
            dayPriceChange={Number(
              liskInfo?.market_data?.price_change_percentage_24h
            )}
            balance={Number(liskbalances?.balances?.LSK)}
            priceUsd={Number(liskInfo?.market_data?.current_price?.usd)}
            onClickHandler={() => {}}
          />
        )}

        {(tokensTypeFilter == "all" || tokensTypeFilter == "stable") && (
          <Fragment>
            <AssetBalance
              tokenLoading={isLoadingAggr}
              tokenImage={usdcInfo?.image?.large as string}
              tokenName="USDC (Lisk)"
              tokenSymbol={usdcInfo?.symbol as string}
              dayPriceChange={Number(
                usdcInfo?.market_data?.price_change_percentage_24h
              )}
              balance={Number(liskbalances?.balances?.USDC)}
              priceUsd={Number(usdcInfo?.market_data?.current_price?.usd)}
              onClickHandler={() => {}}
            />

            <AssetBalance
              tokenLoading={isLoadingAggr}
              tokenImage={tetherInfo?.image?.large as string}
              tokenName="USDT (Lisk)"
              tokenSymbol={tetherInfo?.symbol as string}
              dayPriceChange={Number(
                tetherInfo?.market_data?.price_change_percentage_24h
              )}
              balance={Number(liskbalances?.balances?.USDT)}
              priceUsd={Number(tetherInfo?.market_data?.current_price?.usd)}
              onClickHandler={() => {}}
            />
          </Fragment>
        )}

        {(tokensTypeFilter == "all" || tokensTypeFilter == "native") && (
          <AssetBalance
            tokenLoading={isLoadingAggr}
            tokenImage={ethereumInfo?.image?.large as string}
            tokenName="ETH (Arbitrum)"
            tokenSymbol={ethereumInfo?.symbol as string}
            dayPriceChange={Number(
              ethereumInfo?.market_data?.price_change_percentage_24h
            )}
            balance={Number(arbibalances?.balances?.ETH)}
            priceUsd={Number(ethereumInfo?.market_data?.current_price?.usd)}
            onClickHandler={() => {}}
          />
        )}

        {(tokensTypeFilter == "all" || tokensTypeFilter == "stable") && (
          <Fragment>
            <AssetBalance
              tokenLoading={isLoadingAggr}
              tokenImage={usdcInfo?.image?.large as string}
              tokenName="USDC (Arbitrum)"
              tokenSymbol={usdcInfo?.symbol as string}
              dayPriceChange={Number(
                usdcInfo?.market_data?.price_change_percentage_24h
              )}
              balance={Number(arbibalances?.balances?.USDC)}
              priceUsd={Number(usdcInfo?.market_data?.current_price?.usd)}
              onClickHandler={() => {}}
            />

            <AssetBalance
              tokenLoading={isLoadingAggr}
              tokenImage={tetherInfo?.image?.large as string}
              tokenName="USDT (Arbitrum)"
              tokenSymbol={tetherInfo?.symbol as string}
              dayPriceChange={Number(
                tetherInfo?.market_data?.price_change_percentage_24h
              )}
              balance={Number(arbibalances?.balances?.USDT)}
              priceUsd={Number(tetherInfo?.market_data?.current_price?.usd)}
              onClickHandler={() => {}}
            />
          </Fragment>
        )}

        {(tokensTypeFilter == "all" || tokensTypeFilter == "native") && (
          <AssetBalance
            tokenLoading={isLoadingAggr}
            tokenImage={spherelogo}
            tokenName="Sphere (Non-Transferable)"
            tokenSymbol="SPHR"
            dayPriceChange={0}
            balance={Number(unlockedtokens?.amount)}
            priceUsd={
              Number(sphereusdcrate?.data?.currentRate) *
              Number(usdcInfo?.market_data?.current_price?.usd)
            }
            onClickHandler={() => {}}
          />
        )}
      </div>
    </Fragment>
  );
};
