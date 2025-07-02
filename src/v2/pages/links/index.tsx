import { useState } from "react";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import { cn } from "@/lib/utils";
import { LinkItem, LinkItemSkeleton } from "./components/LinkItem";

export default function Links() {
  const [linksType, setLinksType] = useState<"send" | "request">("send");

  const { listRequestLinks, listSendLinks } = usePaymentLinks();

  return (
    <div className="w-full h-full overflow-y-auto mb-18 p-4">
      <h1 className="text-xl text-center font-bold text-white">Links</h1>

      <div className="flex bg-muted/30 rounded-lg p-1 w-full mt-4">
        <button
          onClick={() => setLinksType("send")}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            linksType == "send"
              ? "bg-white text-black shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Sent Links
        </button>

        <button
          onClick={() => setLinksType("request")}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            linksType == "request"
              ? "bg-white text-black shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Payment Requests
        </button>
      </div>

      {!listSendLinks.isPending && !listRequestLinks.isPending && (
        <div className="mt-2">
          {linksType == "request" &&
            listRequestLinks.data?.data?.length == 0 && (
              <p className="text-center tex-lg font-semibold">
                Start requesting payments via links to see them listed here
              </p>
            )}

          {linksType == "send" && listSendLinks.data?.data?.length == 0 && (
            <p className="text-center tex-lg font-semibold">
              Start sending links to see them listed here
            </p>
          )}
        </div>
      )}

      {listRequestLinks.isPending || listSendLinks.isPending ? (
        <div className="space-y-2 px-4 mt-4">
          <LinkItemSkeleton />
          <LinkItemSkeleton />
          <LinkItemSkeleton />
          <LinkItemSkeleton />
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {linksType == "send" &&
            listSendLinks.data?.data?.map((link) => (
              <LinkItem key={link.id} linkdata={link} />
            ))}

          {linksType == "request" &&
            listRequestLinks.data?.data?.map((link) => (
              <LinkItem key={link.id} requestlinkdata={link} />
            ))}
        </div>
      )}
    </div>
  );
}
