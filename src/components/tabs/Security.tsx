import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { formatUsd } from "../../utils/formatters";
import { MiniMap } from "../security/MiniMap";
import { AltNodes } from "./security/Nodes";
import { colors } from "../../constants";
import { ChevronLeft, Import, Refresh } from "../../assets/icons/actions";
import { Locations } from "../../pages/security/NodesTeeSelector";
import { Security } from "../../assets/icons/tabs";
import { Node } from "../../assets/icons/security";
import nodestees from "../../components/tabs/security/nodestees.json";
import "../../styles/components/tabs/security.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGem, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export const SecurityTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [showNodeInfoModal, setShowNodeInfoModal] = useState<boolean>(false);
  const [showMigrateModal, setShowMigrateModal] = useState<boolean>(false);

  const goBack = () => {
    switchtab("home");
  };

  const onGetPremium = () => {
    navigate("/premiums");
  };

  const openKeyInfoModal = () => {
    setShowModal(true);
  };

  const closeKeyInfoModal = () => {
    setShowModal(false);
  };

  const openNodeInfoModal = () => {
    setShowNodeInfoModal(true);
  };

  const closeNodeInfoModal = () => {
    setShowNodeInfoModal(false);
  };

  const openMigrateModal = () => {
    setShowMigrateModal(true);
  };

  const closeMigrateModal = () => {
    setShowMigrateModal(false);
  };

  const handleMigrateKeys = () => {
    closeMigrateModal();
    navigate("/premiums?returnPath=security");
  };

  useBackButton(goBack);

  return (
    <section id="securitytab">
      <div className="defi-header">
        <h1 className="title">Your Keys</h1>
        <div className="premium-boost" onClick={onGetPremium}>
          <FontAwesomeIcon icon={faGem} className="gem-icon" />
          <span>Free</span>
          <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
        </div>
      </div>

      <div className="keylocactions">
        <div
          className="keysplitmsg card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.5rem 0.75rem",
            backgroundColor: "rgba(0, 0, 0, 0.02)",
            borderRadius: "0.75rem",
            border: `1px solid ${colors.divider}`,
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
            marginTop: "0.75rem",
          }}
        >
          <p
            className="shards"
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: colors.textsecondary,
            }}
          >
            Your keys are split into{" "}
            <span style={{ fontWeight: "600", color: colors.textprimary }}>
              4 shards
            </span>{" "}
            and distributed across nodes for max security
          </p>
          <div
            className="learnmore"
            onClick={openKeyInfoModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                fontWeight: "600",
                color: colors.accent,
              }}
            >
              Learn More
            </p>
            <div style={{ transform: "rotate(180deg)" }}>
              <ChevronLeft width={5} height={9} color={colors.accent} />
            </div>
          </div>
        </div>
      </div>

      <div className="map_nodelocationsctr">
        <MiniMap
          selectorLocations={Locations.filter(
            (_loc) => _loc?.isNode && _loc?.isAvailable
          ).slice(0, 4)}
        />

        <div className="node-section">
          <p className="node-section-title">Physical Node Distribution</p>
          <div className="node_locations">
            <AltNodes
              sxstyles={{
                backgroundColor: "#1F9470",
              }}
              selectedNode={nodestees?.NODES[0]}
              aumvalue={24}
            />
            <AltNodes
              sxstyles={{
                backgroundImage: colors.omgradient,
              }}
              selectedNode={nodestees?.NODES[2]}
              aumvalue={18}
            />
            <AltNodes
              sxstyles={{
                backgroundColor: "rgb(5, 11, 23)",
              }}
              selectedNode={nodestees?.NODES[3]}
              aumvalue={31}
            />
            <AltNodes
              sxstyles={{
                backgroundColor: "#0c0c0e",
              }}
              selectedNode={nodestees?.NODES[4]}
              aumvalue={22}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "1.5rem",
              marginBottom: "1.5rem",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <SecurityScore />
            <SecurityAudit />
            <ActiveNodesCount onClick={openNodeInfoModal} />
          </div>

          <div className="migrate-key-button">
            <button
              className="migrate-now-btn"
              onClick={openMigrateModal}
              style={{
                width: "100%",
                padding: "0.75rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                background: `linear-gradient(45deg, ${colors.accent}, ${colors.success})`,
                border: "none",
                borderRadius: "0.75rem",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.9rem",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Import color="#ffffff" width={16} height={16} />
              <span style={{ position: "relative", zIndex: 2 }}>
                Migrate Your Keys
              </span>
              <div
                style={{
                  content: '""',
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background: `linear-gradient(
                  to right,
                  rgba(255, 255, 255, 0) 0%,
                  rgba(255, 255, 255, 0.3) 50%,
                  rgba(255, 255, 255, 0) 100%
                )`,
                  transform: "rotate(30deg)",
                  animation: "shine 3s infinite linear",
                  zIndex: 1,
                }}
              ></div>
            </button>
          </div>
        </div>
      </div>

      <div
        className="security_settings card"
        style={{
          padding: "1.25rem",
          borderRadius: "1rem",
          backgroundColor: "rgba(0, 0, 0, 0.02)",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          border: `1px solid ${colors.divider}`,
          marginBottom: "1.5rem",
        }}
      >
        <p
          className="settingstitle"
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: colors.textprimary,
          }}
        >
          Security Settings
        </p>

        <SecuritySettings
          title="Spending Limit"
          description="Max per transaction"
          limitvalue={5000}
          onclick={() => {}}
        />
        <SecuritySettings
          title="Withdrawal Limit"
          description="Max withdrawal in a 24-hour period"
          limitvalue={10000}
          onclick={() => {}}
        />
      </div>

      <div
        className="recovery_settings card"
        style={{
          padding: "1.25rem",
          borderRadius: "1rem",
          backgroundColor: "rgba(0, 0, 0, 0.02)",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          border: `1px solid ${colors.divider}`,
          marginBottom: "1.5rem",
        }}
      >
        <p className="recoverytitle">Recovery Methods</p>
        <RecoveryOption
          title="Email Recovery"
          description="Recover your wallet using physical key cards"
          value="enabled"
          onclick={() => {}}
        />
        <RecoveryOption
          title="Physical Recovery"
          description="1 Physical Verification + 2 Virtual Verification"
          value="premium"
          onclick={() => {}}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeKeyInfoModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Key Security Information</h3>
              <button className="close-button" onClick={closeKeyInfoModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Your keys are protected using advanced cryptographic sharding
                technology:
              </p>
              <ul>
                <li>Each key is split into 4 separate shards</li>
                <li>Shards are distributed across physically separate nodes</li>
                <li>
                  At least 3 shards are required to reconstruct the key
                  (Shamir's Secret Sharing)
                </li>
                <li>
                  Even if one node is compromised, your keys remain secure
                </li>
                <li>
                  Using Stratosphere blockchain for secure and transparent key
                  management
                </li>
              </ul>
              <p>
                This technology is built on the{" "}
                <a
                  href="https://stratosphere.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: colors.accent,
                    textDecoration: "none",
                    fontWeight: "600",
                  }}
                >
                  Stratosphere Network
                </a>
                , providing enterprise-grade security for your digital assets.
              </p>
            </div>
          </div>
        </div>
      )}

      {showNodeInfoModal && (
        <div className="modal-overlay" onClick={closeNodeInfoModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Active Nodes</h3>
              <button className="close-button" onClick={closeNodeInfoModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Your wallet requires at least 3 out of 4 nodes to be online to
                process transactions.
              </p>
              <p>
                Current status: <strong>4 of 4 nodes online</strong>
              </p>
              <p>
                This requirement ensures that your wallet remains secure while
                still being accessible when you need it.
              </p>
            </div>
          </div>
        </div>
      )}

      {showMigrateModal && (
        <div className="modal-overlay" onClick={closeMigrateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Migrate Your Keys</h3>
              <button className="close-button" onClick={closeMigrateModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Migrate your digital assets to a new set of keys, managed by 4
                Nodes of your choice.
              </p>
              <p>This process:</p>
              <ul>
                <li>Creates a new set of cryptographic keys</li>
                <li>Transfers all your assets to the new keys</li>
                <li>Allows you to select which nodes will manage your keys</li>
                <li>Enhances security by rotating your keys</li>
              </ul>
              <button
                className="migrate-now-btn"
                onClick={handleMigrateKeys}
                style={{
                  width: "100%",
                  marginTop: "1rem",
                  padding: "0.75rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: `linear-gradient(45deg, ${colors.accent}, ${colors.success})`,
                  border: "none",
                  borderRadius: "0.75rem",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Import color="#ffffff" width={16} height={16} />
                <span>Migrate Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const SecurityScore = (): JSX.Element => {
  return (
    <div
      className="stat-card"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        border: `1px solid ${colors.divider}`,
        transition: "all 0.2s ease",
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(74, 109, 167, 0.15)",
          borderRadius: "50%",
          width: "2rem",
          height: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <Security color={colors.accent} width={16} height={16} />
      </div>
      <p
        style={{
          fontSize: "0.8rem",
          fontWeight: "600",
          color: colors.textprimary,
          marginBottom: "0.25rem",
          textAlign: "center",
        }}
      >
        Security
      </p>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: "700",
          color: colors.accent,
          marginBottom: "0.25rem",
        }}
      >
        92/100
      </div>
      <div
        style={{
          fontSize: "0.5rem",
          color: colors.textsecondary,
          padding: "0.25rem 0.5rem",
          backgroundColor: "rgba(74, 109, 167, 0.1)",
          borderRadius: "0.5rem",
          textAlign: "center",
          width: "fit-content",
        }}
      >
        24/7 Security
      </div>
    </div>
  );
};

const SecurityAudit = (): JSX.Element => {
  return (
    <div
      className="stat-card"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        border: `1px solid ${colors.divider}`,
        transition: "all 0.2s ease",
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(76, 175, 80, 0.15)",
          borderRadius: "50%",
          width: "2rem",
          height: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <Refresh color={colors.success} width={16} height={16} />
      </div>
      <p
        style={{
          fontSize: "0.8rem",
          fontWeight: "600",
          color: colors.textprimary,
          marginBottom: "0.25rem",
          textAlign: "center",
        }}
      >
        Last Audit
      </p>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: "700",
          color: colors.success,
          marginBottom: "0.25rem",
        }}
      >
        18/18
      </div>
      <div
        style={{
          fontSize: "0.5rem",
          color: colors.textsecondary,
          padding: "0.25rem 0.5rem",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderRadius: "0.5rem",
          textAlign: "center",
          width: "fit-content",
        }}
      >
        10 days ago
      </div>
    </div>
  );
};

const ActiveNodesCount = ({
  onClick,
}: {
  onClick?: () => void;
}): JSX.Element => {
  return (
    <div
      className="stat-card"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        border: `1px solid ${colors.divider}`,
        transition: "all 0.2s ease",
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div
        style={{
          backgroundColor: "rgba(66, 133, 244, 0.15)",
          borderRadius: "50%",
          width: "2rem",
          height: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <Node color="#4285F4" width={16} height={16} />
      </div>
      <p
        style={{
          fontSize: "0.8rem",
          fontWeight: "600",
          color: colors.textprimary,
          marginBottom: "0.25rem",
          textAlign: "center",
        }}
      >
        Nodes
      </p>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: "700",
          color: "#4285F4",
          marginBottom: "0.25rem",
        }}
      >
        4 of 4 Active
      </div>
      <div
        style={{
          fontSize: "0.5rem",
          color: colors.textsecondary,
          padding: "0.25rem 0.5rem",
          backgroundColor: "rgba(66, 133, 244, 0.1)",
          borderRadius: "0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.25rem",
          width: "fit-content",
        }}
      >
        <span>More</span>
        {onClick && (
          <div style={{ transform: "rotate(180deg)" }}>
            <ChevronLeft width={5} height={8} color={colors.textsecondary} />
          </div>
        )}
      </div>
    </div>
  );
};

const SecuritySettings = ({
  title,
  description,
  limitvalue,
  onclick,
}: {
  title: string;
  description: string;
  limitvalue: number | "unlimited";
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="settings" onClick={onclick}>
      <p className="title_desc">
        {title}
        <span>{description}</span>
      </p>
      <p className="limit">
        {typeof limitvalue === "number" ? formatUsd(limitvalue) : limitvalue}
        <span className="icons">
          <ChevronLeft width={6} height={11} color={colors.accent} />
        </span>
      </p>
    </div>
  );
};

const RecoveryOption = ({
  title,
  description,
  value,
  onclick,
}: {
  title: string;
  description: string;
  value: "enabled" | "premium";
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="recovery" onClick={onclick}>
      <p className="title_desc">
        {title}
        <span>{description}</span>
      </p>
      <p className="value">{value}</p>
    </div>
  );
};
