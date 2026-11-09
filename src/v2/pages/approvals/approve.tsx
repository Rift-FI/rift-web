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
    <div className="min-h-screen w-full bg-app-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-text-default">Rift</span>
        <button
          onClick={() => navigate("/app/approvals")}
          className="text-[13px] font-medium text-text-subtle hover:text-text-default"
        >
          All requests
        </button>
      </div>
      <ApprovalCard id={id} />
      <PasskeySetupGate />
    </div>
  );
}
