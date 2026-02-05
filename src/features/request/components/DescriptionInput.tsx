import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";
import { useRequest } from "../context";
import useCreateInvoice from "@/hooks/data/use-create-invoice";
import useKYCStatus from "@/hooks/data/use-kyc-status";
import useAnalaytics from "@/hooks/use-analytics";
import { useNavigate } from "react-router";
import rift from "@/lib/rift";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useDesktopDetection from "@/hooks/use-desktop-detection";

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

export default function DescriptionInput() {
  const {
    requestData,
    updateRequestData,
    setCurrentStep,
    setCreatedInvoice,
    requestType,
  } = useRequest();
  const navigate = useNavigate();
  const { logEvent, updatePersonProperties } = useAnalaytics();
  const isDesktop = useDesktopDetection();
  const [description, setDescription] = useState("");
  const [sellingRate, setSellingRate] = useState<number | null>(null);
  const [withdrawalRate, setWithdrawalRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const createInvoiceMutation = useCreateInvoice();
  const { isKYCVerified, isLoading: kycLoading } = useKYCStatus();

  const requestCurrency = (requestData.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[requestCurrency];

  // Fetch exchange rate on component mount (use .selling_rate for invoice/onramp)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) {
          throw new Error("No authentication token found");
        }

        rift.setBearerToken(authToken);

        // For USD, no need to fetch exchange rate
        if (requestCurrency === "USD") {
          setSellingRate(1);
          setWithdrawalRate(1);
          setLoadingRate(false);
          return;
        }

        const response = await rift.offramp.previewExchangeRate({
          currency: requestCurrency as any,
        });

        setSellingRate(response.selling_rate); // Use .selling_rate for invoice/onramp
        setWithdrawalRate(response.rate); // Use .rate to show how much they'll receive
      } catch (error) {
        
        // Fallback to approximate rates if API fails
        const fallbackRates: Record<SupportedCurrency, number> = {
          KES: 136,
          ETB: 62.5,
          UGX: 3700,
          GHS: 15.8,
          NGN: 1580,
          USD: 1,
        };
        setSellingRate(fallbackRates[requestCurrency]);
        setWithdrawalRate(fallbackRates[requestCurrency]);
        toast.warning("Using approximate exchange rate");
      } finally {
        setLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, [requestCurrency]);

  const handleBack = () => {
    setCurrentStep("amount");
  };

  const handleCreateInvoice = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!sellingRate || !withdrawalRate) {
      toast.error("Exchange rate not loaded. Please try again.");
      return;
    }

    // Check KYC status before creating invoice
    if (!kycLoading && !isKYCVerified) {
      toast.error("Identity verification required", {
        description: "Please complete identity verification before creating a payment request link.",
        action: {
          label: "Verify Now",
          onClick: () => navigate("/app/kyc"),
        },
      });
      return;
    }

    try {
      // Convert local currency amount to USD using the selling rate
      // Round to 6 decimal places (USDC precision)
      const localAmount = requestData.amount || 0;
      const usdAmount = requestCurrency === "USD" 
        ? localAmount 
        : Math.round((localAmount / sellingRate) * 1e6) / 1e6;
      const receiveAmount = usdAmount * withdrawalRate;

      const invoiceRequest = {
        chain: requestData.chain,
        token: requestData.token,
        amount: usdAmount, // Send USD amount to API (rounded to 6 decimals)
        description: description.trim(),
      } as any;

      const response = await createInvoiceMutation.mutateAsync(invoiceRequest);

      // Store both local currency and USD amounts for display purposes
      const invoiceWithLocalAmount = {
        ...response,
        localAmount: localAmount, // Store original local currency amount for display
        currency: requestCurrency, // Store the currency code
        receiveAmount: receiveAmount, // Amount user will actually receive
      };

      setCreatedInvoice(invoiceWithLocalAmount);
      
      // Track payment request creation
      logEvent("PAYMENT_REQUEST_CREATED", {
        amount_usd: usdAmount,
        amount_local: localAmount,
        currency: requestCurrency,
        exchange_rate: sellingRate,
        chain: requestData.chain,
        token: requestData.token,
        description: description.trim(),
      });
      
      // Update person property
      updatePersonProperties({ has_created_payment_request: true });
      
      setCurrentStep("sharing");
      toast.success("Payment request created successfully!");
    } catch (error: any) {
      // Check if error is related to KYC
      if (error?.message?.includes("KYC") || error?.message?.includes("verification") || error?.response?.status === 403) {
        toast.error("Identity verification required", {
          description: "Please complete identity verification before creating a payment request link.",
          action: {
            label: "Verify Now",
            onClick: () => navigate("/app/kyc"),
          },
        });
      } else {
      toast.error("Failed to create payment request. Please try again.");
      }
    }
  };

  const isValidDescription = description.trim().length > 0;

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`w-full h-full ${isDesktop ? "p-8" : "p-4"} flex flex-col`}
    >
      <div className={`w-full h-full flex flex-col ${isDesktop ? "max-w-2xl mx-auto" : ""}`}>
        {/* Header - Stripe-like minimal */}
        <div className={`flex items-center ${isDesktop ? "mb-10" : "mb-6"}`}>
          <button
            onClick={handleBack}
            className="mr-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className={`${isDesktop ? "text-2xl" : "text-xl"} font-semibold text-text-default`}>
            {requestType === "topup" ? "Top Up Account" : "Request Payment"}
          </h1>
        </div>

        {/* Description Input */}
        <div className="flex-1 flex flex-col">
        <div className={`text-center ${isDesktop ? "mb-10" : "mb-8"}`}>
          <h2 className={`${isDesktop ? "text-3xl" : "text-2xl"} font-semibold mb-3 text-text-default`}>Add Description</h2>
          <p className={`${isDesktop ? "text-base" : "text-sm"} text-gray-600`}>
            {requestType === "topup"
              ? "What is this top-up for?"
              : "What is this payment for?"}
          </p>
        </div>

        {/* Amount Summary - Stripe-like */}
        <div className={`bg-white rounded-xl border border-gray-200 ${isDesktop ? "p-8 mb-8" : "p-6 mb-6"} shadow-sm`}>
          <div className="text-center">
            <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mb-2`}>
              {requestType === "topup" ? "Adding to account" : "Requesting"}
            </p>
            <p className={`${isDesktop ? "text-4xl" : "text-3xl"} font-bold text-text-default tracking-tight`}>
              {currencySymbol} {(requestData.amount || 0).toLocaleString()} ({requestCurrency})
            </p>
            {sellingRate && withdrawalRate && (
              <div className={`${isDesktop ? "mt-6 pt-6" : "mt-4 pt-4"} border-t border-gray-100`}>
                <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mb-1`}>
                  You will receive
                </p>
                <p className={`${isDesktop ? "text-2xl" : "text-xl"} font-semibold text-green-600`}>
                  {currencySymbol}{" "}
                  {requestCurrency === "USD" 
                    ? (requestData.amount || 0).toFixed(2)
                    : (((requestData.amount || 0) / sellingRate) * withdrawalRate).toLocaleString(undefined, { maximumFractionDigits: 2 })
                  } ({requestCurrency})
                </p>
                <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-1`}>in your wallet</p>
              </div>
            )}
          </div>
        </div>

        {/* Description Input - Stripe-like */}
        <div className={`${isDesktop ? "mb-8" : "mb-6"}`}>
          <label className={`block ${isDesktop ? "text-sm" : "text-xs"} font-medium mb-2 text-gray-700`}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Payment for services, Product purchase, etc."
            className={`w-full ${isDesktop ? "p-4 text-base" : "p-3 text-sm"} bg-white rounded-lg border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all`}
            rows={isDesktop ? 5 : 4}
            maxLength={200}
            autoFocus
          />
          <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-2`}>
            {description.length}/200 characters
          </p>
        </div>

        {/* Quick Description Options - Stripe-like */}
        <div className={`${isDesktop ? "mb-8" : "mb-6"}`}>
          <p className={`${isDesktop ? "text-sm" : "text-xs"} font-medium mb-3 text-gray-700`}>Quick options</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Payment for services",
              "Product purchase",
              "Consultation fee",
              "Event ticket",
              "Subscription payment",
              "Other",
            ].map((option) => (
              <button
                key={option}
                onClick={() => setDescription(option)}
                className={`${isDesktop ? "py-2 px-4 text-sm" : "py-1.5 px-3 text-xs"} bg-white border border-gray-300 rounded-lg hover:border-accent-primary hover:bg-accent-primary/5 transition-all ${description === option ? "border-accent-primary bg-accent-primary/10 text-accent-primary" : "text-gray-700"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* Create Request Button - Stripe-like */}
        <div className={`mt-auto ${isDesktop ? "max-w-md mx-auto w-full" : "pb-24"}`}>
          <button
            onClick={handleCreateInvoice}
            disabled={!isValidDescription || loadingRate || createInvoiceMutation.isPending}
            className={`w-full flex items-center justify-center ${isDesktop ? "py-3.5 px-4 text-base" : "py-3 px-4 text-sm"} rounded-lg font-medium bg-accent-primary text-white hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
          >
            {loadingRate ? "Loading..." : createInvoiceMutation.isPending ? "Creating..." : "Create Payment Request"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
