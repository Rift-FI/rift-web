/**
 * WalletConnect Connection Request Modal
 * Shows when a dApp requests to connect to the wallet
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { usePlatformDetection } from '@/utils/platform';
import { useWalletConnect } from '@/hooks/walletconnect/use-walletconnect';
import { toast } from 'sonner';
import { Globe, Check, X } from 'lucide-react';

interface ConnectionRequestModalProps {
  uri: string;
  dAppMetadata?: {
    name: string;
    url: string;
    description: string;
    icons: string[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectionRequestModal({
  uri,
  dAppMetadata,
  isOpen,
  onClose
}: ConnectionRequestModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { isTelegram } = usePlatformDetection();
  const { connectToDApp } = useWalletConnect();

  // Only parse URI if it exists and is valid  
  // Default metadata if not provided
  const metadata = dAppMetadata || {
    name: 'Unknown dApp',
    url: 'Unknown URL',
    description: 'dApp connection request',
    icons: []
  };

  const handleApprove = async () => {
    setIsConnecting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to connect to dApps');
        return;
      }

      connectToDApp(uri, token);
      
      // Add haptic feedback for Telegram
      if (isTelegram && window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback?.impactOccurred('medium');
      }
      
      onClose();
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect to dApp');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReject = () => {
    if (isTelegram && window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback?.impactOccurred('light');
    }
    
    toast.info('Connection request rejected');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 md:left-[calc((100vw-28rem)/2)] md:right-[calc((100vw-28rem)/2)]"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-app-background rounded-2xl max-w-sm w-full p-6 relative max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface flex items-center justify-center">
            {metadata.icons.length > 0 ? (
              <img 
                src={metadata.icons[0]} 
                alt={metadata.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Globe className={`w-6 h-6 text-text-subtle ${metadata.icons.length > 0 ? 'hidden' : ''}`} />
          </div>
          
          <h2 className="text-lg font-semibold mb-1">Connect to dApp?</h2>
          <p className="text-sm text-text-subtle">
            <span className="font-medium">{metadata.name}</span> wants to connect
          </p>
        </div>

        {/* Simple Info */}
        <div className="bg-surface rounded-lg p-3 mb-4">
          <p className="text-sm text-center text-text-subtle">
            This allows the app to see your wallet address and request approvals.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1"
            disabled={isConnecting}
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            className="flex-1"
            disabled={isConnecting}
          >
            <Check className="w-4 h-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-3 p-2 bg-warning/10 rounded-lg">
          <p className="text-xs text-warning text-center">
            Only connect to trusted dApps
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}


