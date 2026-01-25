import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";
import { useRequest } from "../context";
import useCreateInvoice from "@/hooks/data/use-create-invoice";
import useKYCStatus from "@/hooks/data/use-kyc-status";
import ActionButton from "@/components/ui/action-button";
import { useNavigate } from "react-router";
import rift from "@/lib/rift";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";

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
      className="w-full h-full p-4 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={handleBack}
          className="mr-4 p-2 rounded-full hover:bg-surface-subtle transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">
          {requestType === "topup" ? "Top Up Account" : "Request Payment"}
        </h1>
      </div>

      {/* Description Input */}
      <div className="flex-1 flex flex-col">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium mb-2">Add Description</h2>
          <p className="text-text-subtle">
            {requestType === "topup"
              ? "What is this top-up for?"
              : "What is this payment for?"}
          </p>
        </div>

        {/* Amount Summary */}
        <div className="bg-surface-subtle rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-text-subtle text-sm">
              {requestType === "topup" ? "Adding to account" : "Requesting"}
            </p>
            <p className="text-2xl font-bold">
              {currencySymbol} {(requestData.amount || 0).toLocaleString()} ({requestCurrency})
            </p>
            {sellingRate && withdrawalRate && (
              <div className="mt-3 pt-3 border-t border-surface">
                <p className="text-xs text-text-subtle mb-1">
                  You will receive
                </p>
                <p className="text-lg font-semibold text-green-600">
                  {currencySymbol}{" "}
                  {requestCurrency === "USD" 
                    ? (requestData.amount || 0).toFixed(2)
                    : (((requestData.amount || 0) / sellingRate) * withdrawalRate).toLocaleString(undefined, { maximumFractionDigits: 2 })
                  } ({requestCurrency})
                </p>
                <p className="text-xs text-text-subtle mt-1">in your wallet</p>
              </div>
            )}
          </div>
        </div>

        {/* Description Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Payment for services, Product purchase, etc."
            className="w-full p-3 bg-surface-subtle rounded-lg border border-surface resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
            rows={4}
            maxLength={200}
            autoFocus
          />
          <p className="text-xs text-text-subtle mt-1">
            {description.length}/200 characters
          </p>
        </div>

        {/* Quick Description Options */}
        <div className="mb-8">
          <p className="text-sm font-medium mb-3">Quick options:</p>
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
                className="py-2 px-3 text-sm bg-surface-subtle rounded-lg hover:bg-surface transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Request Button */}
      <div className="mt-auto">
        <ActionButton
          onClick={handleCreateInvoice}
          disabled={!isValidDescription || loadingRate}
          loading={createInvoiceMutation.isPending || loadingRate}
          className="w-full"
        >
          {loadingRate ? "Loading..." : "Create Payment Request"}
        </ActionButton>
      </div>
    </motion.div>
  );
}
