/**
 * WalletConnect Connection Modal
 * User picks a chain, then we pair with the DApp.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useWalletConnect } from "@/hooks/walletconnect/use-walletconnect";
import {
  WC_SUPPORTED_CHAINS,
  type WCSupportedChain,
} from "@/lib/walletconnect";
import { toast } from "sonner";
import { Globe, Check, X, ChevronDown, Loader2 } from "lucide-react";

interface ConnectionRequestModalProps {
  uri: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectionRequestModal({
  uri,
  isOpen,
  onClose,
}: ConnectionRequestModalProps) {
  const [selectedChain, setSelectedChain] = useState<WCSupportedChain>("BASE");
  const [showChainPicker, setShowChainPicker] = useState(false);
  const { pairWithDApp, isPairing } = useWalletConnect();

  const selectedChainInfo = WC_SUPPORTED_CHAINS.find(
    (c) => c.value === selectedChain
  );

  const handleConnect = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in first");
      return;
    }

    const result = await pairWithDApp(uri, selectedChain, token);
    if (result.success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
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
        className="bg-app-background rounded-2xl max-w-sm w-full p-6 relative"
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-primary/10 flex items-center justify-center">
            <Globe className="w-7 h-7 text-accent-primary" />
          </div>
          <h2 className="text-lg font-semibold text-text-default mb-1">
            Connect to DApp
          </h2>
          <p className="text-sm text-text-subtle">
            Choose the network you want to use with this app
          </p>
        </div>

        {/* Chain selector */}
        <div className="mb-5">
          <p className="text-xs font-medium text-text-subtle mb-2">Network</p>
          <button
            onClick={() => setShowChainPicker(!showChainPicker)}
            className="flex items-center justify-between w-full p-3.5 rounded-xl bg-surface-subtle border border-border hover:bg-surface-subtle/80 transition-colors"
          >
            <span className="text-sm font-semibold text-text-default">
              {selectedChainInfo?.label || selectedChain}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-text-subtle transition-transform ${showChainPicker ? "rotate-180" : ""}`}
            />
          </button>

          {showChainPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 rounded-xl border border-border bg-surface overflow-hidden max-h-48 overflow-y-auto"
            >
              {WC_SUPPORTED_CHAINS.map((chain) => (
                <button
                  key={chain.value}
                  onClick={() => {
                    setSelectedChain(chain.value);
                    setShowChainPicker(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors ${
                    chain.value === selectedChain
                      ? "bg-accent-primary/10 text-accent-primary font-semibold"
                      : "text-text-default hover:bg-surface-subtle"
                  }`}
                >
                  <span>{chain.label}</span>
                  {chain.value === selectedChain && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="bg-surface-subtle rounded-xl p-3 mb-5">
          <p className="text-xs text-text-subtle leading-relaxed">
            The DApp will use your Rift smart wallet on{" "}
            {selectedChainInfo?.label}. All transactions are signed
            automatically — no extra approvals needed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isPairing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            className="flex-1"
            disabled={isPairing}
          >
            {isPairing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Connect
              </>
            )}
          </Button>
        </div>

        {/* Security notice */}
        <div className="mt-3 p-2 bg-warning/10 rounded-lg">
          <p className="text-xs text-warning text-center">
            Only connect to apps you trust
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
