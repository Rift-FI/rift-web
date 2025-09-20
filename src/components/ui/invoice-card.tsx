import { formatDistanceToNow } from "date-fns";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Invoice } from "@/hooks/data/use-invoices";

interface InvoiceCardProps {
  invoice: Invoice;
}

export default function InvoiceCard({ invoice }: InvoiceCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard");
  };

  const openInvoiceUrl = () => {
    window.open(invoice.url, '_blank');
  };

  return (
    <div className="bg-surface-subtle rounded-md p-3 border border-surface">
      <div className="flex justify-between items-center mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text-default truncate">
            {invoice.description || "Payment Request"}
          </h3>
          <p className="text-xs text-text-subtle">
            {formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
               <div className="flex-1">
                 <p className="text-sm font-semibold text-text-default">
                   {Number(invoice.amount || 0).toFixed(2)} {invoice.token}
                 </p>
               </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => copyToClipboard(invoice.url)}
            className="p-1 text-xs bg-surface hover:bg-surface-alt rounded transition-colors"
            title="Copy Link"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={openInvoiceUrl}
            className="p-1 text-xs bg-accent-primary text-white hover:bg-accent-secondary rounded transition-colors"
            title="View Invoice"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}