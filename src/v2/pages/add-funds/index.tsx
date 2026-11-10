import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import useAnalytics from "@/hooks/use-analytics";
import { useCountries } from "@/v2/lib/countries";
import { Page, PageHeader, Segmented, Skeleton } from "@/v2/ui";
import { PaymentLinkPanel } from "@/features/request";
import { AddressPanel } from "@/v2/pages/receive";
import { BuyPanel } from "./buy";

type Tab = "buy" | "link" | "address";

/**
 * Add funds: buy with local currency (when the onramp is on), share a
 * payment link, or receive to your wallet address.
 */
export default function AddFunds() {
  const [params, setParams] = useSearchParams();
  const { logEvent } = useAnalytics();
  const { countries, isLoading } = useCountries();
  const [disabled, setDisabled] = useState(false);
  const buyOn = !disabled && countries.some((c) => c.onrampActive);
  const raw = params.get("tab") as Tab | null;
  const tab: Tab = raw === "link" || raw === "address" ? raw : raw === "buy" && buyOn ? "buy" : buyOn ? "buy" : "link";

  useEffect(() => {
    logEvent("TOPUP_BUTTON_CLICKED");
  }, []);

  const options = [
    ...(buyOn ? [{ value: "buy" as Tab, label: "Buy", testId: "tab-buy" }] : []),
    { value: "link" as Tab, label: "Payment link", testId: "tab-link" },
    { value: "address" as Tab, label: "Address", testId: "tab-address" },
  ];

  return (
    <Page width="narrow">
      <PageHeader title="Add funds" />
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="mb-6">
          <Segmented label="Add funds with" value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} options={options} />
        </div>
      )}
      {tab === "buy" && buyOn && (
        <div className="rounded-2xl bg-card p-5 ring-1 ring-hairline">
          <BuyPanel countries={countries} onDisabled={() => setDisabled(true)} />
        </div>
      )}
      {tab === "link" && <PaymentLinkPanel />}
      {tab === "address" && (
        <div className="rounded-2xl bg-card p-6 ring-1 ring-hairline">
          <AddressPanel />
        </div>
      )}
    </Page>
  );
}
