import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { usePendingApprovals } from "@/hooks/data/use-approvals";
import { chainLabel, summaryTitle } from "@/lib/passkeyUtils";
import ApprovalCard from "./approval-card";

/**
 * Pending approvals inbox (spec §2d). Requests created by partner apps,
 * the API / SDK / MCP, or automations (auto-swap) land here until the
 * user approves them with a passkey or rejects them.
 */
export default function Approvals() {
  const navigate = useNavigate();
  const { data, isLoading } = usePendingApprovals();
  const [openId, setOpenId] = useState<string | null>(null);
  const items = data ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full flex flex-col bg-app-background"
    >
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/60">
        <button
          onClick={() => (openId ? setOpenId(null) : navigate(-1))}
          className="p-2 -ml-2 hover:bg-surface-subtle rounded-lg"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-text-default" />
        </button>
        <h2 className="text-lg font-semibold text-text-default">Approvals</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {openId ? (
          <ApprovalCard id={openId} />
        ) : isLoading ? (
          <p className="text-center text-sm text-text-subtle py-10">Loading…</p>
        ) : items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-12 h-12 mx-auto rounded-xl bg-surface-subtle flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-text-subtle" />
            </div>
            <p className="text-[15px] font-medium text-text-default">No pending requests</p>
            <p className="text-[13px] text-text-subtle mt-1">
              When an app or integration asks to move funds from your wallet, it shows up here for
              your passkey approval.
            </p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            {items.map((a) => (
              <button
                key={a.id}
                onClick={() => setOpenId(a.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-default truncate">{summaryTitle(a.summary)}</p>
                  <p className="text-xs text-text-subtle">
                    {a.chainId ? `${chainLabel(a.chainId)} · ` : ""}
                    {a.expiresAt ? `Expires ${new Date(a.expiresAt).toLocaleTimeString()}` : "Pending"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-subtle" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
