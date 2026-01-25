import { useState } from "react";
import { motion } from "motion/react";
import { FiSmartphone, FiCamera, FiCopy, FiCheck } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  currentUrl?: string;
  selectedCountry?: { name: string; flag: string } | null;
}

export default function MobileOnlyPrompt({
  currentUrl,
  selectedCountry,
}: Props) {
  // Construct URL with wallet.riftfi.xyz as base domain
  const getKYCUrl = () => {
    if (currentUrl) return currentUrl;
    const path = window.location.pathname;
    const search = window.location.search;
    return `https://wallet.riftfi.xyz${path}${search}`;
  };
  const url = getKYCUrl();
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center w-full h-full p-5"
    >
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center">
              <FiSmartphone className="w-10 h-10 text-accent-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-accent-primary">
              <FiCamera className="w-4 h-4 text-accent-primary" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Continue on Your Phone</h2>
          <p className="text-muted-foreground">
            Complete your{" "}
            {selectedCountry
              ? `${selectedCountry.flag} ${selectedCountry.name}`
              : ""}{" "}
            identity verification using your mobile device's camera.
          </p>
        </div>

        {/* QR Code */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium mb-1">
              Scan with your phone camera
            </p>
            <p className="text-xs text-muted-foreground">
              Or use any QR code scanner app
            </p>
          </div>
          <div className="flex justify-center">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border">
              {!qrError ? (
                <QRCodeSVG
                  value={url}
                  size={Math.min(180, window.innerWidth - 120)}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                  onError={() => setQrError(true)}
                />
              ) : (
                <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-center text-muted-foreground">
                  <FiSmartphone className="w-12 h-12 mb-2" />
                  <p className="text-sm">QR Code Error</p>
                  <p className="text-xs">Use link below</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Copy link */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Can't scan? Copy the link instead:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-4 py-3 rounded-lg border border-muted bg-muted/30 text-sm font-mono text-muted-foreground"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                copied
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "bg-accent-primary text-white hover:bg-accent-primary/90"
              }`}
            >
              {copied ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <FiCopy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Before you continue:
          </h3>
          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <p>📱 Have your phone ready</p>
            <p>🆔 Get your {selectedCountry?.name || ""} ID document</p>
            <p>💡 Find good lighting</p>
            <p>📷 Allow camera access when prompted</p>
          </div>
        </div>

        {/* Device info for debugging */}
        <div className="text-xs text-muted-foreground/70 text-center">
          <details className="inline">
            <summary className="cursor-pointer hover:text-muted-foreground">
              Device info
            </summary>
            <p className="mt-1">
              Screen: {window.innerWidth}×{window.innerHeight}
            </p>
            <p>Touch: {"ontouchstart" in window ? "Yes" : "No"}</p>
            <p>UA: {navigator.userAgent.substring(0, 50)}...</p>
          </details>
        </div>
      </div>
    </motion.div>
  );
}
