import { JSX } from "react";
import { useNavigate } from "react-router";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { keyType } from "../utils/api/keys";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";
import { VerticalDivider } from "./global/Divider";
import poelogo from "../assets/images/icons/poe.png";
import awxlogo from "../assets/images/awx.png";
import polymarketlogo from "../assets/images/icons/polymarket.png";
import "../styles/components/secrets.scss";

export type secrettype = {
  secretVal: string;
};

export type sharedsecrettype = {
  secretVal: string;
  sharedfrom: string;
};

export const MySecrets = ({
  secretsLs,
}: {
  secretsLs: keyType[];
}): JSX.Element => {
  const navigate = useNavigate();

  let mysecrets = secretsLs.filter((_scret) => _scret.type == "own");

  const onUseSecret = (purpose: string, secretvalue: string) => {
    if (purpose == "OPENAI") {
      navigate(`/chatwithbot/${secretvalue}`);
    }
  };

  const onLendSecret = (purpose: string, secretvalue: string) => {
    navigate(`/lend/secret/${purpose}/${secretvalue}`);
  };

  return (
    <>
      <div id="mysecrets">
        {mysecrets.map((secret, idx) => (
          <div className="_secret" key={secret?.name + idx}>
            <div className="secret-info">
              <img
                src={
                  secret?.purpose === "OPENAI" || secret?.purpose === "POE"
                    ? poelogo
                    : secret?.purpose == "POLYMARKET"
                    ? polymarketlogo
                    : awxlogo
                }
                alt="secret-purpose"
                className="secret-logo"
              />

              <p className="secret-details">
                <span>
                  {secret?.purpose === "OPENAI" || secret?.purpose === "POE"
                    ? "AI"
                    : secret?.purpose === "POLYMARKET"
                    ? "Trading"
                    : "Banking"}
                </span>
                {secret?.name}
              </p>
            </div>

            <div className="secret-actions">
              <button
                onClick={() => onUseSecret(secret?.purpose, secret?.value)}
              >
                Use
              </button>

              <VerticalDivider />

              <button
                onClick={() => onLendSecret(secret?.purpose, secret?.value)}
              >
                Lend
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const SharedSecrets = ({
  secretsLs,
}: {
  secretsLs: keyType[];
}): JSX.Element => {
  const navigate = useNavigate();

  const onUseSecret = (purpose: string, secretvalue: string) => {
    if (purpose === "OPENAI" || purpose === "POE") {
      navigate(`/chatwithbot/${secretvalue}`);
    }
  };

  return (
    <div id="sharedsecrets">
      {secretsLs.map((secret, idx) => (
        <div className="_sharedsecret" key={secret.name + secret.owner + idx}>
          <div className="secret_info">
            <img
              src={
                secret?.purpose === "OPENAI" || secret?.purpose === "POE"
                  ? poelogo
                  : secret?.purpose === "POLYMARKET"
                  ? polymarketlogo
                  : awxlogo
              }
              alt="secret-purpose"
              className="secret-logo"
            />

            <span className="sharedfrom">
              <FaIcon
                faIcon={faCircleUser}
                color={colors.textprimary}
                fontsize={12}
              />
              {secret?.owner}
            </span>
          </div>

          <button
            className="usesecret"
            onClick={() => onUseSecret(secret?.purpose, secret?.value)}
          >
            Use
          </button>
        </div>
      ))}
    </div>
  );
};
