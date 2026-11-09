import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { ChevronRight, Inbox } from "lucide-react";
import { usePendingApprovals } from "@/hooks/data/use-approvals";
import { chainLabel, summaryTitle } from "@/lib/passkeyUtils";
import { Card, EmptyState, Page, PageHeader, SkeletonRows, StatusPill } from "@/v2/ui";
import ApprovalCard from "./approval-card";

/**
 * Pending approvals inbox (spec §2d). Requests created by partner apps,
 * the API / SDK / MCP, or automations land here until the user approves
 * them with a passkey or rejects them.
 */
export default function Approvals() {
  const { data, isLoading } = usePendingApprovals();
  const [openId, setOpenId] = useState<string | null>(null);
  const items = data ?? [];

  if (openId) {
    return (
      <Page width="narrow">
        <PageHeader back={() => setOpenId(null)} title="Review request" description="Check the details, then approve with your passkey or reject." />
        <div className="flex justify-center">
          <ApprovalCard id={openId} />
        </div>
      </Page>
    );
  }

  return (
    <Page width="narrow">
      <PageHeader
        title="Approvals"
        description="Requests from connected apps, the API and automations wait here until you approve them with a passkey."
      />
      <Card>
        {isLoading ? (
          <SkeletonRows rows={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="No pending requests"
            description="When an app or integration asks to move funds from your account, it shows up here for your passkey approval."
          />
        ) : (
          <ul className="divide-y divide-hairline" aria-label="Pending requests">
            {items.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(a.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-surface-subtle cursor-pointer"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-accent-primary">
                    <Inbox className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-ink">{summaryTitle(a.summary)}</span>
                    <span className="block text-[12.5px] text-ink-3">
                      {a.chainId ? `${chainLabel(a.chainId)} · ` : ""}
                      {a.expiresAt ? `Expires in ${formatDistanceToNowStrict(new Date(a.expiresAt))}` : "Waiting for approval"}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusPill status="pending" label="Needs approval" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
