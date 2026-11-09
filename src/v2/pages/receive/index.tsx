import { useEffect } from "react";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, ChevronRight, Link2, Share2, Smartphone, Receipt } from "lucide-react";
import { toast } from "sonner";
import useUser from "@/hooks/data/use-user";
import useAnalytics from "@/hooks/use-analytics";
import { Button, Card, CardHeader, CopyButton, Page, PageHeader, Skeleton } from "@/v2/ui";

// Chains Rift supports for USDC / USDT deposits. Anything else is lost.
const NETWORKS = [
  { name: "Base", explorer: "https://basescan.org/address/" },
  { name: "Ethereum", explorer: "https://etherscan.io/address/" },
  { name: "Polygon", explorer: "https://polygonscan.com/address/" },
  { name: "Arbitrum", explorer: "https://arbiscan.io/address/" },
  { name: "Celo", explorer: "https://celoscan.io/address/" },
];

export default function Receive() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { data: user, isLoading } = useUser();
  const address =
    ((user as any)?.evmAddress as string | undefined) || ((user as any)?.address as string | undefined) || localStorage.getItem("address") || "";

  useEffect(() => {
    logEvent("PAGE_VISIT_RECEIVE");
  }, []);

  const share = async () => {
    const text = `My Rift USDC / USDT address (Base, Ethereum, Polygon, Arbitrum, Celo):\n${address}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rift deposit address", text });
        return;
      }
    } catch {
      /* cancelled */
    }
    await navigator.clipboard.writeText(address).catch(() => undefined);
    toast.success("Address copied to clipboard");
  };

  return (
    <Page>
      <PageHeader title="Receive" description="Get paid in stablecoins to your account address, or by mobile money and payment links." />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader title="Account address" description="Accepts USDC and USDT on supported networks" />
          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-start sm:p-6">
            <div className="rounded-lg border border-hairline bg-white p-3" data-testid="receive-qr">
              {address ? (
                <QRCodeSVG value={address} size={176} level="M" fgColor="#10181a" bgColor="#ffffff" aria-label="Deposit address QR code" role="img" />
              ) : (
                <Skeleton className="h-[176px] w-[176px]" />
              )}
            </div>
            <div className="w-full min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink-3">Address</p>
              <div className="mt-1.5 flex items-start gap-1 rounded-md border border-hairline bg-surface-subtle px-3 py-2.5">
                {isLoading && !address ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  <code data-testid="receive-address" className="min-w-0 flex-1 break-all font-mono text-[13.5px] leading-relaxed text-ink">
                    {address}
                  </code>
                )}
                {address && <CopyButton value={address} label="Copy address" />}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(address).catch(() => undefined);
                    toast.success("Address copied to clipboard");
                    logEvent("COPY_ADDRESS");
                  }}
                  disabled={!address}
                >
                  Copy address
                </Button>
                <Button variant="secondary" onClick={share} disabled={!address}>
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share
                </Button>
              </div>
              <div className="mt-5">
                <p className="text-[12.5px] font-medium text-ink-3">Supported networks</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {NETWORKS.map((n) => (
                    <li key={n.name}>
                      <a
                        href={`${n.explorer}${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center rounded-full border border-hairline px-2.5 text-[12.5px] font-medium text-ink-2 hover:border-accent-primary/40 hover:text-accent-primary"
                      >
                        {n.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="flex gap-2.5 border-t border-hairline bg-tint-pending/60 px-5 py-3.5 text-[12.5px] text-ink-2 sm:px-6" role="note">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-pending" aria-hidden="true" />
            <p>
              Only send <strong className="font-semibold text-ink">USDC or USDT</strong> on the networks above. Other tokens or networks are
              permanently lost.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Other ways to get paid" />
          <ul className="p-2">
            {[
              { icon: Receipt, label: "Request a payment", sub: "Create a payment link for a specific amount", to: "/app/request?type=request" },
              { icon: Link2, label: "Payment links", sub: "Your reusable checkout QR and links", to: "/app/payment-links" },
              { icon: Smartphone, label: "Add funds by mobile money", sub: "Top up from M-Pesa and other wallets", to: "/app/request?type=topup" },
            ].map((a) => (
              <li key={a.label}>
                <button type="button" onClick={() => navigate(a.to)} className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-surface-subtle cursor-pointer">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-hairline text-ink-2">
                    <a.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-ink">{a.label}</span>
                    <span className="block text-[12.5px] text-ink-3">{a.sub}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
