import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowDownLeft, ArrowUpRight, ListOrdered, Search } from "lucide-react";
import useAnalytics from "@/hooks/use-analytics";
import { usePayments, type Payment } from "@/v2/lib/payments";
import { Button, Card, EmptyState, INPUT_CLASS, Page, PageHeader, Segmented, SkeletonRows, type Status } from "@/v2/ui";
import { PaymentDrawer, PaymentListItem, PaymentsTable } from "./components";

type Direction = "all" | "in" | "out";
const PAGE_SIZE = 25;

export default function Payments() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const [params, setParams] = useSearchParams();
  const { data, isLoading } = usePayments();
  const [direction, setDirection] = useState<Direction>("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [query, setQuery] = useState(params.get("q") || "");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<Payment | null>(null);

  useEffect(() => {
    logEvent("PAGE_VISIT_PAYMENTS");
  }, []);

  // Keep the top-bar search and this filter in sync.
  useEffect(() => {
    setQuery(params.get("q") || "");
  }, [params]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((p) => {
      if (direction !== "all" && p.direction !== direction) return false;
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return [p.title, p.method, p.counterparty, p.reference, p.receiptNumber, p.txHash, p.currency, String(p.amount)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [data, direction, status, query]);

  const visible = filtered.slice(0, limit);
  const hasFilters = direction !== "all" || status !== "all" || !!query;

  return (
    <Page width="wide">
      <PageHeader
        title="Activity"
        description="Every deposit, payout and transfer on your account."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/app/receive")}>
              <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
              Receive
            </Button>
            <Button onClick={() => navigate("/app/send")}>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              Send
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-hairline p-4 md:flex-row md:items-center">
          <div className="md:w-[300px]">
            <Segmented
              size="sm"
              label="Direction"
              value={direction}
              onChange={(v) => {
                setDirection(v);
                setLimit(PAGE_SIZE);
              }}
              options={[
                { value: "all", label: "All" },
                { value: "in", label: "Incoming" },
                { value: "out", label: "Outgoing" },
              ]}
            />
          </div>
          <div className="flex flex-1 gap-3">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Filter payments</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLimit(PAGE_SIZE);
                  const next = new URLSearchParams(params);
                  if (e.target.value) next.set("q", e.target.value);
                  else next.delete("q");
                  setParams(next, { replace: true });
                }}
                placeholder="Reference, address, amount"
                className={`${INPUT_CLASS} !h-10 pl-9 text-[14px]`}
              />
            </label>
            <label className="w-[140px] flex-shrink-0">
              <span className="sr-only">Status</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as Status | "all");
                  setLimit(PAGE_SIZE);
                }}
                className={`${INPUT_CLASS} !h-10 cursor-pointer text-[14px]`}
              >
                <option value="all">All statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading && data.length === 0 ? (
          <SkeletonRows rows={6} />
        ) : filtered.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="No payments match these filters"
              description="Try a different reference or clear the filters."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDirection("all");
                    setStatus("all");
                    setQuery("");
                    setParams({}, { replace: true });
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ListOrdered className="h-5 w-5" />}
              title="No payments yet"
              description="Payments you send, receive or pay out will appear here with their status and receipts."
              action={<Button onClick={() => navigate("/app/receive")}>Receive your first payment</Button>}
            />
          )
        ) : (
          <>
            <div className="hidden md:block">
              <PaymentsTable payments={visible} onOpen={setOpen} />
            </div>
            <ul className="divide-y divide-hairline md:hidden" aria-label="Payments">
              {visible.map((p) => (
                <PaymentListItem key={p.id} payment={p} onOpen={setOpen} />
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-hairline px-5 py-3 text-[13px] text-ink-3">
              <span className="tabular-numeric">
                {visible.length} of {filtered.length} payment{filtered.length === 1 ? "" : "s"}
              </span>
              {filtered.length > visible.length && (
                <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                  Show more
                </Button>
              )}
            </div>
          </>
        )}
      </Card>

      <PaymentDrawer payment={open} onClose={() => setOpen(null)} />
    </Page>
  );
}
