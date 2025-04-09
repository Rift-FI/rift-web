import { JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useBackButton } from "../hooks/backbutton";
import { useTabs } from "../hooks/tabs";
import { fetchMyKeys, keyType } from "../utils/api/keys";
import { Secrets } from "../components/web2/Secrets";
import { ImportSecret } from "../components/web2/ImportSecret";
import "../styles/pages/webassets.scss";

export default function WebAssets(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: mykeys, isLoading } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="webassets" className="bg-[#0e0e0e] h-screen overflow-y-scroll">
      <div className="header">
        <h1>Web2 Assets Vault</h1>
        <p className="text-gray-400 text-sm">
          Securely store your API keys and leverage them as collateral for loans
          and other DeFi services.
        </p>
        <button
          className="bg-[#ffb386] text-[#000] px-4 py-2 rounded-md w-full mx-auto"
          onClick={() => setShowImportModal(true)}
        >
          Import New API Key
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-indicator"></div>
          <p>Loading your secure API keys...</p>
        </div>
      ) : mykeys?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 11H5V21H19V11Z"
                stroke="#ffb386"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 9V8C17 5.23858 14.7614 3 12 3C9.23858 3 7 5.23858 7 8V9"
                stroke="#ffb386"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16V16.001"
                stroke="#ffb386"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3>No API Keys Added</h3>
          <p>
            Import your API keys (like OpenAI, Polymarket) to securely store
            them on our decentralized network and unlock new opportunities to
            make money from your existing keys.
          </p>
          <button
            className="import-button-large"
            onClick={() => setShowImportModal(true)}
          >
            Import Your First API Key
          </button>
        </div>
      ) : (
        <div className="secrets-container">
          <Secrets
            mykeys={Array.isArray(mykeys) ? mykeys : ([] as keyType[])}
          />
        </div>
      )}

      {showImportModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowImportModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import API Key</h2>
              <button
                className="close-button"
                onClick={() => setShowImportModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-description">
              <p>
                Your API key will be securely stored using Shamir secret sharing
                across our decentralized network. When you lend your key to
                others, they only get permission to use the service through our
                interface—never your actual API key. You control access duration
                and can revoke permissions at any time.
              </p>
            </div>
            <ImportSecret onClose={() => setShowImportModal(false)} />
          </div>
        </div>
      )}

      <div className="my-8"></div>
      <h1 className="text-2xl font-bold text-center text-[#f6f7f9] mb-4">
        Features Overview
      </h1>
      <div className="feature-overview">
        <div className="feature-card">
          <div className="icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 11H5V21H19V11Z"
                stroke="#ffb386"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 9V8C17 5.23858 14.7614 3 12 3C9.23858 3 7 5.23858 7 8V9"
                stroke="#ffb386"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="content">
            <h3>Decentralized Key Storage</h3>
            <p>
              Your API keys are secured using Shamir secret sharing technology
              and distributed across our decentralized network. Unlike
              centralized solutions, no single entity has access to your
              complete key.
            </p>
          </div>
        </div>

        <div className="feature-card">
          <div className="icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 6V12L16 14"
                stroke="#ffb386"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="#ffb386"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="content">
            <h3>Monetize Your API Keys</h3>
            <p>
              Lend your unused API keys (OpenAI, Polymarket, etc.) to others and
              earn passive income. Others get permission-based access to use
              services through our interface—never your actual API key. You
              control access duration and can revoke anytime.
            </p>
          </div>
        </div>

        <div className="feature-card">
          <div className="icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 8L15 8M15 8C15 9.65686 16.3431 11 18 11C19.6569 11 21 9.65685 21 8C21 6.34315 19.6569 5 18 5C16.3431 5 15 6.34315 15 8Z"
                stroke="#ffb386"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 16L9 16M9 16C9 17.6569 7.65685 19 6 19C4.34315 19 3 17.6569 3 16C3 14.3431 4.34315 13 6 13C7.65685 13 9 14.3431 9 16Z"
                stroke="#ffb386"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="content">
            <h3>Use Keys as Collateral</h3>
            <p>
              Leverage your valuable API keys as collateral for loans and other
              DeFi services. Unlock the liquidity value of your API keys without
              giving up access to them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
