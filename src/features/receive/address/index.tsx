import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { BiCopy } from "react-icons/bi";
import { ExternalLink } from "lucide-react";
import { FiX } from "react-icons/fi";
import useAnalaytics from "@/hooks/use-analytics";
import { Button } from "@/components/ui/button";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import { shortenString } from "@/lib/utils";

export default function ReceiveFromAddress() {
  const navigate = useNavigate();
  const { logEvent } = useAnalaytics();
  const isDesktop = useDesktopDetection();

  const address = localStorage.getItem("address");

  const onCopyAddress = () => {
    navigator.clipboard.writeText(address as string);
    toast.success("Address copied to clipboard");
    logEvent("COPY_ADDRESS");
  };

  const onViewOnBaseScan = () => {
    const baseScanUrl = `https://basescan.org/address/${address}`;
    window.open(baseScanUrl, '_blank');
    logEvent("VIEW_ON_BASESCAN");
  };

  const onClose = () => {
    navigate(-1);
  };

  // Desktop modal view
  if (isDesktop) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-text-default">Your Address</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full flex flex-row items-center justify-center mb-6">
              <div className="w-fit bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <QRCodeSVG value={address as string} size={200} />
              </div>
            </div>

            <div className="w-full flex flex-col items-center justify-center gap-3 mb-6">
              <p className="text-center font-medium text-sm break-words break-all bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                {address}
              </p>

              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="secondary"
                  onClick={onCopyAddress}
                  className="w-full rounded-2xl"
                >
                  <BiCopy className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Copy Address</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={onViewOnBaseScan}
                  className="w-full rounded-2xl"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">View on Base Scan</span>
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Use your address to check your onchain history and topup your wallet
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Mobile page view
  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full p-4"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium">Your Address</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="w-full flex flex-row items-center justify-center mt-8">
        <div className="w-fit bg-white p-4 rounded-2xl border border-border shadow-sm">
          <QRCodeSVG value={address as string} size={200} />
        </div>
      </div>

      <div className="mt-5 w-full flex flex-col items-center justify-center gap-3">
        <p className="text-center font-medium text-sm break-words break-all bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          {address}
        </p>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            variant="secondary"
            onClick={onCopyAddress}
            className="w-full rounded-2xl"
          >
            <BiCopy className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Copy Address</span>
          </Button>

          <Button
            variant="outline"
            onClick={onViewOnBaseScan}
            className="w-full rounded-2xl"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">View on Base Scan</span>
          </Button>
        </div>
      </div>

      <p className="mt-6 mb-12 text-center text-sm text-gray-600">
        Use your address to check your onchain history and topup your wallet
      </p>

      <div className="h-fit fixed bottom-0 left-0 right-0 p-4 py-2 border-t border-gray-200 bg-app-background">
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}

