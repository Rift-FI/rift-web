import { JSX, useEffect, useState } from "react";
import { Switch } from "@mui/material";
import {
  SecurityOutlined,
  StorageOutlined,
  InfoOutlined,
  SmartphoneOutlined,
} from "@mui/icons-material";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { teeType, TEE } from "./security/TEE";
import { locationType, NodeLocations } from "./security/NodeLocations";
import { Database, Import, Security } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/components/tabs/security.css";

export const SecurityTab = (): JSX.Element => {
  const { switchtab } = useTabs();

  const [selectedNodeLocation, setSelectedNodeLocation] =
    useState<locationType | null>(null);
  const [selectedTee, setSelectedTee] = useState<teeType | null>(null);

  if (backButton.isMounted()) {
    backButton.onClick(() => {
      switchtab("vault");
    });
  }

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  return (
    <section id="securitytab">
      <p className="tab_title">Security Settings</p>
      <div className="divider" />

      <span className="icon">
        <SecurityOutlined /> Key Storage
      </span>
      <span className="ic_desc">
        Configure how your private key is stored and protected
      </span>

      <p className="ic_desc_0">
        Your private key is split and stored across multiple servers. Select at
        least 4 servers for enhanced security.
      </p>

      <div className="keysplits">
        <KeySplit title="PKMT Official" auditted uptime={99.99} nodeSelected />
        <KeySplit
          title="PKMT Official 2"
          auditted
          uptime={99.99}
          nodeSelected
        />
        <KeySplit title="BCW Technologies" auditted nodeSelected />
        <KeySplit title="Qupital" uptime={99.99} nodeDisabled />
        <KeySplit title="Hex Technologies" auditted nodeSelected />
        <KeySplit title="IDA" uptime={99.99} nodeDisabled />
        <KeySplit title="ZA Bank" nodeDisabled />
      </div>

      <div className="divider" />

      <div className="eex_ctr">
        <p className="eex">
          <StorageOutlined />
          Execution Environment
        </p>
        <span>Choose a trusted execution environment (TEE)</span>
      </div>

      <p className="sel_tee">
        Choose your preferred Trusted Execution Environment
      </p>

      <NodeLocations
        nodeLocations={nodeLocations}
        selectedLocation={selectedNodeLocation ?? nodeLocations[0]}
      />

      <div className="choose_tee">
        {teeOptions?.map((_tee, idx) => (
          <button
            key={_tee?.id}
            onClick={() => {
              if (idx == 0) {
                setSelectedNodeLocation(nodeLocations[0]);
                setSelectedTee(_tee);
              } else if (idx == 1) {
                setSelectedNodeLocation(nodeLocations[1]);
                setSelectedTee(_tee);
              } else if (idx == 2) {
                setSelectedNodeLocation(nodeLocations[2]);
                setSelectedTee(_tee);
              } else {
                setSelectedTee(_tee);
              }
            }}
            style={{
              backgroundColor:
                selectedTee?.id == _tee?.id ? colors.danger : colors.divider,
            }}
          >
            {_tee?.name}
            <Security width={14} height={18} color={colors.textprimary} />
          </button>
        ))}
      </div>

      <TEE selectedTee={selectedTee ?? teeOptions[0]} />

      <div className="divider" />

      <div className="key_mgmt">
        <span className="title">
          <Import color={colors.textprimary} />
          Key Management
        </span>
        <p className="desc">Advanced key splitting and backup options</p>

        <p className="info">
          <InfoOutlined color="error" />
          Advanced key splitting and backup options are available with a premium
          subscription.
        </p>

        <button className="upgrade">Upgrade to premium</button>
      </div>

      <div className="divider" />

      <div className="twofa">
        <span className="title">
          <SmartphoneOutlined />
          Two-Factor Authentication
        </span>
        <p className="desc">Add an extra layer of security to your account</p>

        <div className="switch">
          <Switch checked /> <span>Enable Two Factor Authentication</span>
        </div>

        <p className="desc">
          Add an extra layer of security to your account by requiring a second
          form of authentication.
        </p>
      </div>
    </section>
  );
};

const KeySplit = ({
  title,
  auditted,
  uptime,
  nodeSelected,
  nodeDisabled,
}: {
  title: string;
  auditted?: boolean;
  uptime?: number;
  nodeSelected?: boolean;
  nodeDisabled?: boolean;
}): JSX.Element => {
  return (
    <div className="key">
      <div>
        <span className="key_title">
          <Database color={colors.danger} /> &nbsp;
          {title}
        </span>

        {auditted && <span className="security">Security Auditted</span>}
        {uptime && <span className="uptime">{uptime}% Uptime</span>}
      </div>

      <Switch readOnly disabled={nodeDisabled} checked={nodeSelected} />
    </div>
  );
};

const teeOptions: teeType[] = [
  {
    id: "pkmt",
    name: "PKMT Official TEE",
    description:
      "Enterprise-grade TEE with advanced security features and 99.99% uptime SLA",
    status: "active",
    securityLevel: "high",
    location: "Hong Kong",
    latency: "<50ms",
    specs: {
      encryption: "AES-256-GCM",
      certification: "FIPS 140-2 Level 4",
      availability: "99.99%",
      maxOperations: "100k/s",
    },
  },
  {
    id: "bcw",
    name: "BCW Technologie TEE",
    description: "Hardware-based secure enclave with military-grade encryption",
    status: "maintenance",
    securityLevel: "high",
    location: "Taiwan",
    latency: "<75ms",
    specs: {
      encryption: "AES-256-CBC",
      certification: "EAL5+",
      availability: "99.90%",
      maxOperations: "75k/s",
    },
  },
  {
    id: "qupital",
    name: "Qupital TEE",
    description:
      "Quantum-resistant encryption with post-quantum cryptography support",
    status: "active",
    securityLevel: "high",
    location: "Tokyo",
    latency: "<60ms",
    specs: {
      encryption: "Classical + PQC",
      certification: "NIST PQC Round 3",
      availability: "99.95%",
      maxOperations: "80k/s",
    },
  },
  {
    id: "system-random",
    name: "System Random",
    description:
      "Distributed random number generation with quantum entropy source",
    status: "active",
    securityLevel: "medium",
    location: "Singapore",
    latency: "<100ms",
    specs: {
      encryption: "ChaCha20-Poly1305",
      certification: "FIPS 140-2 Level 3",
      availability: "99.95%",
      maxOperations: "50k/s",
    },
  },
  {
    id: "custom-hsm",
    name: "Custom HSM",
    description: "Bring your own Hardware Security Module for maximum control",
    status: "offline",
    securityLevel: "standard",
    location: "Custom",
    latency: "Varies",
    specs: {
      encryption: "Customizable",
      certification: "Varies",
      availability: "Self-managed",
      maxOperations: "Hardware dependent",
    },
  },
];

const nodeLocations: locationType[] = [
  { id: 1, latitude: 22.396427, longitude: 114.109497, nodeDisabled: false }, // hong kong
  { id: 2, latitude: 1.352083, longitude: 103.819839, nodeDisabled: true }, // singapore
  { id: 3, latitude: 23.697809, longitude: 120.960518, nodeDisabled: true }, // taiwan
  { id: 4, latitude: 35.689487, longitude: 139.691711, nodeDisabled: true }, // tokyo
];
