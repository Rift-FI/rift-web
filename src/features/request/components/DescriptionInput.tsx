import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";
import { useRequest } from "../context";
import useCreateInvoice from "@/hooks/data/use-create-invoice";
import ActionButton from "@/components/ui/action-button";
import rift from "@/lib/rift";

export default function DescriptionInput() {
  const { requestData, updateRequestData, setCurrentStep, setCreatedInvoice } = useRequest();
  const [description, setDescription] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const createInvoiceMutation = useCreateInvoice();

  // Fetch exchange rate on component mount
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) {
          throw new Error("No authentication token found");
        }
        
        rift.setBearerToken(authToken);
        
        // Get exchange rate for KES
        const response = await rift.offramp.previewExchangeRate({
          currency: "KES" as any
        });
        
        setExchangeRate(response.rate);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        // Fallback to approximate rate if API fails
        setExchangeRate(136); // Approximate 136 KES = 1 USD
        toast.warning("Using approximate exchange rate");
      } finally {
        setLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, []);

  const handleBack = () => {
    setCurrentStep("amount");
  };

  const handleCreateInvoice = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!exchangeRate) {
      toast.error("Exchange rate not loaded. Please try again.");
      return;
    }

    try {
      // Convert KES amount to USD using the fetched exchange rate
      const kesAmount = requestData.amount || 0;
      const usdAmount = kesAmount / exchangeRate;

      const invoiceRequest = {
        ...requestData,
        amount: usdAmount, // Send USD amount to API
        description: description.trim(),
      } as any;

      const response = await createInvoiceMutation.mutateAsync(invoiceRequest);
      
      // Store both KES and USD amounts for display purposes
      const invoiceWithKes = {
        ...response,
        kesAmount: kesAmount, // Store original KES amount for display
      };
      
      setCreatedInvoice(invoiceWithKes);
      setCurrentStep("sharing");
      toast.success("Payment request created successfully!");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create payment request. Please try again.");
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
        <h1 className="text-xl font-semibold">Request Payment</h1>
      </div>

      {/* Description Input */}
      <div className="flex-1 flex flex-col">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium mb-2">Add Description</h2>
          <p className="text-text-subtle">What is this payment for?</p>
        </div>

        {/* Amount Summary */}
        <div className="bg-surface-subtle rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-text-subtle text-sm">Requesting</p>
            <p className="text-2xl font-bold">KSh {(requestData.amount || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Description Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
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
              "Other"
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