import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGem,
  faChevronRight,
  faShield,
  faAt,
} from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { formatUsd } from "../../utils/formatters";
import { MiniMap } from "../security/MiniMap";
import { AltNodes } from "./security/Nodes";
import { ChevronLeft, Import, Refresh, Lock } from "../../assets/icons/actions";
import { Locations } from "../../pages/security/NodesTeeSelector";
import { FaIcon } from "../../assets/faicon";
import { Node } from "../../assets/icons/security";
import nodestees from "../../components/tabs/security/nodestees.json";
import "../../styles/components/tabs/security.scss";

export const SecurityTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [showNodeInfoModal, setShowNodeInfoModal] = useState<boolean>(false);
  const [showMigrateModal, setShowMigrateModal] = useState<boolean>(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState<boolean>(false);
  const spendingLimit = 1000;

  const goBack = () => {
    switchtab("home");
  };

  const onGetPremium = () => {
    navigate("/premiums?returnPath=security");
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

  const openPinSetupModal = () => {
    setShowPinSetupModal(true);
  };

  const closePinSetupModal = () => {
    setShowPinSetupModal(false);
  };

  const handleMigrateKeys = () => {
    closeMigrateModal();
    navigate("/premiums?returnPath=security");
  };

  const handleSetupPin = () => {
    closePinSetupModal();
  };

  useBackButton(goBack);

  return (
    <section className="min-h-screen bg-[#0e0e0e] px-4 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[#f6f7f9] text-2xl font-bold">Your Keys</h1>
        <button
          onClick={onGetPremium}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] transition-colors"
        >
          <FontAwesomeIcon icon={faGem} className="text-[#ffb386]" />
          <span className="text-[#f6f7f9] text-sm">Free</span>
          <FontAwesomeIcon
            icon={faChevronRight}
            className="text-[#f6f7f9] text-xs"
          />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 bg-[#212121] rounded-xl mb-6">
        <p className="text-gray-400 text-sm">
          Your keys are split into{" "}
          <span className="text-[#f6f7f9] font-semibold">4 shards</span> and
          distributed across nodes for max security
        </p>
        <button
          onClick={openKeyInfoModal}
          className="flex items-center gap-1 text-[#ffb386] hover:opacity-80 transition-opacity"
        >
          <span className="text-sm font-semibold">More</span>
          <div className="rotate-180">
            <ChevronLeft width={5} height={9} color="#ffb386" />
          </div>
        </button>
      </div>

      <div className="space-y-6 mb-16">
        <MiniMap
          selectorLocations={Locations.filter(
            (_loc) => _loc?.isNode && _loc?.isAvailable
          ).slice(0, 4)}
        />

        <div className="bg-[#212121] rounded-xl p-4">
          <h3 className="text-[#f6f7f9] text-lg font-semibold mb-4">
            Physical Node Distribution
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <AltNodes
              sxstyles={{
                backgroundColor: "#7be891",
              }}
              selectedNode={nodestees?.NODES[0]}
              aumvalue={24}
            />
            <AltNodes
              sxstyles={{
                backgroundColor: "#ffb386",
              }}
              selectedNode={nodestees?.NODES[2]}
              aumvalue={18}
            />
            <AltNodes
              sxstyles={{
                backgroundColor: "#62eba9",
              }}
              selectedNode={nodestees?.NODES[3]}
              aumvalue={31}
            />
            <AltNodes
              sxstyles={{
                backgroundColor: "#50b9c2",
              }}
              selectedNode={nodestees?.NODES[4]}
              aumvalue={22}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <SecurityScore />
            <SecurityAudit />
            <ActiveNodesCount onClick={openNodeInfoModal} />
          </div>

          <button
            onClick={openMigrateModal}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#ffb386] text-[#0e0e0e] rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity relative overflow-hidden group"
          >
            <Import color="#0e0e0e" width={16} height={16} />
            <span className="relative z-10">Migrate Your Keys</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          </button>
        </div>

        {/* Recovery Methods Card */}
        <div className="bg-[#212121] rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#4285F4]/10 flex items-center justify-center">
              <Refresh color="#4285F4" width={14} height={14} />
            </div>
            <h3 className="text-[#f6f7f9] text-lg font-semibold">
              Recovery Methods
            </h3>
          </div>

          <RecoveryOption
            title="Email Recovery"
            description="Recover your wallet using email"
            value="setup"
            icon={<FaIcon faIcon={faAt} color="#4285F4" />}
            onclick={() => {}}
          />
          <RecoveryOption
            title="Physical Recovery"
            description="1 Physical Verification + 2 Virtual Verification"
            value="premium"
            icon={<Lock width={16} height={16} color="#gray-400" />}
            disabled={true}
            onclick={onGetPremium}
          />
        </div>

        {/* Security Settings Card */}
        <div className="bg-[#212121] rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
              <FaIcon faIcon={faShield} color="#4CAF50" />
            </div>
            <h3 className="text-[#f6f7f9] text-lg font-semibold">
              Security Settings
            </h3>
          </div>

          <SecuritySettings
            title="Payment PIN"
            description={`Required for transfers >$100`}
            limitvalue="Setup"
            icon={<Pin width={16} height={16} color="#ffb386" />}
            onclick={openPinSetupModal}
            formatDecimals={false}
            isSetup={true}
          />
          <SecuritySettings
            title="Spending Limit"
            description="Amount that requires 2FA"
            limitvalue={spendingLimit}
            icon={<Import width={16} height={16} color="#ffb386" />}
            onclick={() => {}}
            formatDecimals={false}
          />
          <SecuritySettings
            title="Withdrawal Limit"
            description="Max withdrawal in a 24-hour period"
            limitvalue={10000}
            icon={<Import width={16} height={16} color="#ffb386" />}
            onclick={() => {}}
            formatDecimals={false}
          />
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-[#212121] rounded-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h3 className="text-[#f6f7f9] text-lg font-semibold">
                Key Security Information
              </h3>
              <button
                onClick={closeKeyInfoModal}
                className="text-gray-400 hover:text-[#f6f7f9] transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-[#f6f7f9]">
                Your keys are protected using advanced cryptographic sharding
                technology:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
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
              <p className="text-gray-400">
                This technology is built on the{" "}
                <a
                  href="https://stratosphere.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ffb386] font-semibold hover:underline"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-[#212121] rounded-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h3 className="text-[#f6f7f9] text-lg font-semibold">
                Active Nodes
              </h3>
              <button
                onClick={closeNodeInfoModal}
                className="text-gray-400 hover:text-[#f6f7f9] transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-gray-400">
                Your wallet requires at least 3 out of 4 nodes to be online to
                process transactions.
              </p>
              <p className="text-[#f6f7f9]">
                Current status: <strong>4 of 4 nodes online</strong>
              </p>
              <p className="text-gray-400">
                This requirement ensures that your wallet remains secure while
                still being accessible when you need it.
              </p>
            </div>
          </div>
        </div>
      )}

      {showMigrateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-[#212121] rounded-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h3 className="text-[#f6f7f9] text-lg font-semibold">
                Migrate Your Keys
              </h3>
              <button
                onClick={closeMigrateModal}
                className="text-gray-400 hover:text-[#f6f7f9] transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-[#f6f7f9]">
                Migrate your digital assets to a new set of keys, managed by 4
                Nodes of your choice.
              </p>
              <p className="text-gray-400">This process:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>Creates a new set of cryptographic keys</li>
                <li>Transfers all your assets to the new keys</li>
                <li>Allows you to select which nodes will manage your keys</li>
                <li>Enhances security by rotating your keys</li>
              </ul>
              <button
                onClick={handleMigrateKeys}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#ffb386] to-[#4285F4] text-[#f6f7f9] rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity mt-4"
              >
                <Import color="#ffffff" width={16} height={16} />
                <span>Migrate Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showPinSetupModal && (
        <PinSetupModal
          onClose={closePinSetupModal}
          onSetPin={handleSetupPin}
          spendingLimit={spendingLimit}
        />
      )}
    </section>
  );
};

const SecurityScore = (): JSX.Element => {
  return (
    <div className="bg-[#212121] rounded-xl p-3 flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-[#4285F4]/10 flex items-center justify-center mb-2">
        <FaIcon faIcon={faShield} color="#4285F4" />
      </div>
      <p className="text-[#f6f7f9] text-sm font-semibold mb-1">Security</p>
      <div className="text-[#ffb386] text-sm font-bold mb-1">92/100</div>
      <div className="text-xs text-gray-400 px-2 py-1 bg-[#4285F4]/10 rounded-full">
        24/7 Security
      </div>
    </div>
  );
};

const SecurityAudit = (): JSX.Element => {
  return (
    <div className="bg-[#212121] rounded-xl p-3 flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mb-2">
        <Refresh color="#4CAF50" width={16} height={16} />
      </div>
      <p className="text-[#f6f7f9] text-sm font-semibold mb-1">Last Audit</p>
      <div className="text-[#4CAF50] text-sm font-bold mb-1">18/18</div>
      <div className="text-xs text-gray-400 px-2 py-1 bg-[#4CAF50]/10 rounded-full">
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
      className={`bg-[#212121] rounded-xl p-3 flex flex-col items-center ${
        onClick ? "cursor-pointer hover:bg-[#2a2a2a] transition-colors" : ""
      }`}
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-full bg-[#4285F4]/10 flex items-center justify-center mb-2">
        <Node color="#4285F4" width={16} height={16} />
      </div>
      <p className="text-[#f6f7f9] text-sm font-semibold mb-1">Nodes</p>
      <div className="text-[#4285F4] text-sm font-bold mb-1">4 of 4 Active</div>
      <div className="text-xs text-gray-400 px-2 py-1 bg-[#4285F4]/10 rounded-full flex items-center gap-1">
        <span>More</span>
        {onClick && (
          <div className="rotate-180">
            <ChevronLeft width={5} height={8} color="#9CA3AF" />
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
  icon,
  onclick,
  formatDecimals = true,
  isSetup = false,
}: {
  title: string;
  description: string;
  limitvalue: number | string;
  icon?: JSX.Element;
  onclick: () => void;
  formatDecimals?: boolean;
  isSetup?: boolean;
}): JSX.Element => {
  return (
    <div
      onClick={onclick}
      className="flex items-center py-2 border-b border-[#2a2a2a] last:border-0 cursor-pointer hover:opacity-80 transition-opacity"
    >
      {icon && <div className="mr-3 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[#f6f7f9] text-sm font-medium mb-1">{title}</p>
        <p className="text-gray-400 text-xs">{description}</p>
      </div>
      <div
        className={`flex items-center gap-2 text-sm font-semibold ${
          isSetup ? "text-[#ffb386]" : "text-[#f6f7f9]"
        }`}
      >
        {typeof limitvalue === "number"
          ? formatDecimals
            ? formatUsd(limitvalue)
            : `$${limitvalue.toLocaleString()}`
          : limitvalue}
        <ChevronLeft width={6} height={11} color="#ffb386" />
      </div>
    </div>
  );
};

const RecoveryOption = ({
  title,
  description,
  value,
  icon,
  disabled = false,
  onclick,
}: {
  title: string;
  description: string;
  value: "setup" | "enabled" | "premium";
  icon?: JSX.Element;
  disabled?: boolean;
  onclick: () => void;
}): JSX.Element => {
  return (
    <div
      onClick={onclick}
      className={`flex items-center py-2 border-b border-[#2a2a2a] last:border-0 ${
        disabled
          ? "opacity-60 cursor-default"
          : "cursor-pointer hover:opacity-80"
      } transition-opacity`}
    >
      {icon && <div className="mr-3 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[#f6f7f9] text-sm font-medium mb-1">{title}</p>
        <p className="text-gray-400 text-xs">{description}</p>
      </div>
      <div
        className={`flex items-center gap-2 text-sm font-semibold ${
          value === "premium" ? "text-[#ffb386]" : "text-[#4CAF50]"
        }`}
      >
        {value}
        {value === "premium" && (
          <FontAwesomeIcon icon={faGem} className="text-xs" />
        )}
      </div>
    </div>
  );
};

const PinSetupModal = ({
  onClose,
  onSetPin,
  spendingLimit,
}: {
  onClose: () => void;
  onSetPin: (pin: string) => void;
  spendingLimit: number;
}): JSX.Element => {
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [error, setError] = useState<string>("");

  const handlePinChange = (value: string) => {
    if (step === "create") {
      setPin(value);
      if (value.length === 4) {
        setStep("confirm");
      }
    } else {
      setConfirmPin(value);
    }
  };

  const handleSubmit = () => {
    if (pin !== confirmPin) {
      setError("PINs don't match. Please try again.");
      setStep("create");
      setPin("");
      setConfirmPin("");
      return;
    }

    onSetPin(pin);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-[#212121] rounded-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h3 className="text-[#f6f7f9] text-lg font-semibold">
            Setup Payment PIN
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#f6f7f9] transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#4285F4]/10 flex items-center justify-center mx-auto mb-4">
            <Pin color="#4285F4" width={24} height={24} />
          </div>

          <p className="text-[#f6f7f9] mb-6">
            {step === "create"
              ? `Create a 4-digit PIN for transactions over $${spendingLimit.toLocaleString()}`
              : "Confirm your PIN"}
          </p>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="mb-6">
            <PinInput
              value={step === "create" ? pin : confirmPin}
              onChange={handlePinChange}
              length={4}
            />
          </div>

          {step === "confirm" && (
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-[#ffb386] text-[#0e0e0e] rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Set PIN
            </button>
          )}

          <p className="text-gray-400 text-sm mt-4">
            This PIN will be required for all transactions exceeding your
            spending limit.
          </p>
        </div>
      </div>
    </div>
  );
};

const PinInput = ({
  value,
  onChange,
  length,
}: {
  value: string;
  onChange: (value: string) => void;
  length: number;
}): JSX.Element => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (/^\d*$/.test(newValue) && newValue.length <= length) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex justify-center">
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        className="w-0 h-0 absolute opacity-0"
        autoFocus
      />
      <div className="flex gap-2">
        {Array.from({ length }).map((_, index) => (
          <div
            key={index}
            onClick={() => document.querySelector("input")?.focus()}
            className={`w-12 h-12 flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-colors cursor-pointer ${
              index < value.length
                ? "border-[#ffb386] bg-[#ffb386]/10 text-[#f6f7f9]"
                : "border-[#2a2a2a] text-transparent"
            }`}
          >
            {index < value.length ? "•" : ""}
          </div>
        ))}
      </div>
    </div>
  );
};

const Pin = ({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}): JSX.Element => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM14 13.58V16H10V13.58C8.2 12.81 7 11.05 7 9C7 6.24 9.24 4 12 4C14.76 4 17 6.24 17 9C17 11.05 15.8 12.81 14 13.58Z"
        fill={color}
      />
      <path
        d="M12 6C10.9 6 10 6.9 10 8C10 9.1 10.9 10 12 10C13.1 10 14 9.1 14 8C14 6.9 13.1 6 12 6Z"
        fill={color}
      />
      <path
        d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z"
        fill={color}
      />
    </svg>
  );
};
