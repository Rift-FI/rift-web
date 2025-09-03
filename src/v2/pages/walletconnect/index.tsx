/**
 * WalletConnect Page
 * Main interface for WalletConnect functionality
 */

import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { backButton } from '@telegram-apps/sdk-react';
import { usePlatformDetection } from '@/utils/platform';
import { useWalletConnectSocket } from '@/hooks/walletconnect/use-walletconnect-socket';
import WalletConnectScanner from '@/components/walletconnect/WalletConnectScanner';
import ConnectionRequestModal from '@/components/walletconnect/ConnectionRequestModal';
import TransactionRequestModal from '@/components/walletconnect/TransactionRequestModal';
import ConnectedAppsManager from '@/components/walletconnect/ConnectedAppsManager';
import { useWalletConnectUserId } from '@/hooks/walletconnect/use-walletconnect-user';
import WalletConnectEventHandler from '@/components/walletconnect/NewWalletConnectEventHandler';
import { toast } from 'sonner';

import { 
  QrCode, 
  Zap,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'scanner' | 'apps' | 'connection' | 'transaction';

export default function WalletConnect() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('apps');
  const [currentURI, setCurrentURI] = useState<string>('');
  
  const { isTelegram } = usePlatformDetection();
  const { userId } = useWalletConnectUserId();
  const { 
    pendingRequest,
    setPendingRequest,
    isConnected
  } = useWalletConnectSocket();







  // Handle Telegram back button
  useEffect(() => {
    if (isTelegram) {
      if (backButton.isSupported()) {
        backButton.mount();
        backButton.show();
        
        const handleBackClick = () => {
          if (viewMode === 'scanner' || viewMode === 'connection' || viewMode === 'transaction') {
            setViewMode('apps');
          }
        };
        
        backButton.onClick(handleBackClick);
        
        return () => {
          backButton.offClick(handleBackClick);
          backButton.hide();
        };
      }
    }
  }, [isTelegram, viewMode]);

  // Handle pending requests from Socket.IO
  useEffect(() => {
    if (pendingRequest && viewMode !== 'transaction') {
      setViewMode('transaction');
      
      // Add haptic feedback for new requests
      if (isTelegram && window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback?.notificationOccurred('warning');
      }
    }
  }, [pendingRequest, viewMode, isTelegram]);

  const handleURIDetected = (uri: string) => {
    setCurrentURI(uri);
    setViewMode('connection');
  };

  const handleConnectionClose = () => {
    setCurrentURI('');
    setViewMode('apps');
  };

  const handleTransactionClose = () => {
    setPendingRequest(null);
    setViewMode('apps');
  };

  const handleOpenScanner = () => {
    setViewMode('scanner');
  };





  return (
    <Fragment>
      <motion.div
        initial={{ x: 4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full h-full overflow-y-auto mb-18 px-4 pt-6 pb-24"
      >
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-0">
          <button
            onClick={() => navigate('/app/profile')}
            className="flex items-center gap-2 text-text-subtle hover:text-text transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Profile</span>
          </button>
          
          {/* WalletConnect Status - Integrated into header */}
          {userId && (
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1 text-xs text-muted-foreground border">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="truncate">{isConnected ? 'Connected' : 'Offline'}</span>
            </div>
          )}
        </div>

        {/* Pending Requests Only */}
        {pendingRequest && (
          <div className="fixed top-4 right-4 z-40">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Button
                onClick={() => setViewMode('transaction')}
                className="bg-warning text-warning-foreground hover:bg-warning/90"
              >
                <Zap className="w-4 h-4 mr-2" />
                Request Pending
              </Button>
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'apps' && (
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

        {/* Quick Action Button */}
        {viewMode === 'apps' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="fixed bottom-20 right-4 z-30"
          >
            <Button
              onClick={handleOpenScanner}
              size="lg"
              className="w-14 h-14 rounded-full shadow-lg bg-accent-primary hover:bg-accent-primary/90"
            >
              <QrCode className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Modals */}
      <WalletConnectScanner
        onURIDetected={handleURIDetected}
        onClose={() => setViewMode('apps')}
        isOpen={viewMode === 'scanner'}
      />

      {currentURI && (
        <ConnectionRequestModal
          uri={currentURI}
          isOpen={viewMode === 'connection'}
          onClose={handleConnectionClose}
        />
      )}

      {pendingRequest && (
        <TransactionRequestModal
          request={pendingRequest}
          isOpen={viewMode === 'transaction'}
          onClose={handleTransactionClose}
        />
      )}

      {/* New WalletConnect Event Handler - No UI, just handles events */}
      <WalletConnectEventHandler
        currentUserId={userId}
        onNewRequest={(request) => {
          setPendingRequest(request);
          setViewMode('transaction');
        }}
        onNewConnection={(connectionData) => {
          // Show success toast from top
          toast.success('🔗 New dApp Connected!', {
            description: connectionData.dappName ? `Successfully connected to ${connectionData.dappName}` : 'New WalletConnect connection established',
            duration: 4000,
            position: 'top-center',
          });
        }}
      />

    </Fragment>
  );
}


