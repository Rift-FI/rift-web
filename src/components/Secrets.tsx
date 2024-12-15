import { JSX, useState } from "react";
import { SHA256 } from "crypto-js";
import { keyType } from "../utils/api/keys";
import { AppDrawer } from "./global/AppDrawer";
import { Share, User } from "../assets/icons";
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
  const [appDrawerOpen, setAppDrawerOpen] = useState<boolean>(false);
  const [shareSecret, setShareSecret] = useState<string>("");

  let mysecrets = secretsLs.filter((_scret) => _scret.type == "own");

  const onShareSecret = (secret: string) => {
    setAppDrawerOpen(true);
    setShareSecret(secret);
  };

  return (
    <>
      <div id="mysecrets">
        {mysecrets.map((secret) => (
          <button
            className="_secret"
            onClick={() => onShareSecret(secret?.value)}
            key={secret.name}
          >
            <span>{secret?.name.substring(0, 4)}</span>
            <Share color={colors.success} />
          </button>
        ))}
      </div>

      <AppDrawer
        action="sharekey"
        drawerOpen={appDrawerOpen}
        setDrawerOpen={setAppDrawerOpen}
        keyToshare={shareSecret}
      />
    </>
  );
};

export const SharedSecrets = ({
  secretsLs,
}: {
  secretsLs: keyType[];
}): JSX.Element => {
  return (
    <div id="sharedsecrets">
      <p className="title">Shared Secrets</p>

      {secretsLs?.map((secret) => (
        <div className="_sharedsecret" key={secret.name + secret.owner}>
          <div className="owner">
            <span className="secretname">{secret?.name.substring(0, 4)}</span>

            <span className="sharedfrom">
              <User width={14} height={14} color={colors.success} />
              {secret?.owner}
            </span>
          </div>

          <div className="metadata">
            <p className="hash">Hash</p>
            <p className="value">{SHA256(secret?.value).toString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
