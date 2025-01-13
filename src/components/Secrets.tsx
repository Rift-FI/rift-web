import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDrawer } from "../hooks/drawer";
import { useSnackbar } from "../hooks/snackbar";
import { keyType, UseOpenAiKey } from "../utils/api/keys";
import { Share, User, NFT, ChatBot } from "../assets/icons";
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
  const navigate = useNavigate();

  let mysecrets = secretsLs.filter((_scret) => _scret.type == "own");

  const onShareSecret = (secret: string, purpose: string) => {
    navigate(`/sharesecret/${secret}/${purpose}`);
  };

  return (
    <>
      <div id="mysecrets">
        {mysecrets.map((secret, idx) => (
          <button
            className="_secret"
            onClick={() => onShareSecret(secret?.value, secret?.purpose)}
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
  const navigate = useNavigate();
  const { openAppDrawerWithUrl } = useAppDrawer();
  const { showsuccesssnack } = useSnackbar();

  const decodeChatSecretUrl = async (secretUrl: string) => {
    showsuccesssnack("Preparing chat, please wait...");

    const parsedUrl = new URL(secretUrl as string);
    const params = parsedUrl.searchParams;
    const scrtId = params.get("id");
    const scrtNonce = params.get("nonce");

    const { accessToken, conversationID, initialMessage } = await UseOpenAiKey(
      scrtId as string,
      scrtNonce as string
    );

    navigate(
      `/chat/${conversationID}/${accessToken}/${initialMessage}/${scrtNonce}`
    );
  };

  return (
    <div id="sharedsecrets">
      <p className="title">Shared Secrets</p>

      {secretsLs.map((secret, idx) => (
        <div
          className="_sharedsecret"
          onClick={
            secret?.expired
              ? () => {}
              : secret.purpose == "OPENAI"
              ? () => decodeChatSecretUrl(secret?.url)
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
              {secret.purpose == "OPENAI" ? "AI ChatBot" : "AirWallex"}
              {secret.purpose == "OPENAI" ? (
                <ChatBot color={colors.textprimary} />
              ) : (
                <NFT color={colors.textprimary} />
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
