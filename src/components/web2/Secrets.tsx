import { JSX, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { importKey, keyType } from "../../utils/api/keys";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDialog } from "../../hooks/dialog";
import { MySecrets, SharedSecrets } from "../Secrets";
import claimgpt from "../../assets/images/openai-alt.png";
import "../../styles/components/web2/secrets.scss";

interface props {
  mykeys: keyType[];
}

export const Secrets = ({ mykeys }: props): JSX.Element => {
  const queryclient = useQueryClient();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [secretsTab, setSecretsTab] = useState<"all" | "me" | "shared">("all");

  let mysecrets = mykeys?.filter((_key) => _key?.nonce == null);
  let sharedsecrets = mykeys?.filter((_key) => _key?.nonce !== null);

  const claimedfreegpt = localStorage.getItem("claimedfreegpt");

  const onClaimGptAccess = async () => {
    openAppDialog("loading", "Claiming your free GPT4 access, please wait...");

    const importedKey =
      "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";

    const { isOk } = await importKey(importedKey, "OPENAI");

    if (isOk) {
      localStorage.setItem("claimedfreegpt", "true");
      showsuccesssnack("Successfully claimed your free GPT4 Access");
      queryclient.invalidateQueries({ queryKey: ["secrets"] });
      closeAppDialog();
    } else {
      showerrorsnack("An unexpected error occurred");
    }
  };

  return (
    <div id="secrets_container">
      {claimedfreegpt == null && (
        <div onClick={onClaimGptAccess} className="claim-gpt">
          <span>Claim your free GPT-4o Key</span>
          <img src={claimgpt} alt="gpt" />
        </div>
      )}

      <div className="secret_tabs">
        <button
          onClick={() => setSecretsTab("all")}
          className={secretsTab === "all" ? "select_tab" : ""}
        >
          All ({(mysecrets?.length || 0) + (sharedsecrets?.length || 0)})
        </button>
        <button
          onClick={() => setSecretsTab("me")}
          className={secretsTab === "me" ? "select_tab" : ""}
        >
          My Keys ({mysecrets?.length || 0})
        </button>
        <button
          onClick={() => setSecretsTab("shared")}
          className={secretsTab === "shared" ? "select_tab" : ""}
        >
          Shared ({sharedsecrets?.length || 0})
        </button>
      </div>

      {secretsTab === "all" &&
        mysecrets?.length === 0 &&
        sharedsecrets?.length === 0 && (
          <p className="nokeys">All your imported secrets and shared secrets</p>
        )}

      {secretsTab === "all" && mysecrets?.length > 0 && (
        <MySecrets secretsLs={mykeys} />
      )}

      {secretsTab === "all" && sharedsecrets?.length > 0 && (
        <SharedSecrets secretsLs={sharedsecrets} />
      )}

      {secretsTab === "me" &&
        (mysecrets?.length > 0 ? (
          <MySecrets secretsLs={mykeys} />
        ) : (
          <p className="nokeys">
            Import Your Keys & Secrets to see them listed here <br />
            You can also share your keys
          </p>
        ))}

      {secretsTab === "shared" &&
        (sharedsecrets?.length > 0 ? (
          <SharedSecrets secretsLs={sharedsecrets} />
        ) : (
          <p className="nokeys">
            Keys and secrets you receive appear here <br />
            Expired secrets will not be shown
          </p>
        ))}
    </div>
  );
};
