import { useState } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { useQueryClient } from "@tanstack/react-query";
import { importKey } from "../../utils/api/keys";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDialog } from "../../hooks/dialog";
import { MySecrets, SharedSecrets } from "../Secrets";
import claimgpt from "../../assets/images/gpt.png";
import "../../styles/components/tabs/web2.scss";

export default function Web2Assets({ mykeys }: any) {
  const queryclient = useQueryClient();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [secretsTab, setSecretsTab] = useState<"all" | "me" | "shared">("all");

  let mysecrets = mykeys?.filter(
    (_scret: { type: string }) => _scret.type == "own"
  );
  let sharedsecrets = mykeys?.filter(
    (_scret: { type: string; expired: any }) =>
      _scret.type == "foreign" && !_scret?.expired
  );
  const claimedgpt = localStorage.getItem("claimedgpt");

  const onClaimGptAccess = async () => {
    openAppDialog("loading", "Claiming your free GPT4 access, please wait...");

    const importedKey =
      "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";
    let token: string | null = localStorage.getItem("token");

    let { initData } = retrieveLaunchParams();

    const { isOk } = await importKey(
      token as string,
      importedKey.substring(0, 4),
      "own",
      importedKey,
      initData?.user?.username as string,
      "OPENAI"
    );

    if (isOk) {
      localStorage.setItem("claimedgpt", "true");
      showsuccesssnack("Successfully claimed your free GPT4 Access");
      queryclient.invalidateQueries({ queryKey: ["secrets"] });
      closeAppDialog();
    } else {
      showerrorsnack("An unexpected error occurred");
    }
  };

  return (
    <div id="secrets_container">
      {claimedgpt == null && (
        <div onClick={onClaimGptAccess} className="claim-gpt">
          <span>Claim your free GPT4 Access</span>
          <img src={claimgpt} alt="gpt" />
        </div>
      )}

      <div id="secrets_import">
        <p>Web2 Assets</p>
      </div>

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
          My Secrets ({mysecrets?.length || 0})
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
        <>
          <br />
          <SharedSecrets
            sx={{ marginTop: "-0.75rem" }}
            secretsLs={sharedsecrets}
          />
        </>
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
}
