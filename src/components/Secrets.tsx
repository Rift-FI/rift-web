import { JSX } from "react";
import { useAppDrawer } from "../hooks/drawer";
import { useSnackbar } from "../hooks/snackbar";
import { keyType } from "../utils/api/keys";
import { Share, User, Copy } from "../assets/icons";
import { colors } from "../constants";
import "../styles/components/secrets.css";

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
  const { openAppDrawerWithKey } = useAppDrawer();

  let mysecrets = secretsLs.filter((_scret) => _scret.type == "own");

  const onShareSecret = (secret: string) => {
    openAppDrawerWithKey("sharekey", secret);
  };

  return (
    <>
      <div id="mysecrets">
        {mysecrets.map((secret, idx) => (
          <button
            className="_secret"
            onClick={() => onShareSecret(secret?.value)}
            key={secret.name + idx}
          >
            <span>{secret?.name.substring(0, 4)}</span>
            <Share color={colors.success} />
          </button>
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
  const { showsuccesssnack } = useSnackbar();

  const copyLink = (_link: string) => {
    navigator.clipboard.writeText(_link);
    showsuccesssnack("Secret link copied to clipboard");
  };

  return (
    <div id="sharedsecrets">
      <p className="title">Shared Secrets</p>

      {secretsLs?.map((secret, idx) => (
        <div className="_sharedsecret" key={secret.name + secret.owner + idx}>
          <div className="owner">
            <span className="secretname">{secret?.name.substring(0, 4)}</span>

            <span className="sharedfrom">
              <User width={14} height={14} color={colors.success} />
              {secret?.owner}
            </span>
          </div>

          <div className="metadata">
            <p className="hash">Link</p>
            <span onClick={() => copyLink(secret.url)} className="value">
              {secret?.url?.substring(0, 22)}..
              <Copy width={16} height={19} color={colors.textsecondary} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
