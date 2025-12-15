import { useState, useEffect } from "react";
import {
  FiSettings,
  FiMonitor,
  FiSmartphone,
  FiRefreshCw,
} from "react-icons/fi";

type DeviceOverride = "auto" | "force-desktop" | "force-mobile";

interface Props {
  onOverrideChange: (override: DeviceOverride) => void;
}

export default function DeviceOverride({ onOverrideChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [override, setOverride] = useState<DeviceOverride>("auto");

  useEffect(() => {
    const savedOverride = localStorage.getItem(
      "kyc-device-override"
    ) as DeviceOverride;
    if (
      savedOverride &&
      ["auto", "force-desktop", "force-mobile"].includes(savedOverride)
    ) {
      setOverride(savedOverride);
      onOverrideChange(savedOverride);
    }
  }, [onOverrideChange]);

  const handleOverrideChange = (newOverride: DeviceOverride) => {
    setOverride(newOverride);
    localStorage.setItem("kyc-device-override", newOverride);
    onOverrideChange(newOverride);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Device Override"
      >
        <FiSettings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-4">
          <FiSettings className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Device Override</h3>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Force KYC flow behavior for testing:
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="device-override"
                checked={override === "auto"}
                onChange={() => handleOverrideChange("auto")}
                className="w-4 h-4"
              />
              <FiRefreshCw className="w-4 h-4" />
              <span>Auto Detect</span>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="device-override"
                checked={override === "force-desktop"}
                onChange={() => handleOverrideChange("force-desktop")}
                className="w-4 h-4"
              />
              <FiMonitor className="w-4 h-4" />
              <span>Force Desktop (QR Code)</span>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="device-override"
                checked={override === "force-mobile"}
                onChange={() => handleOverrideChange("force-mobile")}
                className="w-4 h-4"
              />
              <FiSmartphone className="w-4 h-4" />
              <span>Force Mobile (Direct Camera)</span>
            </label>
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            Current: <strong>{override}</strong>
            <br />
            This setting is saved in localStorage
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="mt-4 w-full p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
