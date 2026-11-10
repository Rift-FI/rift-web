import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { Building2, Receipt, Smartphone, Store, Wallet } from "lucide-react";
import Pay from "@/features/pay";
import useAnalytics from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { Page, PageHeader } from "@/v2/ui";
import SendWallet from "./send-wallet";

type Method = "wallet" | "mobile" | "bank" | "till" | "paybill";

const DESTINATIONS: { value: Method; label: string; icon: typeof Wallet }[] = [
  { value: "mobile", label: "Mobile money", icon: Smartphone },
  { value: "bank", label: "Bank", icon: Building2 },
  { value: "till", label: "Till", icon: Store },
  { value: "paybill", label: "Paybill", icon: Receipt },
  { value: "wallet", label: "Wallet", icon: Wallet },
];

/**
 * Send: one page for every destination — a wallet address, M-Pesa and other
 * mobile money, bank accounts, tills and paybills.
 */
export default function Send() {
  const [params, setParams] = useSearchParams();
  const { logEvent } = useAnalytics();
  const raw = params.get("method") as Method | null;
  const method: Method = raw && DESTINATIONS.some((d) => d.value === raw) ? raw : "mobile";

  useEffect(() => {
    logEvent("PAGE_VISIT_SEND", { method });
  }, [method]);

  return (
    <Page>
      <PageHeader title="Send" />
      <div role="radiogroup" aria-label="Send to" className="mb-6 grid max-w-[640px] grid-cols-5 gap-2" data-testid="send-destinations">
        {DESTINATIONS.map((d) => {
          const active = d.value === method;
          return (
            <button
              key={d.value}
              type="button"
              role="radio"
              aria-checked={active}
              data-testid={`method-${d.value}`}
              onClick={() => setParams({ method: d.value }, { replace: true })}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-3 transition-colors cursor-pointer",
                active ? "bg-teal-50 text-accent-primary ring-2 ring-accent-primary" : "bg-card text-ink-2 ring-1 ring-hairline hover:ring-hairline-strong"
              )}
            >
              <d.icon className="h-5 w-5" aria-hidden="true" />
              <span className="w-full truncate text-center text-[12px] font-semibold">{d.label}</span>
            </button>
          );
        })}
      </div>
      {method === "wallet" ? (
        <SendWallet />
      ) : (
        <div className="max-w-[760px]">
          <Pay key={method} method={method} />
        </div>
      )}
    </Page>
  );
}
