import { JSX } from "react";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { useAppDrawer } from "../../hooks/drawer";
import { formatUsd } from "../../utils/formatters";
import { secretType } from "../../pages/lend/CreateLendSecret";
import { Return } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import poelogo from "../../assets/images/icons/poe.png";
import polymarketlogo from "../../assets/images/icons/polymarket.png";
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
            secretType == "OPENAI"
              ? poelogo
              : secretType == "POLYMARKET"
              ? polymarketlogo
              : awxlogo
          }
          alt="asset"
        />

        <div className="asset">
          <p className="amount">
            {secretType} <span> {secret}</span>
          </p>

          <span className="owner">
            <FaIcon
              faIcon={faCircleUser}
              color={colors.textprimary}
              fontsize={12}
            />
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
              : secretType == "POLYMARKET"
              ? polymarketlogo
              : awxlogo
          }
          alt="asset"
        />

        <div className="asset">
          <p className="amount">
            {secretType} <span> {secret}</span>
          </p>

          <span className="owner">
            <FaIcon
              faIcon={faCircleUser}
              color={colors.textprimary}
              fontsize={12}
            />
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
