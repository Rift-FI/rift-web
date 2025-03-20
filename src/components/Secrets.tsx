import { JSX } from "react";
import { useNavigate } from "react-router";
import { faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import { useAppDrawer } from "../hooks/drawer";
import { useAppDialog } from "../hooks/dialog";
import { keyType, UseOpenAiKey } from "../utils/api/keys";
import { VerticalDivider } from "./global/Divider";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";
import poelogo from "../assets/images/icons/poe.png";
import awxlogo from "../assets/images/awx.png";
import polymarketlogo from "../assets/images/icons/polymarket.png";
import "../styles/components/secrets.scss";

export const MySecrets = ({
  secretsLs,
}: {
  secretsLs: keyType[];
}): JSX.Element => {
  const navigate = useNavigate();
  const { openAppDrawerWithKey } = useAppDrawer();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const decodeOpenAiKey = async (scrtId: string, scrtNonce: string) => {
    openAppDialog("loading", "Preparing your chat...");

    const { response, accessToken, conversationId } = await UseOpenAiKey(
      scrtId as string,
      scrtNonce as string
    );

    if (response && accessToken && conversationId) {
      closeAppDialog();

      navigate(
        `/chat/${conversationId}/${accessToken}/${response}/${scrtNonce}`
      );
    } else {
      openAppDialog(
        "failure",
        "Failed to start a conversation, please try again !"
      );
    }
  };

  const onUseSecret = (
    purpose: string,
    secretid: string,
    secretnonce: string
  ) => {
    if (purpose === "OPENAI") {
      decodeOpenAiKey(secretid, secretnonce);
    } else if (purpose === "AIRWALLEX") {
      openAppDrawerWithKey(
        "consumeawxkey",
        secretid as string,
        secretnonce as string
      ); //keyToshare: secretid, purpose: secretnonce
    } else {
    }
  };

  const onLendSecret = (purpose: string, secretvalue: string) => {
    navigate(`/lend/secret/${purpose}/${secretvalue}`);
  };

  return (
    <>
      <div id="mysecrets">
        {secretsLs?.map((secret, idx) => (
          <div className="_secret" key={secret?.value?.substring(0, 4) + idx}>
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

              <div
                className="secret-details"
                data-key={secret?.value?.substring(0, 4)}
              >
                <span>
                  {secret?.purpose === "OPENAI" || secret?.purpose === "POE"
                    ? "AI"
                    : secret?.purpose === "POLYMARKET"
                    ? "Trading"
                    : "Banking"}
                </span>
              </div>
            </div>

            <div className="secret-actions">
              <button
                onClick={() =>
                  onUseSecret(
                    secret?.purpose,
                    secret?.id,
                    secret?.nonce as string
                  )
                }
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
  const { openAppDrawerWithKey } = useAppDrawer();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const decodeOpenAiKey = async (scrtId: string, scrtNonce: string) => {
    openAppDialog("loading", "Preparing your chat...");

    const { response, accessToken, conversationId } = await UseOpenAiKey(
      scrtId as string,
      scrtNonce as string
    );

    if (response && accessToken && conversationId) {
      closeAppDialog();

      navigate(`/chat/${conversationId}/${accessToken}/${scrtNonce}`);
    } else {
      openAppDialog(
        "failure",
        "Failed to start a conversation, please try again !"
      );
    }
  };

  const onUseSecret = (purpose: string, secreturl: string) => {
    const urlObj = new URL(secreturl);

    const id = urlObj.searchParams.get("id");
    const nonce = urlObj.searchParams.get("nonce");

    if (purpose === "OPENAI" || purpose === "POE") {
      decodeOpenAiKey(id as string, nonce as string);
    } else if (purpose === "AIRWALLEX") {
      openAppDrawerWithKey("consumeawxkey", id as string, nonce as string); //keyToshare: secretid, purpose: secretnonce
    } else {
    }
  };

  const onGetSecret = (
    paysecretreceiver: string,
    paysecretid: string,
    paysecretnonce: string,
    paysecretpurpose: string,
    paysecretamount: string,
    paysecretcurrency: string
  ) => {
    localStorage.setItem("paysecretreceiver", paysecretreceiver);
    localStorage.setItem("paysecretid", paysecretid);
    localStorage.setItem("paysecretnonce", paysecretnonce);
    localStorage.setItem("paysecretpurpose", paysecretpurpose);
    localStorage.setItem("paysecretamount", paysecretamount);
    localStorage.setItem("paysecretcurrency", paysecretcurrency);
    localStorage.setItem("prev_page", "/web2");

    navigate("/claimlendkey");
  };

  return (
    <div id="sharedsecrets">
      {secretsLs.map((secret) => (
        <div className="_sharedsecret" key={secret?.id}>
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

            <p className="sharedfrom">
              <FaIcon
                faIcon={secret?.locked ? faLock : faLockOpen}
                color={secret?.locked ? colors.danger : colors.success}
                fontsize={14}
              />
              <span>{secret?.value?.substring(0, 4)}</span>
            </p>
          </div>

          <button
            className="usesecret"
            onClick={() =>
              secret?.locked
                ? onGetSecret(
                    secret?.email,
                    secret?.id,
                    secret?.nonce as string,
                    secret?.purpose,
                    String(secret?.paymentValue),
                    secret?.paymentCurrency
                  )
                : onUseSecret(secret?.purpose, secret?.url as string)
            }
          >
            {secret?.locked ? "Get Key" : "Use"}
          </button>
        </div>
      ))}
    </div>
  );
};
