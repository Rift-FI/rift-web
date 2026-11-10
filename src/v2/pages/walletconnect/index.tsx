/**
 * WalletConnect Page
 * Connect to DApps like Uniswap, OpenSea, Aave, etc.
 * Polls for pending transaction requests and shows approval modal.
 */

import { useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Button as UiButton, Page, PageHeader } from "@/v2/ui";
import { backButton } from "@telegram-apps/sdk-react";
import { usePlatformDetection } from "@/utils/platform";
import WalletConnectScanner from "@/components/walletconnect/WalletConnectScanner";
import ConnectionRequestModal from "@/components/walletconnect/ConnectionRequestModal";
import ConnectedAppsManager from "@/components/walletconnect/ConnectedAppsManager";
import {
  useWalletConnectRequests,
  useWalletConnect,
} from "@/hooks/walletconnect/use-walletconnect";
import {
  formatMethod,
  CHAIN_ID_NAMES,
  type TransactionRequest,
} from "@/lib/walletconnect";
import {
  QrCode,
  ChevronLeft,
  Zap,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAnalytics from "@/hooks/use-analytics";

type ViewMode = "scanner" | "apps" | "connection";

export default function WalletConnect() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const [viewMode, setViewMode] = useState<ViewMode>("apps");
  const [currentURI, setCurrentURI] = useState<string>("");
  const [activeRequest, setActiveRequest] = useState<TransactionRequest | null>(
    null
  );
  const handledIds = useRef<Set<number>>(new Set());
  const { isTelegram } = usePlatformDetection();

  // Track page visit
  useEffect(() => {
    logEvent("PAGE_VISIT_WALLETCONNECT");
  }, []);

  // Poll for pending requests while on this page
  const { data: pendingRequests } = useWalletConnectRequests(true);
  const { approveRequest, rejectRequest, isApproving, isRejecting } =
    useWalletConnect();

  // Show the first pending request automatically (skip already handled ones)
  useEffect(() => {
    if (pendingRequests && pendingRequests.length > 0 && !activeRequest) {
      const next = pendingRequests.find((r) => !handledIds.current.has(r.id));
      if (next) setActiveRequest(next);
    }
  }, [pendingRequests, activeRequest]);

  // Handle Telegram back button
  useEffect(() => {
    if (isTelegram) {
      if (backButton.isSupported()) {
        backButton.mount();
        backButton.show();

        const handleBackClick = () => {
          if (activeRequest) {
            setActiveRequest(null);
          } else if (viewMode === "scanner" || viewMode === "connection") {
            setViewMode("apps");
          }
        };

        backButton.onClick(handleBackClick);

        return () => {
          backButton.offClick(handleBackClick);
          backButton.hide();
        };
      }
    }
  }, [isTelegram, viewMode, activeRequest]);

  const handleURIDetected = (uri: string) => {
    logEvent("WALLETCONNECT_CONNECTION_INITIATED");
    setCurrentURI(uri);
    setViewMode("connection");
  };

  const handleConnectionClose = () => {
    setCurrentURI("");
    setViewMode("apps");
  };

  const handleApprove = async () => {
    if (!activeRequest) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    logEvent("WALLETCONNECT_TRANSACTION_APPROVED", {
      peer_name: activeRequest.peerName,
      method: activeRequest.method,
      chain_id: activeRequest.chainId,
    });
    handledIds.current.add(activeRequest.id);
    await approveRequest(activeRequest.id, token, { method: activeRequest.method, chainId: Number(activeRequest.chainId) });
    setActiveRequest(null);
  };

  const handleReject = () => {
    if (!activeRequest) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    logEvent("WALLETCONNECT_TRANSACTION_REJECTED", {
      peer_name: activeRequest.peerName,
      method: activeRequest.method,
      chain_id: activeRequest.chainId,
    });
    handledIds.current.add(activeRequest.id);
    rejectRequest(activeRequest.id, token);
    setActiveRequest(null);
  };

  const pendingCount = pendingRequests?.length || 0;

  return (
    <Fragment>
      <Page width="narrow">
        <PageHeader
          back="/app/settings"
          eyebrow="Settings · Connected apps"
          title="WalletConnect"
          description="Use your Rift account with WalletConnect-compatible apps. Every request is approved with your passkey before anything executes."
          actions={
            <>
              {pendingCount > 0 && !activeRequest && (
                <UiButton
                  variant="secondary"
                  onClick={() => {
                    if (pendingRequests && pendingRequests.length > 0) setActiveRequest(pendingRequests[0]);
                  }}
                >
                  <Zap className="h-4 w-4 text-pending" />
                  {pendingCount} pending
                </UiButton>
              )}
              {viewMode === "apps" && (
                <UiButton
                  onClick={() => {
                    logEvent("WALLETCONNECT_SCAN_STARTED");
                    setViewMode("scanner");
                  }}
                >
                  <QrCode className="h-4 w-4" />
                  New connection
                </UiButton>
              )}
            </>
          }
        />
        {/* Main content */}
        <AnimatePresence mode="wait">
          {viewMode === "apps" && (
            <motion.div
              key="apps"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ConnectedAppsManager />
            </motion.div>
          )}
        </AnimatePresence>
      </Page>

      {/* Scanner modal */}
      <WalletConnectScanner
        onURIDetected={handleURIDetected}
        onClose={() => setViewMode("apps")}
        isOpen={viewMode === "scanner"}
      />

      {/* Connection modal (with chain picker) */}
      {currentURI && (
        <ConnectionRequestModal
          uri={currentURI}
          isOpen={viewMode === "connection"}
          onClose={handleConnectionClose}
        />
      )}

      {/* Transaction approval modal */}
      <AnimatePresence>
        {activeRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0b1214]/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card border border-hairline shadow-modal rounded-t-xl sm:rounded-lg max-w-md w-full p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-warning/10 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-warning" />
                </div>
                <h2 className="text-lg font-semibold text-text-default mb-1">
                  Transaction Request
                </h2>
                <p className="text-sm text-text-subtle">
                  {activeRequest.peerName} wants to{" "}
                  {formatMethod(activeRequest.method).toLowerCase()}
                </p>
              </div>

              {/* Details */}
              <div className="rounded-md border border-hairline divide-y divide-hairline mb-5 text-[14px]">
                <div className="flex justify-between px-3 py-2.5">
                  <span className="text-text-subtle">App</span>
                  <span className="font-medium text-text-default">
                    {activeRequest.peerName}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2.5">
                  <span className="text-text-subtle">Action</span>
                  <span className="font-medium text-text-default">
                    {formatMethod(activeRequest.method)}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2.5">
                  <span className="text-text-subtle">Chain</span>
                  <span className="font-medium text-text-default">
                    {CHAIN_ID_NAMES[activeRequest.chainId] || `Chain ${activeRequest.chainId}`}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-tint-pending border border-warning/35 rounded-md p-3 mb-5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-[12.5px] text-ink leading-relaxed">
                  Review carefully. You'll confirm with your passkey; once approved, this action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="flex-1"
                  disabled={isApproving || isRejecting}
                >
                  {isRejecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  className="flex-1"
                  disabled={isApproving || isRejecting}
                >
                  {isApproving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Approve with passkey
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Fragment>
  );
}
