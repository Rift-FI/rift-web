import { CSSProperties, JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDrawer } from "../hooks/drawer";
import { useAppDialog } from "../hooks/dialog";
import { keyType, UseOpenAiKey } from "../utils/api/keys";
import { Share, User, NFT, ChatBot } from "../assets/icons";
import { colors } from "../constants";
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
  sx,
}: {
  secretsLs: keyType[];
  sx?: CSSProperties;
}): JSX.Element => {
  const navigate = useNavigate();
  const { openAppDrawerWithUrl } = useAppDrawer();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const decodeChatSecretUrl = async (linkUrl: string) => {
    openAppDialog("loading", "Preparing your chat...");

    const parsedUrl = new URL(linkUrl as string);
    const params = parsedUrl.searchParams;
    const scrtId = params.get("id");
    const scrtNonce = params.get("nonce");

    const { accessToken, conversationID, initialMessage } = await UseOpenAiKey(
      scrtId as string,
      scrtNonce as string
    );

    if (accessToken && conversationID && initialMessage) {
      closeAppDialog();

      navigate(
        `/chat/${conversationID}/${accessToken}/${initialMessage}/${scrtNonce}`
      );
    } else {
      openAppDialog(
        "failure",
        "The secret you are trying to use may have expired. Please try again."
      );
    }
  };

  return (
    <div style={sx} id="sharedsecrets">
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

          <span className="secretutility">
            {secret.purpose == "OPENAI" ? "ChatBot(GPT-4o)" : "AirWallex"}
            {secret.purpose == "OPENAI" ? (
              <ChatBot width={16} height={16} color={colors.textprimary} />
            ) : (
              <NFT width={10} height={17} color={colors.textprimary} />
            )}
          </span>
        </div>
      ))}
    </div>
  );
};
