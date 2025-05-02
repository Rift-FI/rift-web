import { JSX, useState } from "react";
import {
  faShieldAlt,
  faHandHoldingUsd,
  faKey,
  faShare,
  faInfoCircle,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { keyType } from "../../utils/api/keys";
import { MySecrets, SharedSecrets } from "../Secrets";
import { FaIcon } from "../../assets/faicon";
import "../../styles/components/web2/secrets.scss";

interface props {
  mykeys: keyType[];
}

export const Secrets = ({ mykeys }: props): JSX.Element => {
  const [secretsTab, setSecretsTab] = useState<"all" | "me" | "shared">("all");

  const mysecrets = mykeys?.filter((_key) => _key?.nonce == null);
  const sharedsecrets = mykeys?.filter((_key) => _key?.nonce !== null);

  return (
    <div id="secrets_container">
      <div className="info-banner">
        <div className="banner-features">
          <div className="feature">
            <FaIcon faIcon={faShieldAlt} color="#ffb386" fontsize={14} />
            <span>Secured with Shamir Secret Sharing</span>
          </div>
          <div className="feature">
            <FaIcon faIcon={faHandHoldingUsd} color="#ffb386" fontsize={14} />
            <span>Monetize by lending to others</span>
          </div>
          <div className="feature">
            <FaIcon faIcon={faLock} color="#ffb386" fontsize={14} />
            <span>Lend permission, not actual keys</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center my-4">
        <button
          onClick={() => setSecretsTab("all")}
          className={
            secretsTab === "all"
              ? "bg-[#ffb386] text-[#000] px-4 py-2 rounded-md text-sm"
              : "px-4 py-2 rounded-md text-sm text-[#f6f7f9]"
          }
        >
          All Keys ({(mysecrets?.length || 0) + (sharedsecrets?.length || 0)})
        </button>
        <button
          onClick={() => setSecretsTab("me")}
          className={
            secretsTab === "me"
              ? "bg-[#ffb386] text-[#000] px-4 py-2 rounded-md text-sm"
              : "px-4 py-2 rounded-md text-sm text-[#f6f7f9]"
          }
        >
          My Keys ({mysecrets?.length || 0})
        </button>
        <button
          onClick={() => setSecretsTab("shared")}
          className={
            secretsTab === "shared"
              ? "bg-[#ffb386] text-[#000] px-4 py-2 rounded-md text-sm"
              : "px-4 py-2 rounded-md text-sm text-[#f6f7f9]"
          }
        >
          Shared ({sharedsecrets?.length || 0})
        </button>
      </div>

      {secretsTab === "all" &&
        mysecrets?.length === 0 &&
        sharedsecrets?.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <FaIcon faIcon={faInfoCircle} color="#3a7bd5" fontsize={24} />
            </div>
            <p>
              Import API keys to securely store and monetize them through our
              decentralized network
            </p>
          </div>
        )}

      {secretsTab === "all" && mysecrets?.length > 0 && (
        <>
          <div className="section-header">
            <h4>My API Keys</h4>
            <p>
              Your imported keys that you can use, lend, or set as collateral
            </p>
          </div>
          <MySecrets secretsLs={mykeys} />
        </>
      )}

      {secretsTab === "all" && sharedsecrets?.length > 0 && (
        <>
          <div className="section-header">
            <h4>Shared With Me</h4>
            <p>API keys that others have shared with you</p>
          </div>
          <SharedSecrets secretsLs={sharedsecrets} />
        </>
      )}

      {secretsTab === "me" &&
        (mysecrets?.length > 0 ? (
          <>
            <div className="section-header">
              <h4>My API Keys</h4>
              <p>
                When you "Lend" keys, others get permission to use services
                through our interface—not your actual key
              </p>
            </div>
            <MySecrets secretsLs={mykeys} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaIcon faIcon={faKey} color="#3a7bd5" fontsize={24} />
            </div>
            <p>
              Import your API keys to store them on our decentralized network
            </p>
            <p className="sub-message">
              Monetize them by sharing with others or use as collateral
            </p>
          </div>
        ))}

      {secretsTab === "shared" &&
        (sharedsecrets?.length > 0 ? (
          <>
            <div className="section-header">
              <h4>Shared With Me</h4>
              <p>
                API keys others have shared with you, allowing access to
                services without exposing their actual keys
              </p>
            </div>
            <SharedSecrets secretsLs={sharedsecrets} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaIcon faIcon={faShare} color="#3a7bd5" fontsize={24} />
            </div>
            <p>API keys shared with you will appear here</p>
            <p className="sub-message">
              Expired or revoked keys will not be shown
            </p>
          </div>
        ))}
    </div>
  );
};
