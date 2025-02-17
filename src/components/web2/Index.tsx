import { useState } from "react"; // Ensure useState is imported
import { MySecrets, SharedSecrets } from "../Secrets";
import "../../styles/components/tabs/web2.scss";

export default function Web2Assets({ mykeys }: any) {
  const [secretsTab, setSecretsTab] = useState<"all" | "me" | "shared">("all");

  let mysecrets = mykeys?.filter(
    (_scret: { type: string }) => _scret.type == "own"
  );
  let sharedsecrets = mykeys?.filter(
    (_scret: { type: string; expired: any }) =>
      _scret.type == "foreign" && !_scret?.expired
  );

  return (
    <div id="secrets_container">
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
