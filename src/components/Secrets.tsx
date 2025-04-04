import { JSX } from "react";
import { useNavigate } from "react-router";
import {
  faLock,
  faLockOpen,
  faPlay,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { useAppDrawer } from "../hooks/drawer";
import { useAppDialog } from "../hooks/dialog";
import { useSnackbar } from "../hooks/snackbar";
import { keyType, UseOpenAiKey } from "../utils/api/keys";
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
  const { showerrorsnack } = useSnackbar();

  const onUseSecret = (
    purpose: string,
    _secretid: string,
    _secretnonce: string,
    secretvalue: string
  ) => {
    if (purpose === "OPENAI") {
      navigate(`/chatbot/${secretvalue}`);
    } else if (purpose === "AIRWALLEX") {
      showerrorsnack("Feature coming soon...");
    } else {
      /* empty */
    }
  };

  const onLendSecret = (purpose: string, secretvalue: string) => {
    navigate(`/lend/secret/${purpose}/${secretvalue}`);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-2">
        {secretsLs?.map((secret, idx) => (
          <div
            className="rounded-2xl bg-[#1a1a1a] border border-[#212121] p-4 my-2"
            key={secret?.value?.substring(0, 4) + idx}
          >
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
                className="w-10 h-10 rounded-full object-cover"
              />

              <div className="my-2" data-key={secret?.value?.substring(0, 4)}>
                <span className="text-[#f6f7f9]">
                  {secret?.purpose === "OPENAI" || secret?.purpose === "POE"
                    ? "OpenAI API Key"
                    : secret?.purpose === "POLYMARKET"
                    ? "Polymarket API"
                    : "AirWallex Key"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              <button
                className="bg-[#212121] text-sm text-[#f6f7f9] p-2 rounded-md w-full mx-auto flex items-center justify-center gap-2"
                onClick={() =>
                  onUseSecret(
                    secret?.purpose,
                    secret?.id,
                    secret?.nonce as string,
                    secret?.value
                  )
                }
              >
                <span className="text-sm">Use</span>
              </button>

              <button
                className="bg-[#212121] border border-[#ffb386] text-sm text-[#f6f7f9] p-2 rounded-md w-full mx-auto flex items-center justify-center gap-2"
                onClick={() => onLendSecret(secret?.purpose, secret?.value)}
              >
                <span className="text-[#ffb386] text-sm">Lend</span>
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
      openAppDrawerWithKey("consumeawxkey", id as string, nonce as string);
    } else {
      /* empty */
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

            <div className="sharedfrom">
              <FaIcon
                faIcon={secret?.locked ? faLock : faLockOpen}
                color={secret?.locked ? colors.danger : colors.success}
                fontsize={14}
              />
              <span>
                {secret?.purpose === "OPENAI" || secret?.purpose === "POE"
                  ? "OpenAI Key"
                  : secret?.purpose === "POLYMARKET"
                  ? "Polymarket API"
                  : "AirWallex Key"}
                - {secret?.value?.substring(0, 4)}
              </span>
            </div>
          </div>

          <button
            className={`action-button ${
              secret?.locked ? "get-button" : "use-button"
            }`}
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
            <FaIcon
              faIcon={secret?.locked ? faKey : faPlay}
              color="#ffffff"
              fontsize={12}
            />
            <span>{secret?.locked ? "Get Key" : "Use"}</span>
          </button>
        </div>
      ))}
    </div>
  );
};
