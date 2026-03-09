/**
 * WalletConnect Page
 * Connect to DApps like Uniswap, OpenSea, Aave, etc.
 * Polls for pending transaction requests and shows approval modal.
 */

import { useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
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

type ViewMode = "scanner" | "apps" | "connection";

export default function WalletConnect() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("apps");
  const [currentURI, setCurrentURI] = useState<string>("");
  const [activeRequest, setActiveRequest] = useState<TransactionRequest | null>(
    null
  );
  const handledIds = useRef<Set<number>>(new Set());
  const { isTelegram } = usePlatformDetection();

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

    handledIds.current.add(activeRequest.id);
    await approveRequest(activeRequest.id, token);
    setActiveRequest(null);
  };

  const handleReject = () => {
    if (!activeRequest) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    handledIds.current.add(activeRequest.id);
    rejectRequest(activeRequest.id, token);
    setActiveRequest(null);
  };

  const pendingCount = pendingRequests?.length || 0;

  return (
    <Fragment>
      <motion.div
        initial={{ x: 4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full h-full overflow-y-auto mb-18 px-4 pt-6 pb-24"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-2 text-text-subtle hover:text-text-default transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          {/* Pending requests badge */}
          {pendingCount > 0 && !activeRequest && (
            <button
              onClick={() => {
                if (pendingRequests && pendingRequests.length > 0) {
                  setActiveRequest(pendingRequests[0]);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-medium animate-pulse"
            >
              <Zap className="w-3.5 h-3.5" />
              {pendingCount} pending
            </button>
          )}
        </div>

        {/* Explainer */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/15 flex items-center justify-center">
              <Globe className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-default">DeFi</h1>
              <p className="text-xs text-text-subtle">Connect your wallet to external apps</p>
            </div>
          </div>
          <p className="text-xs text-text-subtle/80 leading-relaxed">
            Use your Rift wallet with apps like Uniswap, Polymarket, Aave, OpenSea and more. Scan a QR code or paste a link from any WalletConnect-compatible app to connect. You'll approve every transaction before it executes.
          </p>
        </div>

        {/* Scan / Paste action */}
        {viewMode === "apps" && (
          <button
            onClick={() => setViewMode("scanner")}
            className="w-full mb-6 flex items-center gap-3 p-3.5 rounded-xl border border-border-subtle bg-surface-subtle hover:bg-surface-subtle/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-accent-primary/15 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-text-default">New Connection</p>
              <p className="text-xs text-text-subtle">Scan QR code or paste WalletConnect link</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-text-subtle ml-auto rotate-180" />
          </button>
        )}

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
      </motion.div>

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
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-app-background rounded-2xl max-w-sm w-full p-6"
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
              <div className="bg-surface-subtle rounded-xl p-4 mb-5 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-text-subtle">App</span>
                  <span className="font-medium text-text-default">
                    {activeRequest.peerName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-subtle">Action</span>
                  <span className="font-medium text-text-default">
                    {formatMethod(activeRequest.method)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-subtle">Chain</span>
                  <span className="font-medium text-text-default">
                    {CHAIN_ID_NAMES[activeRequest.chainId] || `Chain ${activeRequest.chainId}`}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-warning/10 rounded-xl p-3 mb-5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-warning leading-relaxed">
                  Review carefully. Once approved, this action cannot be undone.
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
                  Approve
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Fragment>
  );
}
