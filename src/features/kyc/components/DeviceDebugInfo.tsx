import { useState } from "react";
import {
  isMobileDevice,
  shouldShowQRCode,
  isDefinitelyDesktop,
  getDeviceType,
} from "@/utils/device-detector";
import { FiInfo, FiMonitor, FiSmartphone, FiTablet } from "react-icons/fi";

export default function DeviceDebugInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const deviceInfo = {
    isMobile: isMobileDevice(),
    shouldShowQR: shouldShowQRCode(),
    isDefinitelyDesktop: isDefinitelyDesktop(),
    deviceType: getDeviceType(),
    screenSize: `${window.innerWidth}×${window.innerHeight}`,
    hasTouch: "ontouchstart" in window,
    maxTouchPoints: navigator.maxTouchPoints,
    userAgent: navigator.userAgent,
    hasMouse: window.matchMedia("(pointer: fine)").matches,
    pixelRatio: window.devicePixelRatio || 1,
  };

  const getDeviceIcon = () => {
    switch (deviceInfo.deviceType) {
      case "mobile":
        return <FiSmartphone className="w-4 h-4" />;
      case "tablet":
        return <FiTablet className="w-4 h-4" />;
      case "desktop":
        return <FiMonitor className="w-4 h-4" />;
      default:
        return <FiInfo className="w-4 h-4" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Device Debug Info"
      >
        <FiInfo className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          {getDeviceIcon()}
          <h3 className="text-lg font-semibold">Device Detection Debug</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div
            className={`p-3 rounded-lg ${
              deviceInfo.shouldShowQR
                ? "bg-blue-100 dark:bg-blue-900"
                : "bg-green-100 dark:bg-green-900"
            }`}
          >
            <p className="font-medium">
              KYC Flow:{" "}
              {deviceInfo.shouldShowQR ? "📱 Show QR Code" : "📸 Direct Camera"}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {deviceInfo.shouldShowQR
                ? "User will see QR code to scan"
                : "User can use camera directly"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-medium">Device Type:</p>
              <p className="opacity-75">{deviceInfo.deviceType}</p>
            </div>
            <div>
              <p className="font-medium">Screen Size:</p>
              <p className="opacity-75">{deviceInfo.screenSize}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Detection Results:</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div
                className={`p-2 rounded ${
                  deviceInfo.isMobile
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-red-100 dark:bg-red-900"
                }`}
              >
                isMobile: {deviceInfo.isMobile ? "✅" : "❌"}
              </div>
              <div
                className={`p-2 rounded ${
                  deviceInfo.isDefinitelyDesktop
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                isDesktop: {deviceInfo.isDefinitelyDesktop ? "✅" : "❌"}
              </div>
              <div
                className={`p-2 rounded ${
                  deviceInfo.hasTouch
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-red-100 dark:bg-red-900"
                }`}
              >
                hasTouch: {deviceInfo.hasTouch ? "✅" : "❌"}
              </div>
              <div
                className={`p-2 rounded ${
                  deviceInfo.hasMouse
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                hasMouse: {deviceInfo.hasMouse ? "✅" : "❌"}
              </div>
            </div>
          </div>

          <div>
            <p className="font-medium">Touch Points:</p>
            <p className="opacity-75">{deviceInfo.maxTouchPoints}</p>
          </div>

          <div>
            <p className="font-medium">Pixel Ratio:</p>
            <p className="opacity-75">{deviceInfo.pixelRatio}</p>
          </div>

          <div>
            <p className="font-medium">User Agent:</p>
            <p className="opacity-75 text-xs break-all">
              {deviceInfo.userAgent}
            </p>
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
