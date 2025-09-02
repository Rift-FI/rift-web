/**
 * WalletConnect Transaction Request Modal
 * Shows when a dApp requests transaction approval
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { usePlatformDetection } from '@/utils/platform';
import { useWalletConnect } from '@/hooks/walletconnect/use-walletconnect';
import { formatMethod, type TransactionRequest } from '@/lib/walletconnect';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Zap,
  Clock,
  DollarSign
} from 'lucide-react';

interface TransactionRequestModalProps {
  request: TransactionRequest;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionRequestModal({
  request,
  isOpen,
  onClose
}: TransactionRequestModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  
  const { isTelegram } = usePlatformDetection();
  const { approveRequest, rejectRequest } = useWalletConnect();

  const handleApprove = async () => {
    setIsProcessing(true);
    setActionType('approve');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to approve transactions');
        return;
      }

      approveRequest(request.id, token);
      
      // Add haptic feedback for Telegram
      if (isTelegram && window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback?.impactOccurred('heavy');
      }
      
      onClose();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve transaction');
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setActionType('reject');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to reject transactions');
        return;
      }

      rejectRequest(request.id, 'User rejected transaction', token);
      
      // Add haptic feedback for Telegram
      if (isTelegram && window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback?.impactOccurred('light');
      }
      
      onClose();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject transaction');
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'eth_sendTransaction':
        return <DollarSign className="w-5 h-5 text-accent-primary" />;
      case 'personal_sign':
      case 'eth_signTypedData':
        return <Check className="w-5 h-5 text-accent-secondary" />;
      default:
        return <Zap className="w-5 h-5 text-warning" />;
    }
  };

  const getMethodDescription = (method: string) => {
    switch (method) {
      case 'eth_sendTransaction':
        return 'Send a transaction on the blockchain';
      case 'personal_sign':
        return 'Sign a message with your wallet';
      case 'eth_signTypedData':
        return 'Sign structured data with your wallet';
      default:
        return 'Execute a blockchain operation';
    }
  };

  const getRiskLevel = (method: string) => {
    switch (method) {
      case 'eth_sendTransaction':
        return { level: 'high', color: 'text-danger', bg: 'bg-danger/10' };
      case 'personal_sign':
        return { level: 'medium', color: 'text-warning', bg: 'bg-warning/10' };
      case 'eth_signTypedData':
        return { level: 'medium', color: 'text-warning', bg: 'bg-warning/10' };
      default:
        return { level: 'high', color: 'text-danger', bg: 'bg-danger/10' };
    }
  };

  if (!isOpen) return null;

  const risk = getRiskLevel(request.method);

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
        className="bg-app-background rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
            {getMethodIcon(request.method)}
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Transaction Request</h2>
          <p className="text-sm text-text-subtle">
            {request.dappName || request.dAppName} wants to perform an action
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="bg-surface rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Transaction Details</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${risk.bg} ${risk.color} capitalize`}>
              {risk.level} Risk
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {getMethodIcon(request.method)}
              <div>
                <p className="font-medium">{formatMethod(request.method)}</p>
                <p className="text-sm text-text-subtle">{getMethodDescription(request.method)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-text-subtle">
              <Clock className="w-4 h-4" />
              <span>Chain ID: {request.chainId}</span>
            </div>
            
            {request.estimatedGas && (
              <div className="flex items-center gap-2 text-sm text-text-subtle">
                <Zap className="w-4 h-4" />
                <span>Estimated Gas: {request.estimatedGas}</span>
              </div>
            )}
            
            {request.estimatedFee && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-accent-primary" />
                <span className="font-medium">Est. Fee: {request.estimatedFee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-3 bg-surface rounded-lg mb-4 hover:bg-surface-alt transition-colors"
        >
          <span className="text-sm font-medium">Transaction Data</span>
          {showDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Expandable Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-surface rounded-lg p-4">
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-text-subtle">Request ID:</span>
                    <p className="font-mono break-all">{request.id}</p>
                  </div>
                  
                  <div>
                    <span className="text-text-subtle">Method:</span>
                    <p className="font-mono">{request.method}</p>
                  </div>
                  
                  <div>
                    <span className="text-text-subtle">Parameters:</span>
                    <pre className="mt-1 p-2 bg-surface-alt rounded text-xs overflow-x-auto">
                      {JSON.stringify(request.params, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Warning */}
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning mb-1">
                Security Notice
              </p>
              <p className="text-xs text-warning/80">
                Review the transaction details carefully. Once approved, this action cannot be undone.
                Only approve if you trust {request.dappName || request.dAppName} and understand what you're signing.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing && actionType === 'reject' ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                />
                Rejecting...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Reject
              </>
            )}
          </Button>
          
          <Button
            onClick={handleApprove}
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing && actionType === 'approve' ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </div>

        {/* dApp Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => window.open(request.dappUrl || request.dAppName, '_blank')}
            className="inline-flex items-center gap-1 text-xs text-text-subtle hover:text-accent-primary transition-colors"
          >
            <span>View on {request.dappName || request.dAppName}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


