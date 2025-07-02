import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { BiCopy } from "react-icons/bi";
import { analyticsLog } from "@/analytics/events";
import { usePlatformDetection } from "@/utils/platform";

export default function MyAddress() {
  const address = localStorage.getItem("address");
  const { telegramUser } = usePlatformDetection();

  const onCopyAddress = () => {
    navigator.clipboard.writeText(address as string);
    
    // Track copy action for analytics
    const telegramId = telegramUser?.id?.toString() || "UNKNOWN USER";
    analyticsLog("COPY_REFFERAL", { telegram_id: telegramId });
    
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Receive Crypto</h2>
        <p className="text-muted-foreground">
          Share your address or QR code to receive crypto
        </p>
      </div>

      <div className="w-full flex flex-row items-center justify-center">
        <div className="w-fit bg-white p-4 rounded-xl border border-border shadow-sm">
          <QRCodeSVG value={address as string} size={200} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-center font-medium">Your Ethereum Address</p>
        <div className="flex flex-col items-center justify-center gap-3 bg-sidebar border-2 border-border rounded-lg p-4">
          <p className="text-center font-semibold text-sm break-words break-all">
            {address}
          </p>
          <button
            className="flex flex-row items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
            onClick={onCopyAddress}
          >
            <BiCopy className="text-current" />
            Copy Address
          </button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Use this address to receive crypto in your Sphere wallet. Share the QR
          code or copy the address above.
        </p>
      </div>
    </div>
  );
}
