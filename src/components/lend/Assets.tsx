import { JSX } from "react";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import { NFT, User } from "../../assets/icons";
import { colors } from "../../constants";
import { Return } from "../../assets/icons";
import { assetType, assetUtility } from "../../pages/lend/CreateLendAsset";
import "../../styles/components/lend/assets.css";

interface props {
  owner: string;
  asset: assetType;
  amount: number;
  usecase: assetUtility;
  owneryielddist: number;
  receipientyielddist: number;
}

export const BorrowedAsset = ({
  owner,
  asset,
  amount,
  owneryielddist,
  receipientyielddist,
}: props): JSX.Element => {
  return (
    <div className="lentasset">
      <div className="li">
        <div className="asset">
          <img
            src={asset == "BTC" ? btclogo : asset == "ETH" ? ethlogo : usdclogo}
            alt="asset"
          />

          <p className="amount">
            {amount} <span> {asset}</span>
          </p>

          <span className="owner">
            <User width={12} height={12} color={colors.textprimary} />
            {owner}
          </span>
        </div>

        <div className="yields">
          <p className="dist">
            Yield
            <NFT width={10} height={17} color={colors.textprimary} />
          </p>

          <p className="owner">
            @{owner.substring(0, 4) + "..."} keeps&nbsp;
            <span>{owneryielddist}%</span>
          </p>
          <p className="receiver">
            You keep&nbsp;<span>{receipientyielddist}%</span>
          </p>
        </div>
      </div>

      <div className="useasset">
        <span className="util">Use Asset</span>
        <Return color={colors.textprimary} />
      </div>
    </div>
  );
};
