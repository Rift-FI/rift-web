/**
 * Connected Apps Manager
 * Shows and manages active WalletConnect sessions
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useWalletConnect } from "@/hooks/walletconnect/use-walletconnect";
import { CHAIN_ID_NAMES, type ActiveSession } from "@/lib/walletconnect";
import { toast } from "sonner";
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Shield,
  Trash2,
  Loader2,
} from "lucide-react";

function SessionItem({
  session,
  onDisconnect,
  isDisconnecting,
}: {
  session: ActiveSession;
  onDisconnect: (topic: string) => void;
  isDisconnecting: boolean;
}) {
  const chainName = CHAIN_ID_NAMES[session.chainId] || `Chain ${session.chainId}`;

  const handleDisconnect = () => {
    const confirmed = confirm(`Disconnect from ${session.peerName}?`);
    if (confirmed) {
      onDisconnect(session.topic);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-2xl bg-surface-subtle/60 border border-border p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-accent-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-default truncate">
              {session.peerName}
            </h3>
            {session.peerUrl && (
              <button
                onClick={() => window.open(session.peerUrl, "_blank")}
                className="p-0.5 hover:bg-surface-subtle rounded transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3 text-text-subtle" />
              </button>
            )}
          </div>
          <p className="text-xs text-text-subtle mt-0.5">{chainName}</p>
          {session.smartWalletAddress && (
            <p className="text-xs text-text-subtle font-mono mt-0.5">
              {session.smartWalletAddress.slice(0, 6)}...
              {session.smartWalletAddress.slice(-4)}
            </p>
          )}
        </div>

        <button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="p-2 hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
          title="Disconnect"
        >
          {isDisconnecting ? (
            <Loader2 className="w-4 h-4 text-danger animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 text-danger" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default function ConnectedAppsManager() {
  const {
    sessions,
    sessionsLoading,
    disconnectSession: disconnect,
    isDisconnecting,
    refreshSessions,
  } = useWalletConnect();

  const [disconnectingTopics, setDisconnectingTopics] = useState<Set<string>>(
    new Set()
  );

  const handleDisconnect = (topic: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to manage connections");
      return;
    }

    setDisconnectingTopics((prev) => new Set([...prev, topic]));
    disconnect(topic, token);

    // Clean up tracking after a bit (the query invalidation handles the actual refresh)
    setTimeout(() => {
      setDisconnectingTopics((prev) => {
        const next = new Set(prev);
        next.delete(topic);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 mt-2">
        <div>
          <h2 className="text-xl font-semibold text-text-default">
            Connected Apps
          </h2>
          <p className="text-sm text-text-subtle">
            {sessions.length} active connection
            {sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            refreshSessions();
            toast.success("Refreshed");
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Sessions list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sessionsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-text-subtle animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-subtle flex items-center justify-center">
                <Globe className="w-8 h-8 text-text-subtle" />
              </div>
              <h3 className="text-base font-semibold text-text-default mb-2">
                No Connected Apps
              </h3>
              <p className="text-sm text-text-subtle max-w-xs mx-auto">
                Connect to DApps like Uniswap, OpenSea, and Aave using
                WalletConnect. Tap the scan button to get started.
              </p>
            </motion.div>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.topic}
                session={session}
                onDisconnect={handleDisconnect}
                isDisconnecting={
                  disconnectingTopics.has(session.topic) || isDisconnecting
                }
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Security tips */}
      {sessions.length > 0 && (
        <div className="mt-5 p-4 bg-accent-primary/5 rounded-xl border border-accent-primary/10">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-text-default mb-1">
                How it works
              </h4>
              <ul className="text-xs text-text-subtle space-y-1">
                <li>
                  Transactions from connected DApps are signed automatically
                </li>
                <li>Each connection is tied to one network</li>
                <li>Disconnect apps you no longer use</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
