import { JSX, useState } from "react";
import { AppDrawer } from "./global/AppDrawer";
import { keyType } from "../utils/api/keys";
import { SHA256 } from "crypto-js";
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
      <div id="secrets" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
        <p className="title" style={{ fontSize: "24px", color: "black", fontWeight: "bold" }}>My Secrets</p>

        {mysecrets.map((secret) => (
          <div
            className="_secret"
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              color: "#000000",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "500" }}>{secret?.name}</span>
            <button
              onClick={() => onShareSecret(secret?.value)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#000000",
                border: "none",
                color: "#ffffff",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Share
            </button>
          </div>
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
  let sharedsecrets = secretsLs.filter((_scret) => _scret.type == "foreign");

  return (
    <div id="secrets" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <p className="title" style={{ fontSize: "24px", color: "black", fontWeight: "bold" }}>Secrets Shared With Me</p>

      {sharedsecrets?.map((secret) => {
        const hashedValue = SHA256(secret?.value).toString(); // Hashing the secret value

        return (
          <div
            className="_secret sharedsecret"
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              color: "#000000",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "20px", fontWeight: "600" }}>{secret?.name}</span>
            <span
              className="sharedfrom"
              style={{
                fontSize: "16px",
                fontWeight: "400",
                color: "#7f7f7f",
              }}
            >
              Shared by: {secret?.owner}
            </span>
            <div
              className="metadata"
              style={{
                marginTop: "10px",
                padding: "10px",
                borderRadius: "8px",
                background: "#000000",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "500",
                wordBreak: "break-all",
                overflow: "hidden",
              }}
            >
           
              <span>{hashedValue}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
