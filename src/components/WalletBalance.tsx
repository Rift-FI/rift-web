import { Fragment, JSX, ReactNode } from "react";
import { Skeleton } from "@mui/material";
import { formatNumber, numberFormat } from "../utils/formatters";
import { colors } from "../constants";
import "../styles/components/walletbalance.scss";

export const WalletBalance = ({
  balancesLoading,
  totalBalanceUsd,
}: {
  balancesLoading: boolean;
  totalBalanceUsd: number;
}): JSX.Element => {
  return (
    <div id="walletbalance">
      <p className="title">Your Total Wallet Balance</p>

      {balancesLoading ? (
        <Skeleton
          variant="text"
          width={80}
          height={40}
          animation="pulse"
          sx={{ backgroundColor: colors.divider }}
        />
      ) : (
        <p className="totalbalance">
          $
          {String(totalBalanceUsd).split(".")[0]?.length - 1 >= 5
            ? numberFormat(totalBalanceUsd)
            : totalBalanceUsd.toFixed(4)}
        </p>
      )}
    </div>
  );
};

export const AssetBalance = ({
  tokenLoading,
  tokenImage,
  tokenName,
  tokenSymbol,
  balance,
  priceUsd,
  network,
  onClickHandler,
}: {
  tokenLoading: boolean;
  tokenImage: string;
  tokenName: string;
  tokenSymbol: string;
  balance: number;
  priceUsd: number;
  network: string;
  onClickHandler: () => void;
}): JSX.Element => {
  const totalbalUsd = balance * priceUsd;

  return (
    <Fragment>
      {tokenLoading ? (
        <Skeleton
          variant="text"
          width="100%"
          height={70}
          animation="pulse"
          sx={{ borderRadius: "0.625rem", backgroundColor: colors.divider }}
        />
      ) : (
        <div className="assetbalance" onClick={onClickHandler}>
          <div className="token">
            <img src={tokenImage} alt={tokenSymbol} />

            <span className="symbol_price">
              <p className="symbol">
                <span>{tokenSymbol}</span>
              </p>
              <p className="price">{network}</p>
            </span>
          </div>

          <div className="balance">
            <p>{formatNumber(balance)}</p>
            <span>${formatNumber(totalbalUsd)}</span>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export const YourAssetBalance = ({
  balance,
  balanceUsd,
}: {
  balance: number;
  balanceUsd: number;
}): JSX.Element => {
  return (
    <div className="yourassetbalance">
      <p className="title">Your Balance</p>

      <p className="balance">
        {balance}
        <span>
          $
          {String(balanceUsd).split(".")[0]?.length - 1 >= 5
            ? numberFormat(balanceUsd)
            : balanceUsd.toFixed(4)}
        </span>
      </p>
    </div>
  );
};

export const WalletAction = ({
  icon,
  text,
  onclick,
}: {
  icon: ReactNode;
  text: string;
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="walletaction" onClick={onclick}>
      <span className="iconctr">{icon}</span>

      <p className="text">{text}</p>
    </div>
  );
};
