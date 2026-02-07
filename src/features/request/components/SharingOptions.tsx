import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FiArrowLeft,
  FiCopy,
  FiPhone,
  FiCheck,
  FiShare2,
  FiX,
  FiCreditCard,
} from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useRequest } from "../context";
import ActionButton from "@/components/ui/action-button";
import useCreateInvoice from "@/hooks/data/use-create-invoice";
import useKYCStatus from "@/hooks/data/use-kyc-status";
import useAnalaytics from "@/hooks/use-analytics";
import rift from "@/lib/rift";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import RiftLoader from "@/components/ui/rift-loader";

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

export default function SharingOptions() {
  const navigate = useNavigate();
  const { logEvent, updatePersonProperties } = useAnalaytics();
  const { createdInvoice, requestType, requestData, setCreatedInvoice } =
    useRequest();
  const isDesktop = useDesktopDetection();
  
  const requestCurrency = (requestData.currency || createdInvoice?.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[requestCurrency];
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sendingToPhone, setSendingToPhone] = useState(false);
  const [showPhoneDrawer, setShowPhoneDrawer] = useState(false);
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [sendingMpesaPrompt, setSendingMpesaPrompt] = useState(false);
  const [showMpesaDrawer, setShowMpesaDrawer] = useState(false);
  const [sellingRate, setSellingRate] = useState<number | null>(null);
  const [withdrawalRate, setWithdrawalRate] = useState<number | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const createInvoiceMutation = useCreateInvoice();
  const { isKYCVerified, isLoading: kycLoading } = useKYCStatus();

  // Auto-create invoice for top-ups when component mounts
  useEffect(() => {
    const createInvoiceForTopup = async () => {
      // Only create invoice if it's a top-up and no invoice exists yet
      if (requestType === "topup" && !createdInvoice && !creatingInvoice) {
        // Check KYC status first
        if (!kycLoading && !isKYCVerified) {
          toast.error("Identity verification required", {
            description: "Please complete identity verification before creating a top-up link.",
            action: {
              label: "Verify Now",
              onClick: () => navigate("/app/kyc"),
            },
          });
          navigate("/app/request?type=topup");
          return;
        }

        setCreatingInvoice(true);

        try {
          // Fetch exchange rate (use .selling_rate for invoice/onramp)
          const authToken = localStorage.getItem("token");
          if (!authToken) {
            throw new Error("No authentication token found");
          }

          rift.setBearerToken(authToken);

          // For USD, no need to fetch exchange rate
          const topupCurrency = (requestData.currency || "KES") as SupportedCurrency;
          let exchangeRateData;
          
          if (topupCurrency === "USD") {
            exchangeRateData = { selling_rate: 1, rate: 1 };
          } else {
            exchangeRateData = await rift.offramp.previewExchangeRate({
              currency: topupCurrency as any,
            });
          }

          setSellingRate(exchangeRateData.selling_rate);
          setWithdrawalRate(exchangeRateData.rate);

          // Convert local currency amount to USD using the selling rate
          // Round to 6 decimal places (USDC precision)
          const localAmount = requestData.amount || 0;
          const usdAmount = topupCurrency === "USD" 
            ? localAmount 
            : Math.round((localAmount / exchangeRateData.selling_rate) * 1e6) / 1e6;
          const receiveAmount = usdAmount * exchangeRateData.rate;

          const invoiceRequest = {
            chain: requestData.chain,
            token: requestData.token,
            amount: usdAmount, // Send USD amount to API (rounded to 6 decimals)
            description: requestData.description || "Rift wallet top-up",
          } as any;

          const response = await createInvoiceMutation.mutateAsync(
            invoiceRequest
          );

          // Store both local currency and USD amounts for display purposes
          const invoiceWithLocalAmount = {
            ...response,
            localAmount: localAmount, // Store original local currency amount for display
            currency: topupCurrency, // Store the currency code
            receiveAmount: receiveAmount, // Amount user will actually receive
          };

          setCreatedInvoice(invoiceWithLocalAmount);
          
          // Track payment link creation
          logEvent("PAYMENT_LINK_CREATED", {
            type: "topup",
            amount_usd: usdAmount,
            amount_local: localAmount,
            currency: topupCurrency,
            exchange_rate: exchangeRateData.selling_rate,
            chain: requestData.chain,
            token: requestData.token,
          });
          
          // Update person property
          updatePersonProperties({ has_created_payment_request: true });
          
          toast.success("Top-up link created successfully!");
        } catch (error: any) {
          // Check if error is related to KYC
          if (error?.message?.includes("KYC") || error?.message?.includes("verification") || error?.response?.status === 403) {
            toast.error("Identity verification required", {
              description: "Please complete identity verification before creating a top-up link.",
              action: {
                label: "Verify Now",
                onClick: () => navigate("/app/kyc"),
              },
            });
          } else {
          toast.error("Failed to create top-up link. Please try again.");
          }
          // Go back to amount step on error
          navigate("/app/request?type=topup");
        } finally {
          setCreatingInvoice(false);
        }
      }
    };

    // Only run if KYC status is loaded
    if (!kycLoading) {
    createInvoiceForTopup();
    }
  }, [
    requestType,
    createdInvoice,
    creatingInvoice,
    requestData,
    createInvoiceMutation,
    setCreatedInvoice,
    navigate,
    isKYCVerified,
    kycLoading,
  ]);

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
    const localAmount = createdInvoice.localAmount || createdInvoice.amount;
    const shareText = `Payment request for ${currencySymbol} ${localAmount.toLocaleString()} (${requestCurrency}) - ${createdInvoice.description}`;
    const shareUrl = createdInvoice.url;

    // Check if we're on mobile and have Web Share API
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isSecureContext =
      window.isSecureContext || window.location.protocol === "https:";

    // Try Web Share API first (works best on mobile)
    if (navigator.share && isSecureContext) {
      try {
        const shareData = {
          title: "Payment Request - Rift",
          text: shareText,
          url: shareUrl,
        };

        
        await navigator.share(shareData);
        
        return;
      } catch (error: any) {
        
        if (error.name === "AbortError") {
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
        window.open(whatsappUrl, "_blank");
        
        return;
      } catch (error: any) {
        
      }
    }

    // Final fallback: Copy to clipboard
    
    toast.info("Copied to clipboard - paste in WhatsApp or any app");
    handleCopyUrl();
  };

  // Format phone number to international format
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // If starts with 07, replace with 2547
    if (cleaned.startsWith("07")) {
      return "254" + cleaned.substring(1);
    }

    // If starts with 7 (without 0), add 254
    if (cleaned.startsWith("7") && cleaned.length === 9) {
      return "254" + cleaned;
    }

    // If already starts with 254, keep as is
    if (cleaned.startsWith("254")) {
      return cleaned;
    }

    // If starts with +254, remove + and keep as is
    if (phone.startsWith("+254")) {
      return cleaned;
    }

    // Default: assume it's a local number starting with 7
    if (cleaned.length === 9 && cleaned.startsWith("7")) {
      return "254" + cleaned;
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

      const localAmount = createdInvoice.localAmount || createdInvoice.amount;
      const request = {
        paymentLink: createdInvoice.url,
        message: `Payment request for ${currencySymbol} ${localAmount.toLocaleString()} (${requestCurrency}) - ${createdInvoice.description}`,
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
      
      toast.error("Failed to send to phone number");
    } finally {
      setSendingToPhone(false);
    }
  };

  // Format phone number for M-Pesa (07... or 01... format)
  const formatMpesaNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // If starts with 254, convert to 0X format
    if (cleaned.startsWith("254")) {
      const localPart = cleaned.substring(3);
      if (localPart.startsWith("7")) {
        return "07" + localPart.substring(1);
      }
      if (localPart.startsWith("1")) {
        return "01" + localPart.substring(1);
      }
    }

    // If starts with +254, remove + and convert
    if (phone.startsWith("+254")) {
      return formatMpesaNumber(cleaned);
    }

    // If starts with 7 (9 digits), add 07
    if (cleaned.startsWith("7") && cleaned.length === 9) {
      return "07" + cleaned.substring(1);
    }

    // If starts with 1 (9 digits), add 01
    if (cleaned.startsWith("1") && cleaned.length === 9) {
      return "01" + cleaned.substring(1);
    }

    // If already in 07... or 01... format, keep as is
    if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
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

      // Get exchange rate for the request currency (use .selling_rate for onramp_v2)
      const exchangeResponse = await rift.offramp.previewExchangeRate({
        currency: requestCurrency as any,
      });

      // Format phone number for M-Pesa
      const formattedMpesaNumber = formatMpesaNumber(mpesaNumber.trim());

      // Get the original local currency amount user typed and convert to USD
      // Round to 6 decimal places (USDC precision)
      const localAmount = createdInvoice?.localAmount || requestData.amount || 0;
      const usdAmount = requestCurrency === "USD" 
        ? localAmount 
        : Math.round((localAmount / exchangeResponse.selling_rate) * 1e6) / 1e6;

      const request = {
        shortcode: formattedMpesaNumber,
        amount: usdAmount, // Send USD amount (local currency ÷ selling rate, rounded to 6 decimals)
        chain: "base" as any,
        asset: "USDC" as any,
        mobile_network: "Safaricom",
        country_code: requestCurrency,
      };

      
      

      const response = await rift.onrampV2.buy(request);
      

      toast.success(
        "M-Pesa prompt sent! Customer will receive payment request on their phone."
      );
      setMpesaNumber("");
      setShowMpesaDrawer(false);
    } catch (error: any) {
      // More specific error messages
      if (error.message?.includes("404")) {
        toast.error("M-Pesa prompt API not found. Please contact support.");
      } else if (
        error.message?.includes("401") ||
        error.message?.includes("403")
      ) {
        toast.error("Authentication failed. Please log in again.");
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(
          `Failed to send M-Pesa prompt: ${error.message || "Unknown error"}`
        );
      }
    } finally {
      setSendingMpesaPrompt(false);
    }
  };

  if (!createdInvoice || creatingInvoice) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <RiftLoader
          message={requestType === "topup" ? "Creating top-up link..." : "Loading..."}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full flex flex-col min-h-0 overflow-hidden bg-white"
    >
      <div className={`w-full h-full flex flex-col ${isDesktop ? "max-w-xl mx-auto" : ""}`}>
        {/* Header */}
        <div className={`flex items-center ${isDesktop ? "px-6 py-4" : "px-4 py-3"} border-b border-gray-200 flex-shrink-0`}>
          <button
            type="button"
            onClick={handleBack}
            className="mr-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-accent-primary" />
          </button>
          <h1 className={`${isDesktop ? "text-xl" : "text-lg"} font-semibold text-text-default`}>
            {requestType === "topup" ? "Top-Up Link" : "Payment Request"}
          </h1>
        </div>

        {/* Content */}
        <div className={`flex-1 flex flex-col items-center justify-center ${isDesktop ? "px-6 py-8" : "px-4 py-6"} overflow-y-auto`}>
          <div className="w-full max-w-md space-y-5">
            {/* Success Badge */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3"
              >
                <FiCheck className="w-7 h-7 text-white" />
              </motion.div>
              <h2 className={`${isDesktop ? "text-xl" : "text-lg"} font-bold text-text-default`}>
                {requestType === "topup" ? "Link Ready!" : "Request Created!"}
              </h2>
            </div>

            {/* Amount Card */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-accent-primary/10 via-accent-primary/5 to-white rounded-2xl border border-accent-primary/20 p-5"
            >
              <div className="text-center">
                <p className={`${isDesktop ? "text-3xl" : "text-2xl"} font-bold text-accent-primary tracking-tight`}>
                  {currencySymbol}{" "}
                  {(
                    createdInvoice.localAmount || createdInvoice.amount
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {requestCurrency}
                </p>
              </div>

              {/* Fee Breakdown for Top-ups */}
              {requestType === "topup" && requestData.feeBreakdown && (
                <div className="mt-3 pt-3 border-t border-accent-primary/20 space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">You pay</span>
                    <span className="font-semibold text-accent-primary">{currencySymbol} {requestData.feeBreakdown.totalLocalToPay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">You receive</span>
                    <span className="font-semibold text-green-600">
                      {currencySymbol} {(requestData.feeBreakdown.usdcToReceive * requestData.feeBreakdown.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Legacy display for when no fee breakdown */}
              {createdInvoice.receiveAmount && !requestData.feeBreakdown && (
                <div className="mt-3 pt-3 border-t border-accent-primary/20 text-center">
                  <p className="text-sm font-semibold text-green-600">
                    {currencySymbol} {createdInvoice.receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({requestCurrency})
                  </p>
                </div>
              )}
            </motion.div>

            {/* Payment Link */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <a
                  href={createdInvoice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-primary break-all hover:underline font-mono flex-1"
                >
                  {createdInvoice.url}
                </a>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className={`p-2 ${copied ? "bg-green-100" : "bg-white hover:bg-gray-100"} rounded-lg transition-colors border border-gray-200 flex-shrink-0`}
                >
                  {copied ? (
                    <FiCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <FiCopy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Share Actions */}
            <div className="space-y-3">
              {/* Primary Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-xl hover:shadow-md transition-all font-semibold text-sm shadow-sm"
              >
                <FiShare2 className="w-4 h-4" />
                <span>Share Link</span>
              </button>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-2">
                {/* Copy */}
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className={`flex flex-col items-center gap-1.5 p-3 bg-white border ${copied ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-accent-primary/50"} rounded-xl transition-all`}
                >
                  {copied ? (
                    <FiCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <FiCopy className="w-5 h-5 text-gray-600" />
                  )}
                  <span className={`text-xs font-medium ${copied ? "text-green-700" : "text-gray-700"}`}>
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>

                {/* Phone */}
                <button
                  type="button"
                  onClick={() => setShowPhoneDrawer(true)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 hover:border-accent-primary/50 rounded-xl transition-all"
                >
                  <FiPhone className="w-5 h-5 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">SMS</span>
                </button>

                {/* M-Pesa Prompt */}
                {requestCurrency === "KES" && (
                  <button
                    type="button"
                    onClick={() => setShowMpesaDrawer(true)}
                    className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 hover:border-accent-primary/50 rounded-xl transition-all"
                  >
                    <FiCreditCard className="w-5 h-5 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">M-Pesa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={() => navigate("/app")}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
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
              className="fixed inset-0 bg-black/50 z-40 md:left-[calc((100vw-28rem)/2)] md:right-[calc((100vw-28rem)/2)]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 z-50 border-t border-gray-200"
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
                  <label className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
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
              className="fixed inset-0 bg-black/50 z-40 md:left-[calc((100vw-28rem)/2)] md:right-[calc((100vw-28rem)/2)]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 z-50 border-t border-gray-200"
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
                <div className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-success">
                    <strong>M-Pesa Prompt:</strong> The owner of the M-Pesa
                    number will receive a payment request directly on their
                    phone to pay {currencySymbol}{" "}
                    {(
                      createdInvoice?.localAmount || requestData.amount || 0
                    ).toLocaleString()}
                    .
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Customer's M-Pesa Number
                  </label>
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
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
