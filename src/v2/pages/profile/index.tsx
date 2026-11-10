import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import posthog from "posthog-js";
import { BadgeCheck, Check, ChevronRight, FileDown, KeyRound, LogOut, Pencil, Wallet, X } from "lucide-react";
import { StatementSheet } from "@/v2/pages/statements/statement-sheet";
import { IdentitySheet } from "@/v2/pages/kyc/identity-sheet";
import useKYCStatus from "@/hooks/data/use-kyc-status";
import useUser from "@/hooks/data/use-user";
import useUpdateUser from "@/hooks/data/use-update-user";
import useAnalytics from "@/hooks/use-analytics";
import PaymentAccountSetup from "@/components/ui/payment-account-setup";
import { APP_VERSION } from "@/utils/auto-update";
import { Button, Card, CopyButton, INPUT_CLASS, Page, PageHeader, StatusPill } from "@/v2/ui";

/**
 * Settings: profile basics, payout destination, security (passkeys) and
 * connected apps. Nothing else — the console is payments-only.
 */
export default function Settings() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { data: user, isLoading: userLoading } = useUser();
  const updateUserMutation = useUpdateUser();
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const kyc = useKYCStatus();
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    logEvent("PAGE_VISIT_PROFILE");
  }, []);

  const userDisplayName: string | undefined = user?.displayName || user?.display_name;
  useEffect(() => {
    if (userDisplayName && !isEditingName) setDisplayName(userDisplayName);
  }, [userDisplayName]);

  const paymentAccountRaw = user?.paymentAccount || user?.payment_account;
  const paymentAccountLabel = (() => {
    if (!paymentAccountRaw) return null;
    try {
      const account = JSON.parse(paymentAccountRaw);
      return `${account.institution} · ${account.accountIdentifier}`;
    } catch {
      return "Configured";
    }
  })();
  const walletAddress: string = (user as any)?.evmAddress || (user as any)?.address || localStorage.getItem("address") || "";
  const signInContact = user?.email || user?.phoneNumber || user?.externalId || "";

  const handleUpdatePaymentAccount = async (paymentAccount: string) => {
    try {
      await updateUserMutation.mutateAsync({ paymentAccount });
      toast.success("Withdrawal account updated");
    } catch {
      toast.error("Failed to update withdrawal account");
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Business name cannot be empty");
      return;
    }
    try {
      await updateUserMutation.mutateAsync({ displayName: displayName.trim() });
      setIsEditingName(false);
      toast.success("Business name updated");
    } catch {
      toast.error("Failed to update business name");
    }
  };

  const onLogOut = () => {
    logEvent("SIGN_OUT", { reason: "manual_logout" });
    posthog.reset();
    localStorage.clear();
    navigate("/auth");
  };

  return (
    <Page width="narrow">
      <PageHeader title="Settings" />

      <div className="space-y-6">
        <Card aria-labelledby="settings-profile-title">
          <SettingsHeader id="settings-profile-title" title="Profile" />
          <div className="divide-y divide-hairline">
            <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center">
              <span className="text-[13.5px] font-medium text-ink-2 sm:w-[180px]">Business name</span>
              {isEditingName ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateDisplayName()}
                    placeholder="Your business name"
                    aria-label="Business name"
                    className={`${INPUT_CLASS} !h-10`}
                    autoFocus
                  />
                  <Button onClick={handleUpdateDisplayName} disabled={updateUserMutation.isPending} aria-label="Save name">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    aria-label="Cancel"
                    onClick={() => {
                      setIsEditingName(false);
                      setDisplayName(userDisplayName || "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="truncate text-[14.5px] font-semibold text-ink">{userLoading ? "…" : userDisplayName || "Not set"}</span>
                  <Button variant="secondary" size="sm" onClick={() => setIsEditingName(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
            <KeyValue label="Sign-in">{signInContact || "—"}</KeyValue>
            <KeyValue label="Account address">
              <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                <span className="truncate font-mono text-[13px]">{walletAddress ? `${walletAddress.slice(0, 10)}…${walletAddress.slice(-8)}` : "—"}</span>
                {walletAddress && <CopyButton value={walletAddress} label="Copy account address" />}
              </span>
            </KeyValue>
          </div>
        </Card>

        <Card aria-labelledby="settings-payouts-title">
          <SettingsHeader id="settings-payouts-title" title="Payouts" />
          <SettingsRow
            id="settings-withdrawal-account"
            icon={<Wallet className="h-4 w-4" />}
            title="Withdrawal account"
            description={paymentAccountLabel || "Not set"}
            onClick={() => setShowPaymentSetup(true)}
            badge={paymentAccountLabel ? undefined : <StatusPill status="pending" label="Not set" />}
          />
        </Card>

        <Card aria-labelledby="settings-security-title">
          <SettingsHeader id="settings-security-title" title="Security" />
          <SettingsRow
            id="settings-passkeys"
            icon={<KeyRound className="h-4 w-4" />}
            title="Passkeys"
            description="Approve payments and recover your wallet"
            onClick={() => navigate("/app/settings/security/passkeys")}
          />
        </Card>

        <Card aria-labelledby="settings-identity-title">
          <SettingsHeader id="settings-identity-title" title="Identity" />
          <SettingsRow
            id="settings-identity"
            icon={<BadgeCheck className="h-4 w-4" />}
            title="Identity verification"
            description={kyc.isLoading ? "Checking…" : kyc.isKYCVerified ? "Verified" : kyc.isUnderReview ? "Under review" : "Not verified"}
            badge={
              kyc.isLoading ? undefined : (
                <StatusPill
                  status={kyc.isKYCVerified ? "completed" : kyc.isUnderReview ? "processing" : "expired"}
                  label={kyc.isKYCVerified ? "Verified" : kyc.isUnderReview ? "Under review" : "Not verified"}
                />
              )
            }
            onClick={() => !kyc.isKYCVerified && !kyc.isUnderReview && setIdentityOpen(true)}
          />
        </Card>

        <Card aria-labelledby="settings-statements-title">
          <SettingsHeader id="settings-statements-title" title="Statements" />
          <SettingsRow
            id="settings-statement"
            icon={<FileDown className="h-4 w-4" />}
            title="Download statement"
            description="PDF or CSV, by email or download"
            onClick={() => setStatementOpen(true)}
          />
        </Card>


        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" onClick={onLogOut} className="!text-danger">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
          <p className="text-[12px] text-ink-3">Rift v{APP_VERSION}</p>
        </div>
      </div>

      <StatementSheet open={statementOpen} onClose={() => setStatementOpen(false)} />
      <IdentitySheet open={identityOpen} onClose={() => setIdentityOpen(false)} />
      <PaymentAccountSetup
        isOpen={showPaymentSetup}
        onClose={() => setShowPaymentSetup(false)}
        onSave={handleUpdatePaymentAccount}
        currentPaymentAccount={paymentAccountRaw}
      />
    </Page>
  );
}

function SettingsHeader({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <div className="border-b border-hairline px-5 py-4">
      <h2 id={id} className="text-[15px] font-semibold text-ink">
        {title}
      </h2>
      {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
    </div>
  );
}

function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center">
      <span className="text-[13.5px] font-medium text-ink-2 sm:w-[180px]">{label}</span>
      <span className="min-w-0 flex-1 text-[14px] text-ink">{children}</span>
    </div>
  );
}

function SettingsRow({
  id,
  icon,
  title,
  description,
  onClick,
  badge,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  onClick: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <button id={id} type="button" onClick={onClick} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-subtle cursor-pointer">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-subtle text-accent-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-ink">{title}</span>
        {description && <span className="block truncate text-[12.5px] text-ink-3">{description}</span>}
      </span>
      {badge && <span className="hidden flex-shrink-0 sm:inline-flex">{badge}</span>}
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-3" aria-hidden="true" />
    </button>
  );
}
