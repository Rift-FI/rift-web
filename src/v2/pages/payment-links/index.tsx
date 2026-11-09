import { useState } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { ExternalLink, FileText, Plus } from "lucide-react";
import useInvoices, { type Invoice } from "@/hooks/data/use-invoices";
import Merchant from "@/features/merchant";
import { Button, Card, CardHeader, CopyButton, EmptyState, Page, PageHeader, Row, Rows, Segmented, SideSheet, SkeletonRows, StatusPill, formatMoney, type Status } from "@/v2/ui";

const STATUS: Record<Invoice["status"], Status> = { PENDING: "pending", COMPLETED: "succeeded", EXPIRED: "failed" };
const STATUS_LABEL: Record<Invoice["status"], string> = { PENDING: "Open", COMPLETED: "Paid", EXPIRED: "Expired" };

type Filter = "all" | Invoice["status"];

/** Payment links + invoices created by the merchant API, plus the standing checkout QR. */
export default function PaymentLinks() {
  const navigate = useNavigate();
  const { data, isLoading } = useInvoices({ sortBy: "createdAt", sortOrder: "desc" });
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Invoice | null>(null);
  const invoices = (Array.isArray(data) ? data : []).filter((i) => Number(i.amount) > 0 || i.status !== "PENDING");
  const rows = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  return (
    <Page width="wide">
      <PageHeader
        title="Payment links"
        description="Request a specific amount with a link, or share your standing checkout QR. Payers can settle from any stablecoin wallet."
        actions={
          <Button onClick={() => navigate("/app/request?type=request")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New payment link
          </Button>
        }
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <div className="flex flex-col gap-3 border-b border-hairline p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Invoices and links</h2>
            <div className="sm:w-[320px]">
              <Segmented
                size="sm"
                label="Status"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "PENDING", label: "Open" },
                  { value: "COMPLETED", label: "Paid" },
                  { value: "EXPIRED", label: "Expired" },
                ]}
              />
            </div>
          </div>
          {isLoading ? (
            <SkeletonRows rows={4} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title={filter === "all" ? "No payment links yet" : "Nothing here"}
              description="Create a link for a specific amount and share it by WhatsApp, email or QR."
              action={filter === "all" ? <Button onClick={() => navigate("/app/request?type=request")}>Create a payment link</Button> : undefined}
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {rows.map((inv) => (
                <li key={inv.id}>
                  <button type="button" onClick={() => setOpen(inv)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-surface-subtle cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">{inv.description || "Payment link"}</p>
                      <p className="truncate text-[12.5px] text-ink-3">
                        {format(new Date(inv.createdAt), "d MMM yyyy")}
                        {inv.recipientEmail ? ` · ${inv.recipientEmail}` : inv.recipientPhone ? ` · ${inv.recipientPhone}` : ""}
                      </p>
                    </div>
                    <StatusPill status={STATUS[inv.status]} label={STATUS_LABEL[inv.status]} />
                    <span className="w-24 text-right text-[14px] font-semibold text-ink tabular-numeric">{formatMoney(inv.amount, "USD")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Checkout QR" description="Print it at your till or share it anywhere" />
          <div className="p-4">
            <Merchant />
          </div>
        </Card>
      </div>

      <SideSheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.description || "Payment link"}
        description={open ? `Created ${format(new Date(open.createdAt), "d MMM yyyy, HH:mm")}` : undefined}
        footer={
          open?.url && (
            <Button variant="secondary" block onClick={() => window.open(open.url, "_blank", "noopener")}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open payment page
            </Button>
          )
        }
      >
        {open && (
          <div className="space-y-5">
            <div>
              <p className="text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink tabular-numeric">{formatMoney(open.amount, "USD")}</p>
              <div className="mt-3">
                <StatusPill status={STATUS[open.status]} label={STATUS_LABEL[open.status]} />
              </div>
            </div>
            <Rows>
              <Row label="Asset">{`${open.token} on ${open.chain.charAt(0)}${open.chain.slice(1).toLowerCase()}`}</Row>
              {open.recipientEmail && <Row label="Billed to">{open.recipientEmail}</Row>}
              {open.recipientPhone && <Row label="Billed to">{open.recipientPhone}</Row>}
              {open.paidAt && <Row label="Paid">{format(new Date(open.paidAt), "d MMM yyyy, HH:mm")}</Row>}
              {open.expiresAt && <Row label="Expires">{format(new Date(open.expiresAt), "d MMM yyyy")}</Row>}
              <Row label="Link">
                <span className="inline-flex items-center gap-1">
                  <span className="max-w-[200px] truncate font-mono text-[12.5px]">{open.url?.replace(/^https?:\/\//, "")}</span>
                  {open.url && <CopyButton value={open.url} label="Copy link" />}
                </span>
              </Row>
            </Rows>
          </div>
        )}
      </SideSheet>
    </Page>
  );
}
