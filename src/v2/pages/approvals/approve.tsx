import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import rift from "@/lib/rift";
import ApprovalCard from "./approval-card";
import PasskeySetupGate from "@/components/passkey/passkey-setup-gate";
import { POST_LOGIN_REDIRECT_KEY } from "./redirect";

/**
 * /approve/:id — the link partners / SDK / MCP hand to the user
 * (`approvalUrl`). Standalone (no app chrome) so it works as a landing
 * page; sends the user through login first when needed and comes back.
 */
export default function ApprovePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      try {
        localStorage.setItem(POST_LOGIN_REDIRECT_KEY, `/approve/${id ?? ""}`);
      } catch {
        /* ignore */
      }
      navigate("/auth", { replace: true });
      return;
    }
    rift.setBearerToken(token);
  }, [token, id]);

  if (!token || !id) return null;

  return (
    <div className="h-full w-full overflow-y-auto bg-canvas">
      <header className="flex h-14 items-center justify-between border-b border-hairline bg-card px-4 sm:px-6">
        <span className="flex items-center gap-2.5">
          <img src="/rift.png" alt="" className="h-7 w-7 rounded-md" />
          <span className="text-[15px] font-semibold text-ink">Rift</span>
        </span>
        <button
          onClick={() => navigate("/app/approvals")}
          className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer"
        >
          All requests
        </button>
      </header>
      <main className="flex flex-col items-center px-4 py-10 sm:py-16">
        <ApprovalCard id={id} />
      </main>
      <PasskeySetupGate />
    </div>
  );
}
