import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiArrowLeft, FiCopy, FiPhone, FiCheck, FiShare2, FiX, FiCreditCard } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { useRequest } from "../context";
import ActionButton from "@/components/ui/action-button";
import rift from "@/lib/rift";

export default function SharingOptions() {
  const navigate = useNavigate();
  const { createdInvoice } = useRequest();
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sendingToPhone, setSendingToPhone] = useState(false);
  const [showPhoneDrawer, setShowPhoneDrawer] = useState(false);
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [sendingMpesaPrompt, setSendingMpesaPrompt] = useState(false);
  const [showMpesaDrawer, setShowMpesaDrawer] = useState(false);

  const handleBack = () => {
    navigate("/app");
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(createdInvoice.url);
      setCopied(true);
      toast.success("Payment link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error: any) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    const shareText = `Payment request for KSh ${(createdInvoice.kesAmount || createdInvoice.amount).toLocaleString()} - ${createdInvoice.description}`;
    const shareUrl = createdInvoice.url;
    
    // Check if we're on mobile and have Web Share API
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:';
    
    console.log('Share attempt:', {
      isMobile,
      isSecureContext,
      hasNavigatorShare: !!navigator.share,
      userAgent: navigator.userAgent
    });
    
    // Try Web Share API first (works best on mobile)
    if (navigator.share && isSecureContext) {
      try {
        const shareData = {
          title: 'Payment Request - Rift',
          text: shareText,
          url: shareUrl,
        };
        
        console.log('Sharing with Web Share API:', shareData);
        await navigator.share(shareData);
        console.log('Share successful');
        return;
      } catch (error: any) {
        console.log('Web Share API error:', error);
        if (error.name === 'AbortError') {
          // User cancelled
          return;
        }
        // Fall through to other methods
      }
    }
    
    // Fallback: Try to open WhatsApp directly on mobile
    if (isMobile) {
      const whatsappText = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
      const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
      
      try {
        // Try to open WhatsApp
        window.open(whatsappUrl, '_blank');
        console.log('Opened WhatsApp share');
        return;
      } catch (error: any) {
        console.log('WhatsApp fallback failed:', error);
      }
    }
    
    // Final fallback: Copy to clipboard
    console.log('Using copy fallback');
    toast.info("Copied to clipboard - paste in WhatsApp or any app");
    handleCopyUrl();
  };

  // Format phone number to international format
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If starts with 07, replace with 2547
    if (cleaned.startsWith('07')) {
      return '254' + cleaned.substring(1);
    }
    
    // If starts with 7 (without 0), add 254
    if (cleaned.startsWith('7') && cleaned.length === 9) {
      return '254' + cleaned;
    }
    
    // If already starts with 254, keep as is
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    
    // If starts with +254, remove + and keep as is
    if (phone.startsWith('+254')) {
      return cleaned;
    }
    
    // Default: assume it's a local number starting with 7
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
      return '254' + cleaned;
    }
    
    // Return as is if we can't determine format
    return cleaned;
  };

  const handleSendToPhone = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    setSendingToPhone(true);
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("No authentication token found");
      }
      
      rift.setBearerToken(authToken);
      
      // Format phone number to international format
      const formattedPhone = formatPhoneNumber(phoneNumber.trim());
      
      const request = {
        paymentLink: createdInvoice.url,
        message: `Payment request for KSh ${(createdInvoice.kesAmount || createdInvoice.amount).toLocaleString()} - ${createdInvoice.description}`,
        recipientPhone: formattedPhone,
      };

      const response = await rift.offramp.sendPaymentLink(request);
      
      if (response.results?.smsSent) {
        toast.success("Payment request sent to phone number!");
      } else {
        toast.error("Failed to send SMS. Please try again.");
      }
      
      setPhoneNumber("");
      setShowPhoneDrawer(false);
    } catch (error: any) {
      console.error("Error sending to phone:", error);
      toast.error("Failed to send to phone number");
    } finally {
      setSendingToPhone(false);
    }
  };

  // Format phone number for M-Pesa (07... or 01... format)
  const formatMpesaNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If starts with 254, convert to 0X format
    if (cleaned.startsWith('254')) {
      const localPart = cleaned.substring(3);
      if (localPart.startsWith('7')) {
        return '07' + localPart.substring(1);
      }
      if (localPart.startsWith('1')) {
        return '01' + localPart.substring(1);
      }
    }
    
    // If starts with +254, remove + and convert
    if (phone.startsWith('+254')) {
      return formatMpesaNumber(cleaned);
    }
    
    // If starts with 7 (9 digits), add 07
    if (cleaned.startsWith('7') && cleaned.length === 9) {
      return '07' + cleaned.substring(1);
    }
    
    // If starts with 1 (9 digits), add 01  
    if (cleaned.startsWith('1') && cleaned.length === 9) {
      return '01' + cleaned.substring(1);
    }
    
    // If already in 07... or 01... format, keep as is
    if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
      return cleaned;
    }
    
    // Default: return cleaned number
    return cleaned;
  };

  const handleMpesaPrompt = async () => {
    if (!mpesaNumber.trim()) {
      toast.error("Please enter M-Pesa number");
      return;
    }

    setSendingMpesaPrompt(true);
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("No authentication token found");
      }
      
      rift.setBearerToken(authToken);
      
      // Get exchange rate for KES to USD conversion
      const exchangeRateResponse = await rift.offramp.previewExchangeRate({
        currency: "KES" as any
      });
      
      // Format phone number for M-Pesa
      const formattedMpesaNumber = formatMpesaNumber(mpesaNumber.trim());
      
      // Get the original KES amount user typed and convert to USD
      const kesAmount = createdInvoice.kesAmount;
      const usdAmount = kesAmount / exchangeRateResponse.rate;
      
        const request = {
          shortcode: formattedMpesaNumber,
          amount: usdAmount, // Send USD amount (KES ÷ exchange rate)
          chain: "base" as any,
          asset: "USDC" as any,
          mobile_network: "Safaricom",
          country_code: "KES",
        };

      console.log('Sending M-Pesa prompt:', request);
      console.log('Auth token exists:', !!authToken);
      
      const response = await rift.onrampV2.buy(request);
      console.log('M-Pesa prompt response:', response);
      
      toast.success("M-Pesa prompt sent! Customer will receive payment request on their phone.");
      setMpesaNumber("");
      setShowMpesaDrawer(false);
    } catch (error: any) {
      console.error("Error sending M-Pesa prompt:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack
      });
      
      // More specific error messages
      if (error.message?.includes('404')) {
        toast.error("M-Pesa prompt API not found. Please contact support.");
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        toast.error("Authentication failed. Please log in again.");
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(`Failed to send M-Pesa prompt: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSendingMpesaPrompt(false);
    }
  };


  if (!createdInvoice) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 rounded-full hover:bg-surface-subtle transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Payment Request Created</h1>
      </div>

      {/* Success Message */}
      <div className="text-center mb-4">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <FiCheck className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-medium mb-1">Request Created!</h2>
        <p className="text-text-subtle text-xs">Share this payment request with your client</p>
      </div>

      {/* Request Summary & QR Code - Combined */}
      <div className="bg-surface-subtle rounded-lg p-4 mb-4">
        <div className="text-center mb-3">
          <p className="text-xs text-text-subtle">Requesting</p>
          <p className="text-lg font-bold">KSh {(createdInvoice.kesAmount || createdInvoice.amount).toLocaleString()}</p>
          <p className="text-xs text-text-subtle mt-1">{createdInvoice.description}</p>
        </div>
        
        {/* QR Code */}
        <div className="bg-white rounded-lg p-3 flex justify-center">
          <QRCodeSVG
            value={createdInvoice.url}
            size={120}
            level="M"
            includeMargin={true}
          />
        </div>
        
        <div className="text-center mt-2">
          <p className="text-xs text-text-subtle">Scan to pay</p>
        </div>
      </div>

      {/* Sharing Options */}
      <div className="space-y-2">
        {/* Share Button - Opens native share sheet */}
        <button
          onClick={handleShare}
          className="w-full flex items-center gap-3 p-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors"
        >
          <FiShare2 className="w-4 h-4" />
          <span className="font-medium text-sm">
            Share via WhatsApp, Telegram, etc.
          </span>
        </button>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Copy URL */}
          <button
            onClick={handleCopyUrl}
            className="flex flex-col items-center gap-1 p-3 bg-surface-subtle rounded-lg hover:bg-surface transition-colors"
          >
            {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
            <span className="text-xs font-medium">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>

          {/* Send to Phone */}
          <button
            onClick={() => setShowPhoneDrawer(true)}
            className="flex flex-col items-center gap-1 p-3 bg-surface-subtle rounded-lg hover:bg-surface transition-colors"
          >
            <FiPhone className="w-4 h-4" />
            <span className="text-xs font-medium">Phone</span>
          </button>

          {/* M-Pesa Prompt */}
          <button
            onClick={() => setShowMpesaDrawer(true)}
            className="flex flex-col items-center gap-1 p-3 bg-surface-subtle rounded-lg hover:bg-surface transition-colors"
          >
            <FiCreditCard className="w-4 h-4" />
            <span className="text-xs font-medium">Prompt</span>
          </button>
        </div>
      </div>

      {/* Done Button */}
      <div className="mt-4">
        <ActionButton
          onClick={() => navigate("/app")}
          className="w-full"
          variant="secondary"
        >
          Done
        </ActionButton>
      </div>

      {/* Phone Number Drawer */}
      <AnimatePresence>
        {showPhoneDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPhoneDrawer(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl p-6 z-50 border-t border-surface"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Send to Phone</h3>
                <button
                  onClick={() => setShowPhoneDrawer(false)}
                  className="p-2 hover:bg-surface-subtle rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
                    autoFocus
                  />
                </div>
                
                <ActionButton
                  onClick={handleSendToPhone}
                  disabled={!phoneNumber.trim()}
                  loading={sendingToPhone}
                  className="w-full"
                >
                  Send Payment Request
                </ActionButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* M-Pesa Prompt Drawer */}
      <AnimatePresence>
        {showMpesaDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMpesaDrawer(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl p-6 z-50 border-t border-surface"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">M-Pesa Prompt</h3>
                <button
                  onClick={() => setShowMpesaDrawer(false)}
                  className="p-2 hover:bg-surface-subtle rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>M-Pesa Prompt:</strong> Customer will receive a payment request directly on their phone to pay KSh {(createdInvoice.kesAmount || createdInvoice.amount).toLocaleString()}.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Customer's M-Pesa Number</label>
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                    className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
                    autoFocus
                  />
                  <p className="text-xs text-text-subtle mt-1">
                    Enter the customer's M-Pesa number (07... or 01...)
                  </p>
                </div>
                
                <ActionButton
                  onClick={handleMpesaPrompt}
                  disabled={!mpesaNumber.trim()}
                  loading={sendingMpesaPrompt}
                  className="w-full"
                >
                  Send M-Pesa Prompt
                </ActionButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}