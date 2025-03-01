import { JSX } from "react";
import { useAppDrawer } from "../../hooks/drawer";
import { formatUsd } from "../../utils/formatters";
import { secretType } from "../../pages/lend/CreateLendSecret";
import { User, Return } from "../../assets/icons/actions";
import { colors } from "../../constants";
import poelogo from "../../assets/images/icons/poe.png";
import stratosphere from "../../assets/images/sphere.jpg";
import awxlogo from "../../assets/images/awx.png";
import "../../styles/components/lend/secrets.scss";

interface borrowedSecretProps {
  secret: string;
  secretType: secretType;
  owner: string;
  secretFee: number;
}

interface lentSecretProps {
  secret: string;
  secretType: secretType;
  borrower: string;
  secretFee: number;
}

export const BorrowedSecret = ({
  secret,
  secretType,
  owner,
  secretFee,
}: borrowedSecretProps): JSX.Element => {
  return (
    <div className="borrowedsecret">
      <div className="li">
        <img
          src={
            secretType == "POE"
              ? poelogo
              : secretType == "SPHERE"
              ? stratosphere
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

export const LentSecret = ({
  secret,
  secretType,
  borrower,
  secretFee,
}: lentSecretProps): JSX.Element => {
  const { openAppDrawerWithKey } = useAppDrawer();

  return (
    <div
      className="borrowedsecret"
      onClick={() =>
        openAppDrawerWithKey("revokesecretaccess", secretType, secretType)
      }
    >
      <div className="li">
        <img
          src={
            secretType == "POE"
              ? poelogo
              : secretType == "SPHERE"
              ? stratosphere
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
            {borrower}
          </span>

          <span className="fee">{formatUsd(secretFee)}</span>
        </div>
      </div>

      <div className="useasset">
        <span className="util">Revoke Access</span>
      </div>
    </div>
  );
};
