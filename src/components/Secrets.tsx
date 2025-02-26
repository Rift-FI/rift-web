import { JSX } from "react";
import { useNavigate } from "react-router";
import { keyType } from "../utils/api/keys";
import { User } from "../assets/icons/actions";
import { colors } from "../constants";
import poelogo from "../assets/images/icons/poe.png";
import awxlogo from "../assets/images/awx.png";
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

  const onLendSecret = (purpose: string) => {
    navigate(`/lend/secret/${purpose}`);
  };

  return (
    <>
      <div id="mysecrets">
        {mysecrets.map((secret, idx) => (
          <div className="_secret" key={secret?.name + idx}>
            <div className="secret-info">
              <img
                src={
                  secret?.purpose == "OPENAI" || secret?.purpose == "POE"
                    ? poelogo
                    : awxlogo
                }
                alt="secret-purpose"
                className="secret-logo"
              />

              <p className="secret-details">
                <span>{secret?.purpose == "OPENAI" ? "AI" : "Banking"}</span>
                {secret?.name}
              </p>
            </div>

            <div className="secret-actions">
              <button
                onClick={() => onUseSecret(secret?.purpose, secret?.value)}
              >
                Use
              </button>
              <div className="divider"></div>
              <button onClick={() => onLendSecret(secret?.purpose)}>
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
    if (purpose == "OPENAI" || purpose == "POE") {
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
                secret?.purpose == "OPENAI" || secret?.purpose == "POE"
                  ? poelogo
                  : awxlogo
              }
              alt="secret-purpose"
              className="secret-logo"
            />

            <span className="sharedfrom">
              <User width={12} height={12} color={colors.textprimary} />
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
