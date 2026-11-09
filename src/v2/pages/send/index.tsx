import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { Building2, Smartphone, Wallet } from "lucide-react";
import Pay from "@/features/pay";
import useAnalytics from "@/hooks/use-analytics";
import { Page, PageHeader, Segmented } from "@/v2/ui";
import SendWallet from "./send-wallet";

type Method = "wallet" | "mobile" | "bank";
const METHODS: Method[] = ["wallet", "mobile", "bank"];

const COPY: Record<Method, string> = {
  wallet: "Send USDC or USDT to any wallet address. Approved with your passkey.",
  mobile: "Pay out to M-Pesa, Airtel, MTN and other mobile money wallets, paybills and tills.",
  bank: "Pay out to local bank accounts and PIX in local currency.",
};

/**
 * Send: one checkout-style page with a payout-method selector. Wallet
 * transfers use the console's sectioned form; mobile money and bank
 * payouts run the existing offramp flow (same API + passkey signing),
 * pre-filtered to the chosen rail.
 */
export default function Send() {
  const [params, setParams] = useSearchParams();
  const { logEvent } = useAnalytics();
  const raw = params.get("method") as Method | null;
  const method: Method = raw && METHODS.includes(raw) ? raw : "mobile";

  useEffect(() => {
    logEvent("PAGE_VISIT_SEND", { method });
  }, [method]);

  return (
    <Page>
      <PageHeader title="Send money" description={COPY[method]} />
      <div className="mb-6 max-w-[560px]">
        <p id="payout-method-label" className="mb-2 text-[13px] font-medium text-ink-2">
          Payout method
        </p>
        <Segmented
          label="Payout method"
          value={method}
          onChange={(v) => setParams({ method: v }, { replace: true })}
          options={[
            { value: "wallet", label: "Wallet address", icon: <Wallet className="hidden h-4 w-4 sm:block" aria-hidden="true" />, testId: "method-wallet" },
            { value: "mobile", label: "Mobile money", icon: <Smartphone className="hidden h-4 w-4 sm:block" aria-hidden="true" />, testId: "method-mobile" },
            { value: "bank", label: "Bank", icon: <Building2 className="hidden h-4 w-4 sm:block" aria-hidden="true" />, testId: "method-bank" },
          ]}
        />
      </div>
      {method === "wallet" ? <SendWallet /> : <Pay key={method} method={method} />}
    </Page>
  );
}
