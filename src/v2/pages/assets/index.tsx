import { useEffect } from "react";
import { Coins } from "lucide-react";
import useOwnedTokens from "@/hooks/data/use-owned-tokens";
import useAnalytics from "@/hooks/use-analytics";
import { EmptyState, Page, PageHeader, Skeleton } from "@/v2/ui";
import AssetRow from "./asset-row";

/** Every token the wallet holds, per chain (Advanced → Assets). */
export default function Assets() {
  const { logEvent } = useAnalytics();
  const { data: tokens, isLoading } = useOwnedTokens(undefined, true);

  useEffect(() => {
    logEvent("PAGE_VISIT_WALLET");
  }, []);

  return (
    <Page width="narrow">
      <PageHeader back="/app/advanced" title="Assets" />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : tokens && tokens.length > 0 ? (
        <div className="space-y-2" data-testid="assets-list">
          {tokens.map((token) => (
            <AssetRow key={`${token.backend_id ?? token.id}-${token.chain_id}`} token={token} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Coins className="h-5 w-5" />} title="No tokens yet" />
      )}
    </Page>
  );
}
