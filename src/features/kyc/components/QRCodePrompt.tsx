import { motion } from "motion/react";
import { FiSmartphone, FiCamera, FiCopy, FiCheck } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  currentUrl?: string;
  onBack?: () => void;
}

export default function QRCodePrompt({ currentUrl, onBack }: Props) {
  const [copied, setCopied] = useState(false);
  const url = currentUrl || window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!", {
        description: "Open this link on your mobile device",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center w-full h-full p-5"
    >
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-accent-primary/10 flex items-center justify-center">
                <FiSmartphone className="w-12 h-12 text-accent-primary" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-accent-primary">
                <FiCamera className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Continue on Mobile</h2>
            <p className="text-muted-foreground">
              For the best KYC experience, please continue this process on your mobile device using the camera.
            </p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="space-y-3">
            <p className="text-lg font-semibold">1. Scan with your phone</p>
            <div className="flex justify-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
              <QRCodeSVG 
                value={url} 
                size={200} 
                level="H"
                bgColor="transparent"
                fgColor="currentColor"
                className="text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Or divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-muted"></div>
            <span className="text-sm text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-muted"></div>
          </div>

          {/* Copy Link */}
          <div className="space-y-3">
            <p className="text-lg font-semibold">2. Copy & open on mobile</p>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-lg border border-muted hover:border-accent-primary transition-all bg-muted/20 hover:bg-accent-primary/5"
            >
              <div className="flex-1 truncate text-left">
                <p className="text-sm font-medium">Continue KYC on mobile</p>
                <p className="text-xs text-muted-foreground truncate">{url}</p>
              </div>
              {copied ? (
                <div className="flex items-center gap-2 text-success">
                  <FiCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Copied!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-accent-primary">
                  <FiCopy className="w-4 h-4" />
                  <span className="text-sm font-medium">Copy</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            💡 Why mobile?
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 text-left">
            <li>• Camera access for selfie capture</li>
            <li>• Document photo quality is better</li>
            <li>• Touch interface for better experience</li>
            <li>• Mobile-optimized verification flow</li>
          </ul>
        </div>

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-text-default transition-colors"
          >
            ← Go back and choose different country
          </button>
        )}
      </div>
    </motion.div>
  );
}