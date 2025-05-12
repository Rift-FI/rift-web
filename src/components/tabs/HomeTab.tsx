import { Fragment, JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AppBar } from "../AppBar";
import { AssetBalance, WalletAction, WalletBalance } from "../WalletBalance";
import { ArrowDownCircle, ArrowUpCircle, PlusSolid } from "../../assets/icons";
import {
  getEthBalance,
  getBeraBalance,
  getPolygonUsdBalance,
  getBeraUsdcBalance,
} from "../../utils/api/wallet";
import { getUnlockedTokens } from "../../utils/api/airdrop";
import { fetchCoinInfo } from "../../utils/coingecko/markets";
import { getSphrUsdcRate } from "../../utils/api/sphere";
import { colors } from "../../constants";
import spherelogo from "../../assets/images/icons/sphere.png";
import "../../styles/components/tabs/hometab.scss";

export const HomeTab = (): JSX.Element => {
  const navigate = useNavigate();

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

  const { data: beraInfo, isPending: berainfofetching } = useQuery({
    queryKey: ["berachainbera"],
    queryFn: () => fetchCoinInfo("berachain-bera"),
  });
  //
  const { data: sphereusdcrate, isPending: sphereusdcfetching } = useQuery({
    queryKey: ["sphereusdcrate"],
    queryFn: getSphrUsdcRate,
  });

  const berabalUsd =
    Number(berabalance?.data?.balance) *
    Number(beraInfo?.market_data?.current_price?.usd);
  const ethbalUsd =
    Number(ethbalance?.balance) *
    Number(ethereumInfo?.market_data?.current_price?.usd);

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

  const goToSendCryptoMethods = () => {
    navigate("/send-crypto-methods/ETH/send");
  };

  const goToDepositCrypto = () => {
    navigate("/deposit/ETH");
  };

  const goToBuyOptions = () => {
    navigate("/buy/options");
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
          balancesLoading={
            ethbalfetching ||
            berabalfetching ||
            polygonusdcfetching ||
            berausdcbalfetching ||
            unlockedtokensfetching ||
            ethinfofetching ||
            usdcinfofetching ||
            berainfofetching ||
            sphereusdcfetching
          }
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
            icon={<PlusSolid color={colors.textprimary} />}
            text="Buy"
            onclick={goToBuyOptions}
          />

          <WalletAction
            icon={<ArrowDownCircle color={colors.textprimary} />}
            text="Deposit"
            onclick={goToDepositCrypto}
          />
        </div>

        <AssetBalance
          tokenLoading={
            ethbalfetching ||
            berabalfetching ||
            polygonusdcfetching ||
            berausdcbalfetching ||
            unlockedtokensfetching ||
            ethinfofetching ||
            usdcinfofetching ||
            berainfofetching ||
            sphereusdcfetching
          }
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

        <AssetBalance
          tokenLoading={
            ethbalfetching ||
            berabalfetching ||
            polygonusdcfetching ||
            berausdcbalfetching ||
            unlockedtokensfetching ||
            ethinfofetching ||
            usdcinfofetching ||
            berainfofetching ||
            sphereusdcfetching
          }
          tokenImage={beraInfo?.image?.large as string}
          tokenName="WBERA"
          tokenSymbol={beraInfo?.symbol as string}
          dayPriceChange={Number(
            beraInfo?.market_data?.price_change_percentage_24h
          )}
          balance={Number(berabalance?.data?.balance)}
          priceUsd={Number(beraInfo?.market_data?.current_price?.usd)}
          onClickHandler={goToBeraAsset}
        />

        <AssetBalance
          tokenLoading={
            ethbalfetching ||
            berabalfetching ||
            polygonusdcfetching ||
            berausdcbalfetching ||
            unlockedtokensfetching ||
            ethinfofetching ||
            usdcinfofetching ||
            berainfofetching ||
            sphereusdcfetching
          }
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
          tokenLoading={
            ethbalfetching ||
            berabalfetching ||
            polygonusdcfetching ||
            berausdcbalfetching ||
            unlockedtokensfetching ||
            ethinfofetching ||
            usdcinfofetching ||
            berainfofetching ||
            sphereusdcfetching
          }
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

        <AssetBalance
          tokenLoading={
            ethbalfetching ||
            berabalfetching ||
            polygonusdcfetching ||
            berausdcbalfetching ||
            unlockedtokensfetching ||
            ethinfofetching ||
            usdcinfofetching ||
            berainfofetching ||
            sphereusdcfetching
          }
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
      </div>
    </Fragment>
  );
};
