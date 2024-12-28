import { JSX } from "react";
import { Skeleton } from "@mui/material";
import { useAppDrawer } from "../hooks/drawer";
import { keyType } from "../utils/api/keys";
import { Share, User, NFT } from "../assets/icons";
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
  keysloading,
  secretsLs,
}: {
  keysloading: boolean;
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
        {keysloading ? (
          <div className="skeletons">
            <Skeleton
              variant="rectangular"
              width="48%"
              height="3rem"
              animation="wave"
              style={{ borderRadius: "0.25rem" }}
            />
            <Skeleton
              variant="rectangular"
              width="48%"
              height="3rem"
              animation="wave"
              style={{ borderRadius: "0.25rem" }}
            />
            <Skeleton
              variant="rectangular"
              width="48%"
              height="3rem"
              animation="wave"
              style={{ borderRadius: "0.25rem" }}
            />
            <Skeleton
              variant="rectangular"
              width="48%"
              height="3rem"
              animation="wave"
              style={{ borderRadius: "0.25rem" }}
            />
            <Skeleton
              variant="rectangular"
              width="48%"
              height="3rem"
              animation="wave"
              style={{ borderRadius: "0.25rem" }}
            />
            <Skeleton
              variant="rectangular"
              width="48%"
              height="3rem"
              animation="wave"
              style={{ borderRadius: "0.25rem" }}
            />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </>
  );
};

export const SharedSecrets = ({
  secretsLs,
}: {
  secretsLs: keyType[];
}): JSX.Element => {
  const { openAppDrawerWithUrl } = useAppDrawer();

  return (
    <div id="sharedsecrets">
      <p className="title">Shared Secrets</p>

      {!secretsLs ? (
        <div className="skeletons">
          <Skeleton variant="rectangular" width="50%" height="4rem" />
          <Skeleton variant="rectangular" width="50%" height="4rem" />
          <Skeleton variant="rectangular" width="50%" height="4rem" />
          <Skeleton variant="rectangular" width="50%" height="4rem" />
          <Skeleton variant="rectangular" width="50%" height="4rem" />
          <Skeleton variant="rectangular" width="50%" height="4rem" />
        </div>
      ) : (
        secretsLs.map((secret, idx) => (
          <div
            className="_sharedsecret"
            onClick={
              secret?.expired
                ? () => {}
                : () => openAppDrawerWithUrl("consumekey", secret.url)
            }
            key={secret.name + secret.owner + idx}
          >
            <div className="owner">
              <span className="secretname">{secret?.name}</span>

              <span className="sharedfrom">
                <User width={12} height={12} color={colors.textprimary} />
                {secret?.owner}
              </span>
            </div>

            <div className="metadata">
              <span className="hash">
                {secret?.expired ? "EXPIRED" : "Click to access"}
                <NFT color={colors.textprimary} />
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
