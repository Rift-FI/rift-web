import { useLocation, useNavigate } from "react-router";
import { ChevronRight, Inbox } from "lucide-react";
import { usePendingApprovals } from "@/hooks/data/use-approvals";

/**
 * Slim banner shown in the authenticated shells when partner / API /
 * automation requests are waiting for the user's passkey approval.
 */
export default function PendingApprovalsBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = usePendingApprovals();
  const count = data?.length ?? 0;
  if (count === 0 || location.pathname.startsWith("/app/approvals")) return null;

  return (
    <button
      onClick={() => navigate("/app/approvals")}
      className="w-full flex items-center gap-3 px-4 py-2.5 bg-accent-primary/5 border-b border-accent-primary/15 text-left hover:bg-accent-primary/10 transition-colors"
      data-testid="pending-approvals-banner"
    >
      <Inbox className="w-4 h-4 text-accent-primary flex-shrink-0" />
      <span className="flex-1 text-[13px] font-medium text-text-default">
        {count === 1 ? "1 request is waiting for your approval" : `${count} requests are waiting for your approval`}
      </span>
      <ChevronRight className="w-4 h-4 text-text-subtle" />
    </button>
  );
}
