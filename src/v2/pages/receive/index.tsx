import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import useUser from "@/hooks/data/use-user";
import useAnalytics from "@/hooks/use-analytics";
import { Button, CopyButton, Skeleton } from "@/v2/ui";

// Chains Rift supports for USDC / USDT deposits. Anything else is lost.
const NETWORKS = ["Base", "Ethereum", "Polygon", "Arbitrum", "Celo"];

/** Your wallet address + QR, for receiving USDC / USDT (Add funds → Address). */
export function AddressPanel() {
  const { logEvent } = useAnalytics();
  const { data: user, isLoading } = useUser();
  const address = ((user as any)?.evmAddress as string | undefined) || ((user as any)?.address as string | undefined) || localStorage.getItem("address") || "";

  const copy = () => {
    navigator.clipboard.writeText(address).catch(() => undefined);
    toast.success("Address copied");
    logEvent("COPY_ADDRESS");
  };
  const share = async () => {
    const text = `My Rift address for USDC / USDT (${NETWORKS.join(", ")}):\n${address}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rift address", text });
        return;
      }
    } catch {
      /* cancelled */
    }
    copy();
  };

  return (
    <div className="flex flex-col items-center text-center" data-testid="address-panel">
      <div className="rounded-3xl bg-[#ffffff] p-4 ring-1 ring-hairline" data-testid="receive-qr">
        {address ? (
          <QRCodeSVG value={address} size={196} level="M" fgColor="#10181a" bgColor="#ffffff" aria-label="Wallet address QR code" role="img" />
        ) : (
          <Skeleton className="h-[196px] w-[196px]" />
        )}
      </div>
      <div className="mt-5 flex w-full max-w-[420px] items-start gap-1 rounded-2xl bg-surface-subtle px-4 py-3 text-left">
        {isLoading && !address ? (
          <Skeleton className="h-4 w-full" />
        ) : (
          <code data-testid="receive-address" className="min-w-0 flex-1 break-all font-mono text-[13.5px] leading-relaxed text-ink">
            {address}
          </code>
        )}
        {address && <CopyButton value={address} label="Copy address" />}
      </div>
      <div className="mt-4 grid w-full max-w-[420px] grid-cols-2 gap-2">
        <Button onClick={copy} disabled={!address}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy address
        </Button>
        <Button variant="secondary" onClick={share} disabled={!address}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share
        </Button>
      </div>
      <p className="mt-5 flex max-w-[420px] items-start gap-2 text-left text-[12.5px] text-ink-3" role="note">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-pending" aria-hidden="true" />
        Only USDC or USDT on {NETWORKS.join(", ")}. Anything else is lost.
      </p>
    </div>
  );
}
