/**
 * WalletConnect QR Scanner Component
 * Handles QR code scanning and manual URI input
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateWCURI } from '@/lib/walletconnect';
import { toast } from 'sonner';
import { Camera, Edit3, Scan, X } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/library';

interface WalletConnectScannerProps {
  onURIDetected: (uri: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

type ScanMode = 'camera' | 'manual';

export default function WalletConnectScanner({
  onURIDetected,
  onClose,
  isOpen
}: WalletConnectScannerProps) {
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [uri, setUri] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera permission and stream management
  const requestCameraPermission = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      return true;
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Camera access required for QR scanning');
      setScanMode('manual');
      return false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // QR Code detection using @zxing/library
  const scanQRCode = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      
      const codeReader = new BrowserQRCodeReader();
      
      // Try to decode from the video element
      const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
      
      if (result && result.getText()) {
        const scannedText = result.getText();
        
        if (validateWCURI(scannedText)) {
          onURIDetected(scannedText);
          toast.success('QR code scanned successfully!');
        } else {
          toast.error('Scanned QR code is not a valid WalletConnect URI');
        }
      }
      
    } catch (error: unknown) {
      console.error('QR scan error:', error);
      
      // If no QR code found or error occurred
      const errorMessage = error instanceof Error ? error.message : '';
      const errorName = error instanceof Error ? error.name : '';
      
      if (errorMessage?.includes('No QR code found') || errorName === 'NotFoundException') {
        toast.info('No QR code detected. Make sure the QR code is clearly visible.');
      } else {
        toast.error('Failed to scan QR code. Please try manual input.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = () => {
    if (!uri.trim()) {
      toast.error('Please enter a WalletConnect URI');
      return;
    }

    if (!validateWCURI(uri.trim())) {
      toast.error('Invalid WalletConnect URI format');
      return;
    }

    onURIDetected(uri.trim());
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUri(text);
      
      if (validateWCURI(text)) {
        onURIDetected(text);
      }
    } catch {
      toast.error('Failed to read from clipboard');
    }
  };

  // Initialize camera when switching to camera mode
  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      requestCameraPermission();
    }
  }, [isOpen, scanMode]);

  // Cleanup camera when component unmounts or closes
  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-app-background rounded-2xl max-w-md w-full p-6 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Connect to dApp</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-surface rounded-lg p-1 mb-6">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-colors ${
              scanMode === 'camera'
                ? 'bg-accent-primary text-white'
                : 'text-text-subtle hover:text-text-default'
            }`}
          >
            <Camera className="w-4 h-4" />
            Scan QR
          </button>
          <button
            onClick={() => setScanMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-colors ${
              scanMode === 'manual'
                ? 'bg-accent-primary text-white'
                : 'text-text-subtle hover:text-text-default'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Enter URI
          </button>
        </div>

        {/* Scanner Content */}
        {scanMode === 'camera' ? (
          <div className="space-y-4">
            {cameraError ? (
              <div className="text-center py-8">
                <div className="text-warning mb-2">Camera Unavailable</div>
                <p className="text-sm text-text-subtle mb-4">{cameraError}</p>
                <Button
                  onClick={() => setScanMode('manual')}
                  variant="outline"
                >
                  Use Manual Input
                </Button>
              </div>
            ) : (
              <>
                <div className="relative bg-surface rounded-lg overflow-hidden aspect-square">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-accent-primary rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent-primary rounded-br-lg" />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-text-subtle mb-4">
                    Point your camera at the QR code to connect
                  </p>
                  <Button
                    onClick={scanQRCode}
                    disabled={isScanning}
                    className="w-full"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {isScanning ? 'Scanning...' : 'Scan QR Code'}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                WalletConnect URI
              </label>
              <Input
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="wc:..."
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handlePasteFromClipboard}
                variant="outline"
                className="flex-1"
              >
                Paste from Clipboard
              </Button>
              <Button
                onClick={handleManualSubmit}
                disabled={!uri.trim()}
                className="flex-1"
              >
                Connect
              </Button>
            </div>

            <div className="text-xs text-text-subtle">
              <p>Paste the WalletConnect URI from the dApp you want to connect to.</p>
              <p className="mt-1">The URI should start with "wc:" followed by connection details.</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
