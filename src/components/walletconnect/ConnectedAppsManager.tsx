/**
 * Connected Apps Manager
 * Shows and manages active WalletConnect sessions
 */

import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useWalletConnect } from '@/hooks/walletconnect/use-walletconnect';
import { usePlatformDetection } from '@/utils/platform';
import { type ActiveSession } from '@/lib/walletconnect';
import { toast } from 'sonner';
import { 
  Globe, 
  RefreshCw, 
  ExternalLink,
  Shield,
  Clock,
  ChevronRight,
  Trash2
} from 'lucide-react';

// Chain ID to name mapping
const CHAIN_NAMES: { [key: string]: string } = {
  'eip155:1': 'Ethereum',
  'eip155:137': 'Polygon',
  'eip155:56': 'BSC',
  'eip155:42161': 'Arbitrum',
  'eip155:10': 'Optimism',
  'eip155:8453': 'Base',
  'eip155:80094': 'Berachain',
  'eip155:43114': 'Avalanche',
  'eip155:250': 'Fantom',
  'eip155:100': 'Gnosis',
  'eip155:324': 'zkSync Era',
  'eip155:42220': 'Celo',
  'eip155:1284': 'Moonbeam',
  'eip155:1285': 'Moonriver',
  'eip155:25': 'Cronos',
  'eip155:199': 'BitTorrent',
  'eip155:288': 'Boba',
  'eip155:1101': 'Polygon zkEVM',
  'eip155:59144': 'Linea',
  'eip155:534352': 'Scroll',
};

// Helper function to convert chain IDs to readable names
const getChainNames = (chains: string[]): string => {
  if (!chains || chains.length === 0) return 'No chains';
  
  const chainNames = chains
    .map(chainId => CHAIN_NAMES[chainId] || chainId.replace('eip155:', 'Chain '))
    .slice(0, 3); // Show max 3 chains
  
  if (chains.length > 3) {
    return `${chainNames.join(', ')} +${chains.length - 3}`;
  }
  
  return chainNames.join(', ');
};

// No props needed since we only use the floating QR button

interface SessionItemProps {
  session: ActiveSession;
  onDisconnect: (topic: string) => void;
  isDisconnecting: boolean;
}

const SessionItem = forwardRef<HTMLDivElement, SessionItemProps>(({ session, onDisconnect, isDisconnecting }, ref) => {
  const [showDetails, setShowDetails] = useState(false);
  const { isTelegram } = usePlatformDetection();

  const handleDisconnect = () => {
    if (isTelegram && window.Telegram?.WebApp) {
      window.Telegram.WebApp.showConfirm(
        `Disconnect from ${session.dAppName}?`,
        (confirmed: boolean) => {
          if (confirmed) {
            onDisconnect(session.topic);
          }
        }
      );
    } else {
      const confirmed = confirm(`Disconnect from ${session.dAppName}?`);
      if (confirmed) {
        onDisconnect(session.topic);
      }
    }
  };

  const handleOpenDApp = () => {
    window.open(session.dAppUrl, '_blank');
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-accent/10 rounded-lg p-4 border-1 border-surface-subtle"
    >
      <div className="flex items-center gap-3">
        {/* dApp Icon */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface flex items-center justify-center flex-shrink-0">
          {session.dAppIcon ? (
            <img 
              src={session.dAppIcon} 
              alt={session.dAppName}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Globe className="w-6 h-6 text-text-subtle" />
          )}
        </div>

        {/* dApp Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{session.dAppName}</h3>
            <button
              onClick={handleOpenDApp}
              className="p-1 hover:bg-surface-alt rounded transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-text-subtle" />
            </button>
          </div>
          
          <p className="text-sm text-text-subtle truncate">{session.dAppUrl}</p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-text-subtle">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(session.connectedAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>{getChainNames(session.chains)}</span>
            </div>
          </div>
        </div>

        {/* Actions - Stacked Vertically */}
        <div className="flex flex-col items-center gap-2 ml-2">
          {/* Disconnect Button - ON TOP */}
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="p-2 hover:bg-danger/10 transition-colors group disabled:opacity-50"
            title="Disconnect app"
          >
            {isDisconnecting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-danger border-t-transparent rounded-full"
              />
            ) : (
              <Trash2 className="w-4 h-4 text-danger hover:text-danger/80" />
            )}
          </button>
          
          {/* Expand/Collapse Button - BELOW */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 hover:bg-surface/20 transition-colors group"
            title={showDetails ? 'Show less' : 'Show more details'}
          >
            <motion.div
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-text-subtle group-hover:text-text rotate-90" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-surface-alt">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Connected Networks</h4>
                  <div className="flex flex-wrap gap-2">
                    {session.chains.map((chainId) => (
                      <span
                        key={chainId}
                        className="px-2 py-1 bg-surface-alt rounded text-xs"
                      >
                        {CHAIN_NAMES[chainId] || chainId.replace('eip155:', 'Chain ')}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Session Details</h4>
                  <div className="text-xs text-text-subtle space-y-1">
                    <p>Topic: {session.topic.slice(0, 16)}...</p>
                    <p>Connected: {new Date(session.connectedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

SessionItem.displayName = 'SessionItem';

export default function ConnectedAppsManager() {
  const { 
    sessions, 
    disconnectSession: disconnect, 
    isDisconnecting,
    refreshSessions 
  } = useWalletConnect();
  

  
  const [disconnectingTopics, setDisconnectingTopics] = useState<Set<string>>(new Set());

  const handleDisconnect = async (topic: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to manage connections');
      return;
    }

    setDisconnectingTopics(prev => new Set([...prev, topic]));
    
    try {
      disconnect(topic, token);
    } finally {
      setDisconnectingTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(topic);
        return newSet;
      });
    }
  };

  const handleRefresh = () => {
    refreshSessions();
    toast.success('Refreshed connected apps');
  };

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div>
          <h2 className="text-xl font-semibold">Connected Apps</h2>
          <p className="text-sm text-text-subtle">
            {sessions.length} active connection{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Sessions List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
                <Globe className="w-10 h-10 text-text-subtle" />
              </div>
              
              <h3 className="text-lg font-medium mb-2">No Connected Apps</h3>
              <p className="text-sm text-text-subtle mb-6 max-w-sm mx-auto">
                Connect to dApps like Uniswap, OpenSea, and more to interact with the decentralized web.
              </p>
              
              <p className="text-xs text-text-subtle">
                Tap the QR code button to scan and connect to a dApp
              </p>
            </motion.div>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.topic}
                session={session}
                onDisconnect={handleDisconnect}
                isDisconnecting={disconnectingTopics.has(session.topic) || isDisconnecting}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      {sessions.length > 0 && (
        <div className="mt-6 p-4 bg-accent/10 rounded-lg border-1 border-surface-subtle">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium mb-1">Security Tips</h4>
              <ul className="text-xs text-text-subtle space-y-1">
                <li>• Regularly review and disconnect unused dApp connections</li>
                <li>• Only connect to dApps you trust</li>
                <li>• Connections expire automatically after extended inactivity</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
