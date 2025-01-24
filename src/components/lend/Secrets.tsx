import { JSX } from "react";
import { formatUsd } from "../../utils/formatters";
import { secretType } from "../../pages/lend/CreateLendSecret";
import { User, Return } from "../../assets/icons";
import { colors } from "../../constants";
import poelogo from "../../assets/images/icons/poe.png";
import openailogo from "../../assets/images/openai-alt.png";
import awxlogo from "../../assets/images/awx.png";
import "../../styles/components/lend/secrets.css";

interface props {
  secret: string;
  secretType: secretType;
  owner: string;
  secretFee: number;
}

export const BorrowedSecret = ({
  secret,
  secretType,
  owner,
  secretFee,
}: props): JSX.Element => {
  return (
    <div className="borrowedsecret">
      <div className="li">
        <img
          src={
            secretType == "POE"
              ? poelogo
              : secretType == "OPENAI"
              ? openailogo
              : awxlogo
          }
          alt="asset"
        />

        <div className="asset">
          <p className="amount">
            {secretType} <span> {secret}</span>
          </p>

          <span className="owner">
            <User width={12} height={12} color={colors.textprimary} />
            {owner}
          </span>

          <span className="fee">{formatUsd(secretFee)}</span>
        </div>
      </div>

      <div className="useasset">
        <span className="util">Use Secret</span>
        <Return color={colors.textprimary} />
      </div>
    </div>
  );
};
