import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { BiCopy } from "react-icons/bi";
import { ExternalLink } from "lucide-react";
import useAnalaytics from "@/hooks/use-analytics";
import { Button } from "@/components/ui/button";
import ActionButton from "@/components/ui/action-button";
import { shortenString } from "@/lib/utils";

export default function ReceiveFromAddress() {
  const navigate = useNavigate();
  const { logEvent } = useAnalaytics();

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

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full p-4"
    >
      <h2 className="text-center text-xl font-medium">Your Address</h2>

      <div className="w-full flex flex-row items-center justify-center mt-12">
        <div className="w-fit bg-white p-4 rounded-2xl border border-border shadow-sm">
          <QRCodeSVG value={address as string} size={200} />
        </div>
      </div>

      <div className="mt-5 w-full flex flex-col items-center justify-center gap-3">
        <p className="text-center font-medium text-sm break-words break-all">
          {shortenString(address as string)}
        </p>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            variant="secondary"
            onClick={onCopyAddress}
            className="w-full rounded-3xl"
          >
            <BiCopy className="text-current" />
            <span className="text-sm font-medium">Copy Address</span>
          </Button>

          <Button
            variant="outline"
            onClick={onViewOnBaseScan}
            className="w-full rounded-3xl"
          >
            <ExternalLink className="w-4 h-4 text-current" />
            <span className="text-sm font-medium">View on Base Scan</span>
          </Button>
        </div>
      </div>

      <p className="mt-6 mb-12 text-center text-sm">
        Use your address to check your onchain history and topup your wallet
      </p>

      <div className="h-fit fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={onClose}
          variant="ghost"
          className="p-[0.5rem] text-md font-medium border-0 bg-secondary hover:bg-surface-subtle transition-all"
        >
          Close
        </ActionButton>
      </div>
    </motion.div>
  );
}

