import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { IoChevronBack } from "react-icons/io5";
import useOwnedTokens from "@/hooks/data/use-owned-tokens";
import useAnalytics from "@/hooks/use-analytics";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";
import AssetRow from "./asset-row";
import { Skeleton } from "@/components/ui/skeleton";

export default function Assets() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const isDesktop = useDesktopDetection();
  const { data: tokens, isLoading } = useOwnedTokens(undefined, true);

  useEffect(() => {
    logEvent("PAGE_VISIT_WALLET");
  }, []);

  const content = (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      {!isDesktop && (
        <div className="flex-shrink-0 z-40 bg-surface backdrop-blur-sm border-b border-surface-alt">
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={() => navigate("/app")}
              className="p-1.5 hover:bg-surface-subtle rounded-xl transition-colors"
            >
              <IoChevronBack className="w-5 h-5 text-text-default" />
            </button>
            <h1 className="text-lg font-semibold text-text-default">
              Crypto Assets
            </h1>
            <span className="px-2 py-0.5 text-2xs font-semibold bg-amber-500/15 text-amber-600 rounded-full">BETA</span>
          </div>
        </div>
      )}

      {isDesktop && (
        <div className="flex-shrink-0 bg-white rounded-2xl p-6 mx-8 mt-8 mb-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/app")}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <IoChevronBack className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Crypto Assets</h1>
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500/15 text-amber-600 rounded-full">BETA</span>
          </div>
        </div>
      )}

      {/* Token List */}
      <div
        className={`flex-1 overflow-y-auto ${
          isDesktop ? "px-8 pb-8" : "px-4 pb-4 pt-2"
        }`}
      >
        <div className={isDesktop ? "max-w-4xl mx-auto" : ""}>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : tokens && tokens.length > 0 ? (
            <div className="space-y-2">
              {tokens.map((token) => (
                <AssetRow
                  key={`${token.backend_id ?? token.id}-${token.chain_id}`}
                  token={token}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-text-subtle text-sm">
                No assets found. Buy some USDC to get started.
              </p>
              <button
                onClick={() => navigate("/app/request?type=topup")}
                className="mt-4 px-5 py-2.5 bg-accent-primary text-white rounded-full text-sm font-semibold active:scale-95 transition-all"
              >
                Buy USDC
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (isDesktop) {
    return (
      <DesktopPageLayout maxWidth="lg" className="h-full">
        {content}
      </DesktopPageLayout>
    );
  }

  return <div className="h-full flex flex-col bg-app-background">{content}</div>;
}
